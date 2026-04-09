'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { regenerateNarrativeFeedbackManual } from '@/app/actions/evaluator/reports'

interface RegenerateAIButtonProps {
    evaluationId: string
}

export function RegenerateAIButton({ evaluationId }: RegenerateAIButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleRegenerate = async () => {
        setLoading(true)
        try {
            const result = await regenerateNarrativeFeedbackManual(evaluationId)
            if (result.success) {
                router.refresh()
            }
        } catch (error) {
            console.error('Error regenerando feedback:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button 
            onClick={handleRegenerate}
            disabled={loading}
            variant="outline" 
            size="sm" 
            className="no-print gap-2 border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 text-amber-700 font-bold shadow-sm"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <RefreshCw className="h-4 w-4" />
            )}
            {loading ? 'Generando...' : 'Regenerar con IA (Back up)'}
        </Button>
    )
}
