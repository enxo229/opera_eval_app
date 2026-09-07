'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RealtimeSync({ evaluationId }: { evaluationId: string }) {
    const router = useRouter()

    useEffect(() => {
        if (!evaluationId) return

        const supabase = createClient()
        let pollingInterval: NodeJS.Timeout | null = null

        console.log(`📡 [RealtimeSync] Conectando a Supabase Realtime para evaluation_id: ${evaluationId}`)

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
                    console.log('🔄 [RealtimeSync] Cambio detectado en DB (dynamic_tests):', payload)
                    
                    // 1. Refresh Server Components
                    router.refresh()

                    // 2. Dispatch global client event for Dimension components
                    window.dispatchEvent(new CustomEvent('evaluator_db_updated', { 
                        detail: { evaluationId, trigger: payload.eventType } 
                    }))
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [RealtimeSync] Suscrito a WebSockets exitosamente')
                    if (pollingInterval) {
                        clearInterval(pollingInterval)
                        pollingInterval = null
                    }
                } else if (status === 'CLOSED') {
                    console.log('ℹ️ [RealtimeSync] Canal cerrado')
                } else if (status === 'CHANNEL_ERROR') {
                    console.warn('⚠️ [RealtimeSync] Canal en tiempo real no disponible (posible falta de publicación Realtime en la tabla "dynamic_tests"). Activando polling de respaldo (cada 12s).')
                    
                    // Fallback polling if Realtime CDC fails/is disabled in Supabase publication
                    if (!pollingInterval) {
                        pollingInterval = setInterval(() => {
                            router.refresh()
                            window.dispatchEvent(new CustomEvent('evaluator_db_updated', { 
                                detail: { evaluationId, trigger: 'POLLING_FALLBACK' } 
                            }))
                        }, 12000)
                    }
                }
            })

        return () => {
            console.log('🔌 [RealtimeSync] Limpiando suscripción y polling')
            if (pollingInterval) clearInterval(pollingInterval)
            supabase.removeChannel(channel)
        }
    }, [evaluationId, router])

    // Headless component
    return null
}
