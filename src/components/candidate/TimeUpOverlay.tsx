'use client'

import { motion } from 'framer-motion'
import { Hourglass, AlertCircle, Home, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function TimeUpOverlay() {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-card w-full max-w-lg rounded-[2.5rem] p-10 shadow-3xl border border-white/20 text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500 animate-pulse" />
                
                <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-red-100 flex items-center justify-center shadow-inner relative group border-2 border-red-200">
                        <Hourglass className="h-12 w-12 text-red-600 animate-spin-slow" />
                        <AlertCircle className="h-6 w-6 text-red-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-slate-900 leading-tight">¡Tiempo Agotado!</h2>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            Has alcanzado el límite de tiempo definido para esta evaluación técnica. Tus respuestas han sido guardadas.
                        </p>
                    </div>

                    <div className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-left space-y-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <p className="text-sm font-bold text-slate-700">Tus respuestas están seguras y listas para revisión.</p>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed italic border-t border-slate-200/50 pt-3">
                            "El evaluador revisará los registros técnicos y tu análisis de IA para determinar el siguiente paso."
                        </p>
                    </div>

                    <div className="flex flex-col w-full gap-3">
                        <Link href="/" className="w-full">
                            <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02]">
                                <Home className="h-5 w-5 mr-3" /> Salir de la Prueba
                            </Button>
                        </Link>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Plataforma SETI SAS / CoE Observabilidad</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
