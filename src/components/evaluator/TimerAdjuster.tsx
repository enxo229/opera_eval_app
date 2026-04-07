'use client'

import { useState } from 'react'
import { Clock, Plus, Timer, Loader2, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adjustEvaluationTime } from '@/app/actions/evaluator/timer'

interface Props {
    evaluationId: string
    initialDuration: number
    isStarted: boolean
}

export function TimerAdjuster({ evaluationId, initialDuration, isStarted }: Props) {
    const [currentDuration, setCurrentDuration] = useState(initialDuration)
    const [customMinutes, setCustomMinutes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    const showFeedback = (type: 'success' | 'error', msg: string) => {
        setFeedback({ type, msg })
        setTimeout(() => setFeedback(null), 3000)
    }

    const handleAdd = async (minutes: number) => {
        setIsSubmitting(true)
        const res = await adjustEvaluationTime(evaluationId, 'add', minutes)
        if (res.success && res.newDuration) {
            setCurrentDuration(res.newDuration)
            showFeedback('success', `+${minutes} min aplicados`)
        } else {
            showFeedback('error', res.error || 'Error al ajustar')
        }
        setIsSubmitting(false)
    }

    const handleSet = async () => {
        const mins = parseInt(customMinutes)
        if (isNaN(mins) || mins <= 0) {
            showFeedback('error', 'Ingresa un número válido')
            return
        }
        setIsSubmitting(true)
        const res = await adjustEvaluationTime(evaluationId, 'set', mins)
        if (res.success && res.newDuration) {
            setCurrentDuration(res.newDuration)
            setCustomMinutes('')
            showFeedback('success', `Duración ajustada a ${res.newDuration} min`)
        } else {
            showFeedback('error', res.error || 'Error al ajustar')
        }
        setIsSubmitting(false)
    }

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Timer className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temporizador</p>
                        <p className="text-lg font-black text-slate-800 font-mono">{currentDuration} min</p>
                    </div>
                </div>
                {isStarted && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 uppercase">
                        En curso
                    </span>
                )}
            </div>

            {/* Quick Add Buttons */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleAdd(5)}
                    className="flex-1 h-9 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                >
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-1" /> 5 min</>}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleAdd(10)}
                    className="flex-1 h-9 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-1" /> 10 min</>}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleAdd(15)}
                    className="flex-1 h-9 text-xs font-bold border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all"
                >
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-1" /> 15 min</>}
                </Button>
            </div>

            {/* Custom Input */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="number"
                        min="1"
                        max="180"
                        placeholder="Minutos exactos"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-9 px-3 pr-12 rounded-lg border border-slate-200 bg-white text-sm font-mono text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 uppercase">min</span>
                </div>
                <Button
                    variant="default"
                    size="sm"
                    disabled={isSubmitting || !customMinutes}
                    onClick={handleSet}
                    className="h-9 px-4 text-xs font-bold bg-primary hover:bg-primary/90"
                >
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Clock className="h-3 w-3 mr-1" /> Fijar</>}
                </Button>
            </div>

            {/* Feedback */}
            {feedback && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all animate-in fade-in slide-in-from-top-1 ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                    {feedback.type === 'success' 
                        ? <Check className="h-3.5 w-3.5" /> 
                        : <AlertTriangle className="h-3.5 w-3.5" />
                    }
                    {feedback.msg}
                </div>
            )}
        </div>
    )
}
