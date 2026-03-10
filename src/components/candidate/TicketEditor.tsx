'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { generateIncidentCaseB1 } from '@/app/actions/ai'
import { saveB1Response, getB1State, saveB1Case } from '@/app/actions/candidate'
import { AlertCircle, Clock, Loader2, FileText, CheckCircle2 } from 'lucide-react'

interface TicketEditorProps {
    evaluationId: string | null
    onComplete?: (ticket: string, caseContext: string) => void
}

export function TicketEditor({ evaluationId, onComplete }: TicketEditorProps) {
    const [ticket, setTicket] = useState('')
    const [timeLeft, setTimeLeft] = useState(10 * 60) // 10 minutes
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [caseText, setCaseText] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [timerStarted, setTimerStarted] = useState(false)

    // Load state on mount
    useEffect(() => {
        async function loadState() {
            if (!evaluationId) {
                setLoading(false)
                return
            }

            try {
                // 1. Intentar cargar estado persistente
                const state = await getB1State(evaluationId)

                if (state.caseText) {
                    setCaseText(state.caseText)
                } else {
                    // Si no hay caso en DB, generarlo y persistirlo de inmediato
                    const generated = await generateIncidentCaseB1()
                    const res = await saveB1Case(evaluationId, generated)
                    if (res.success) {
                        setCaseText(generated)
                    } else {
                        // Si falla el guardado (ej: constraint), lo mostramos pero logueamos el error
                        console.error('Persistence Error (B1_CASE):', res.error)
                        setCaseText(generated)
                    }
                }

                if (state.isFinished && state.ticketText) {
                    setTicket(state.ticketText)
                    setSubmitted(true)
                }

                // Iniciar el temporizador al cargar (equivale a entrar en la pestaña)
                setTimerStarted(true)

            } catch (e) {
                console.error('Error loading B1 state:', e)
            } finally {
                setLoading(false)
            }
        }
        loadState()
    }, [evaluationId])

    // Timer logic
    useEffect(() => {
        if (!timerStarted || timeLeft <= 0 || submitted || loading) return
        const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
        return () => clearInterval(timer)
    }, [timerStarted, timeLeft, submitted, loading])

    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    const isWarning = timeLeft < 60 // Rojo a falta de 1 minuto

    async function handleSubmit() {
        if (!caseText || !evaluationId) return
        setIsSubmitting(true)
        try {
            const res = await saveB1Response(evaluationId, ticket, caseText)
            if (res.success) {
                setSubmitted(true)
                if (onComplete) onComplete(ticket, caseText)
            } else {
                alert('Error al guardar: ' + res.error)
            }
        } catch (e) {
            alert('Error inesperado al guardar.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <Card className="bg-card border-border shadow-sm">
                <CardContent className="flex items-center justify-center p-12 gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando escenario...</span>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-border shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-4 bg-muted/30 pb-4">
                <div className="flex-1">
                    <CardTitle className="text-foreground text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" /> B1: Comunicación Técnica Escrita
                    </CardTitle>
                </div>
                {!submitted && (
                    <div className={`flex items-center gap-2 font-mono text-lg p-2 rounded shrink-0 transition-all ${isWarning ? 'bg-red-500/20 text-red-600 font-black animate-pulse border border-red-500/50' : 'bg-secondary/50 text-secondary-foreground'}`}>
                        <Clock className={`w-5 h-5 ${isWarning ? 'text-red-600' : 'text-primary'}`} />
                        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                    </div>
                )}
                {submitted && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 p-2 rounded font-medium text-sm border border-emerald-500/20">
                        <CheckCircle2 className="h-4 w-4" /> Finalizado
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {/* Dynamic Case Display */}
                {caseText && (
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-5">
                        <h4 className="font-bold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-500">
                            <AlertCircle className="w-5 h-5" /> Escenario del Incidente
                        </h4>
                        <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed italic border-l-2 border-amber-500/30 pl-4">
                            "{caseText}"
                        </div>
                    </div>
                )}

                {/* Ticket Editor */}
                {!submitted ? (
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground">Tu documentación del Ticket (ITSM)</label>
                            <p className="text-xs text-muted-foreground">
                                Describe qué pasó, qué hiciste y el impacto observado. Usa un lenguaje profesional.
                            </p>
                        </div>

                        <Textarea
                            placeholder="Ej: [INCIDENTE] Alto consumo CPU srv-prod... 
Atención de alerta a las 02:47h..."
                            className="min-h-[300px] bg-background border-border text-foreground font-mono resize-none focus-visible:ring-primary text-sm p-4 leading-relaxed"
                            value={ticket}
                            onChange={(e) => setTicket(e.target.value)}
                            disabled={isSubmitting || (timeLeft <= 0 && false) /* El usuario dijo que si llega a cero no pasa nada */}
                        />

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-xs text-muted-foreground italic">
                                * Una vez guardado, no podrás editar tu respuesta.
                            </span>
                            <Button
                                onClick={handleSubmit}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-lg transition-all active:scale-95"
                                disabled={!ticket.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : 'Enviar y Finalizar B1'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-lg text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mb-2">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h3 className="font-bold text-xl text-emerald-600 dark:text-emerald-500">¡Ticket Guardado!</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Tu respuesta ha sido registrada y está lista para ser evaluada por el líder técnico.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tu Registro Enviado:</label>
                            <div className="p-4 bg-muted/30 border border-border rounded-md font-mono text-sm whitespace-pre-wrap text-foreground/80 min-h-[150px]">
                                {ticket}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
