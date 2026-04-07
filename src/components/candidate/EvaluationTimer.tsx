'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle, Pause, Play, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { pauseEvaluation } from '@/app/actions/candidate/evaluation'

interface Props {
    evaluationId: string | null
    remainingSeconds: number | null
    totalDurationMinutes: number
    pauseCount: number
    isPaused: boolean
    onPauseTriggered?: (pausedAt: string) => void
}

export function EvaluationTimer({ 
    evaluationId, 
    remainingSeconds, 
    totalDurationMinutes, 
    pauseCount,
    isPaused,
    onPauseTriggered
}: Props) {
    const [isSubmittingPause, setIsSubmittingPause] = useState(false)

    if (remainingSeconds === null) return null

    const totalSeconds = totalDurationMinutes * 60
    const percentage = (remainingSeconds / totalSeconds) * 100
    
    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

    const isLowTime = remainingSeconds < 600
    const isCriticalTime = remainingSeconds < 120
    
    const statusColor = isCriticalTime 
        ? 'text-red-500' 
        : isLowTime 
            ? 'text-amber-500' 
            : 'text-emerald-500'

    const handlePauseClick = async () => {
        if (!evaluationId || isPaused || pauseCount >= 2) return
        
        setIsSubmittingPause(true)
        const res = await pauseEvaluation(evaluationId)
        if (res.success) {
            const now = new Date().toISOString()
            onPauseTriggered?.(now)
        } else {
            alert(res.error || 'No se pudo pausar la prueba')
        }
        setIsSubmittingPause(false)
    }

    return (
        <div className="flex flex-col items-center gap-1 group">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-50 border border-slate-200/50 shadow-sm rounded-xl px-3 py-1 flex items-center gap-3 min-w-[140px]"
            >
                <div className="flex items-center gap-2 flex-1">
                    <Clock className={`h-3.5 w-3.5 ${statusColor} ${isCriticalTime ? 'animate-pulse' : ''}`} />
                    <span className={`text-sm font-mono font-black ${statusColor}`}>
                        {timeString}
                    </span>
                    {isPaused && (
                        <span className="text-[8px] font-black text-amber-500 animate-pulse uppercase tracking-tighter">Pausado</span>
                    )}
                </div>

                {!isPaused && pauseCount < 2 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePauseClick}
                        disabled={isSubmittingPause}
                        className="h-6 w-6 rounded-md hover:bg-white text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200 shadow-none transition-all"
                        title={`Pausar Prueba (${2 - pauseCount} restantes)`}
                    >
                        {isSubmittingPause ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Pause className="h-3 w-3 fill-current" />
                        )}
                    </Button>
                )}
            </motion.div>

            {/* Micro Progress Bar - More subtle for header */}
            <div className="w-full max-w-[120px] h-1 bg-slate-100 rounded-full overflow-hidden opacity-40 group-hover:opacity-100 transition-opacity">
                <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${isCriticalTime ? 'bg-red-500' : isLowTime ? 'bg-amber-500' : 'bg-emerald-500'}`}
                />
            </div>
        </div>
    )
}
