'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RealtimeSync({ evaluationId }: { evaluationId: string }) {
    const router = useRouter()

    useEffect(() => {
        if (!evaluationId) return

        const supabase = createClient()

        console.log(`📡 [RealtimeSync] Conectando a Supabase para evaluation_id: ${evaluationId}`)

        const channel = supabase
            .channel(`realtime_eval_${evaluationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'dynamic_tests',
                    filter: `evaluation_id=eq.${evaluationId}`
                },
                (payload) => {
                    console.log('🔄 [RealtimeSync] DB cambio detectado en dynamic_tests:', payload)
                    
                    // 1. Refresh Server Components (Re-fetches dynamicTests for B, D, and page totals)
                    router.refresh()

                    // 2. Dispatch global client event for Dimension components that manage their own Client State (like Dimension A)
                    // The internal handling guarantees that if there are manual overrides, the hook logic skips destructive overwrites.
                    window.dispatchEvent(new CustomEvent('evaluator_db_updated', { 
                        detail: { evaluationId, trigger: payload.eventType } 
                    }))
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [RealtimeSync] Suscrito a WebSockets exitosamente')
                } else if (status === 'CLOSED') {
                    console.log('❌ [RealtimeSync] Desconectado')
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ [RealtimeSync] Error en el canal')
                }
            })

        return () => {
            console.log('🔌 [RealtimeSync] Limpiando suscripción')
            supabase.removeChannel(channel)
        }
    }, [evaluationId, router])

    // Headless component
    return null
}
