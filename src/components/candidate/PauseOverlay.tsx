'use client'

import { motion } from 'framer-motion'
import { Play, Coffee, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { resumeEvaluation } from '@/app/actions/candidate/evaluation'

interface Props {
    evaluationId: string | null
    pausedAt: string | null
    onResumeTriggered?: (pauseDeltaMs: number) => void
}

export function PauseOverlay({ evaluationId, pausedAt, onResumeTriggered }: Props) {
    const [isResuming, setIsResuming] = useState(false)

    const handleResume = async () => {
        if (!evaluationId) return
        setIsResuming(true)
        const res = await resumeEvaluation(evaluationId)
        if (res.success) {
            // Calculate the pause duration locally
            const pauseDelta = pausedAt 
                ? Date.now() - new Date(pausedAt).getTime() 
                : 0
            onResumeTriggered?.(pauseDelta)
        } else {
            alert(res.error || 'Error al reanudar la prueba')
            setIsResuming(false)
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-3xl flex items-center justify-center p-6"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200"
            >
                <div className="h-2 w-full bg-amber-500" />
                
                <div className="p-10 text-center space-y-6">
                    <div className="w-24 h-24 rounded-[2rem] bg-amber-50 flex items-center justify-center mx-auto border-2 border-amber-100 shadow-inner mb-2">
                        <Coffee className="h-12 w-12 text-amber-500" />
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-slate-900 leading-tight">Evaluación Pausada</h2>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed px-4">
                            El cronómetro se ha detenido. <br/>
                            <span className="text-slate-400 font-normal italic">El contenido de la prueba está oculto temporalmente.</span>
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100 mb-6">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                            <EyeOff className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-[11px] text-left text-slate-500 font-medium leading-tight">
                            "Descansa un momento. Tus respuestas están guardadas de forma segura en nuestros servidores."
                        </p>
                    </div>

                    <Button 
                        onClick={handleResume} 
                        disabled={isResuming}
                        className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white text-lg font-black rounded-2xl shadow-xl transition-all hover:scale-[1.02] gap-2"
                    >
                        {isResuming ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <>
                                <Play className="h-5 w-5 fill-current" />
                                REANUDAR EVALUACIÓN
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    )
}
