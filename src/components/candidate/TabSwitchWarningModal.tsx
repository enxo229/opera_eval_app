'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, ShieldAlert, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
    attemptCount: number
    maxAllowed?: number
    onDismiss: () => void
}

export function TabSwitchWarningModal({ attemptCount, maxAllowed = 4, onDismiss }: Props) {
    const isExceeded = attemptCount >= maxAllowed
    const isLastWarning = attemptCount === maxAllowed - 1
    const remaining = Math.max(0, maxAllowed - attemptCount)

    const accentColor = isExceeded 
        ? 'from-red-500 to-rose-600 border-red-200' 
        : isLastWarning 
            ? 'from-orange-500 to-amber-600 border-orange-200' 
            : 'from-amber-500 to-yellow-600 border-amber-200'

    const badgeBg = isExceeded
        ? 'bg-red-100 text-red-800 border-red-200'
        : isLastWarning
            ? 'bg-orange-100 text-orange-800 border-orange-200'
            : 'bg-amber-100 text-amber-800 border-amber-200'

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        >
            <motion.div 
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="max-w-lg w-full bg-card rounded-3xl shadow-2xl overflow-hidden border border-border"
            >
                {/* Header bar */}
                <div className={`h-2.5 w-full bg-gradient-to-r ${accentColor}`} />
                
                <div className="p-6 sm:p-8 text-center space-y-5">
                    {/* Icon container */}
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-inner border ${
                        isExceeded ? 'bg-red-50 border-red-200 text-red-600' : 'bg-amber-50 border-amber-200 text-amber-600'
                    }`}>
                        {isExceeded ? (
                            <ShieldAlert className="h-10 w-10 animate-bounce" />
                        ) : (
                            <AlertTriangle className="h-10 w-10" />
                        )}
                    </div>

                    {/* Badge */}
                    <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${badgeBg}`}>
                            {isExceeded 
                                ? `Límite Excedido • Intento ${attemptCount} de ${maxAllowed}`
                                : `Advertencia de Foco • Intento ${attemptCount} de ${maxAllowed}`}
                        </span>
                    </div>

                    {/* Title and message */}
                    <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                            {isExceeded ? '¡Límite de Salidas Superado!' : 'Cambio de Ventana Detectado'}
                        </h2>
                        <p className="text-muted-foreground text-sm leading-relaxed px-2">
                            Has salido de la pestaña o minimizado la ventana de la prueba. Recuerda que la navegación fuera de esta pantalla está restringida para garantizar la integridad de la evaluación.
                        </p>
                    </div>

                    {/* Time notice card */}
                    <div className="bg-muted/60 rounded-2xl p-4 border border-border text-left space-y-2">
                        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                            <Clock className="h-4 w-4 text-primary shrink-0" />
                            <span>El cronómetro no se detiene</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                            El reloj continúa avanzando de forma ininterrumpida. Solo tu evaluador técnico tiene la facultad de añadir tiempo extra si lo considera necesario.
                        </p>
                    </div>

                    {/* Attempt status explanation */}
                    <div className={`text-xs p-3 rounded-xl border ${
                        isExceeded 
                            ? 'bg-red-50/50 text-red-700 border-red-200/60 font-medium'
                            : 'bg-muted/40 text-muted-foreground border-border'
                    }`}>
                        {isExceeded ? (
                            <span>⚠️ Has alcanzado el límite máximo de {maxAllowed} salidas. Este y cualquier cambio posterior queda registrado como telemetría de integridad en tu reporte.</span>
                        ) : remaining === 1 ? (
                            <span>⚠️ Te queda <strong>1 solo cambio de ventana permitido</strong> antes de registrar una alerta crítica.</span>
                        ) : (
                            <span>Te quedan <strong>{remaining} cambios de ventana</strong> permitidos durante toda la prueba.</span>
                        )}
                    </div>

                    {/* Dismiss button */}
                    <Button 
                        onClick={onDismiss}
                        className={`w-full h-13 text-base font-bold rounded-xl shadow-lg transition-all hover:scale-[1.01] gap-2 ${
                            isExceeded
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        }`}
                    >
                        <span>Entendido, Continuar Evaluación</span>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    )
}
