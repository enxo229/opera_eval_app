'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

interface Props {
    evaluationId: string | null
    remainingSeconds: number | null
    totalDurationMinutes: number
    pauseCount?: number
    isPaused?: boolean
    onPauseTriggered?: (pausedAt: string) => void
}

export function EvaluationTimer({ 
    remainingSeconds, 
    totalDurationMinutes
}: Props) {
    if (remainingSeconds === null) return null

    const totalSeconds = totalDurationMinutes * 60
    const percentage = Math.min(100, Math.max(0, (remainingSeconds / totalSeconds) * 100))
    
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

    return (
        <div className="flex flex-col items-center gap-1 group select-none">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card border border-border shadow-sm rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 min-w-[120px] justify-center"
            >
                <Clock className={`h-4 w-4 ${statusColor} ${isCriticalTime ? 'animate-pulse' : ''}`} />
                <span className={`text-sm font-mono font-black tracking-wider ${statusColor}`}>
                    {timeString}
                </span>
            </motion.div>

            {/* Micro Progress Bar */}
            <div className="w-full max-w-[110px] h-1 bg-muted rounded-full overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity">
                <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${isCriticalTime ? 'bg-red-500' : isLowTime ? 'bg-amber-500' : 'bg-emerald-500'}`}
                />
            </div>
        </div>
    )
}
