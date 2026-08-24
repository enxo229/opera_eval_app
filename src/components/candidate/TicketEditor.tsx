'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { generateIncidentCaseB1 } from '@/app/actions/ai'
import { saveB1Response, getB1State, saveB1Case } from '@/app/actions/candidate/b1'
import { AlertCircle, Loader2, FileText, CheckCircle2, RotateCcw, Compass, ChevronDown, ChevronUp } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCandidateContext } from '@/context/CandidateContext'

const DEFAULT_GLPI_TEMPLATE = `[GLPI - INCIDENTE] 
Fecha y Hora (UTC): 
Servidor / Microservicio: 
Prioridad: 
Descripción Técnica y Métricas (Dynatrace / Grafana): 
Escalamiento (AlertOps / Microsoft Teams): 
Resolución Aplicada: 
Impacto al Negocio / Tiempo Total: `

const FORMAL_TICKET_TEMPLATE = `[INCIDENTE P1/P2] - [Título o Resumen del Incidente]

1. INFORMACIÓN GENERAL:
• Servicio afectado: [Nombre del servicio o componente afectado]
• Severidad / Prioridad: [P1 / P2 / P3]
• Estado: [Investigación / Mitigado / Resuelto]

2. SÍNTOMAS E IMPACTO EN SLO:
• Síntomas observados: [Describir tasa de errores, latencia o anomalías registradas]
• Impacto en usuarios / SLO: [Efecto directo en el servicio y presupuesto de error]

3. CAUSA RAÍZ O HIPÓTESIS TÉCNICA:
• Causa identificada: [Explicación técnica del origen del problema]

4. ACCIONES REALIZADAS Y SIGUIENTES PASOS:
• Mitigación o acciones ejecutadas: [Pasos aplicados para estabilizar]
• Escalado / Responsables: [Equipo o rol asignado para seguimiento]
• Acciones preventivas: [Recomendaciones para prevenir reincidencia]`

interface TicketEditorProps {
    evaluationId: string | null
    onComplete?: (ticket: string, caseContext: string) => void
}

export function TicketEditor({ evaluationId, onComplete }: TicketEditorProps) {
    let profileTrack = 'general'
    let incrementBypassCount = () => {}
    try {
        const ctx = useCandidateContext()
        if (ctx?.profileTrack) profileTrack = ctx.profileTrack
        if (ctx?.incrementBypassCount) incrementBypassCount = ctx.incrementBypassCount
    } catch {
        // Fallback if rendered outside provider
    }

    const defaultTemplate = profileTrack === 'otel_expert' ? FORMAL_TICKET_TEMPLATE : DEFAULT_GLPI_TEMPLATE

    const [ticket, setTicket] = useState(defaultTemplate)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [caseText, setCaseText] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [guideCollapsed, setGuideCollapsed] = useState(false)
    const [caseCollapsed, setCaseCollapsed] = useState(false)
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)

    const handleBypassAttempt = (e: React.SyntheticEvent) => {
        e.preventDefault()
        incrementBypassCount()
    }

    // Notify parent
    useEffect(() => {
        if (submitted && onComplete) {
            onComplete(ticket, caseText || '')
        }
    }, [submitted, onComplete, ticket, caseText])

    // Load state on mount
    useEffect(() => {
        async function loadState() {
            if (!evaluationId) {
                setLoading(false)
                return
            }

            try {
                const state = await getB1State(evaluationId)

                if (state.caseText) {
                    setCaseText(state.caseText)
                } else {
                    const generated = await generateIncidentCaseB1(profileTrack)
                    const res = await saveB1Case(evaluationId, generated)
                    if (res.success) {
                        setCaseText(generated)
                    } else {
                        console.error('Persistence Error (B1_CASE):', res.error)
                        setCaseText(generated)
                    }
                }

                if (state.ticketText) {
                    setTicket(state.ticketText)
                } else {
                    setTicket(defaultTemplate)
                }

                if (state.isFinished) {
                    setSubmitted(true)
                }

            } catch (e) {
                console.error('Error loading B1 state:', e)
            } finally {
                setLoading(false)
            }
        }
        loadState()
    }, [evaluationId, defaultTemplate, profileTrack])

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

    const wordCount = ticket.trim() ? ticket.trim().split(/\s+/).length : 0

    if (loading) {
        return (
            <Card className="bg-card border-border shadow-sm">
                <CardContent className="flex items-center justify-center p-12 gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando escenario de incidente...</span>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Quick Module Instructions Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <button
                    onClick={() => setGuideCollapsed(!guideCollapsed)}
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                    <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 text-sm">
                        <Compass className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        Guía del Módulo — ¿Cómo redactar tu ticket de incidente?
                    </h4>
                    {guideCollapsed ? <ChevronDown className="h-4 w-4 text-amber-600" /> : <ChevronUp className="h-4 w-4 text-amber-600" />}
                </button>
                {!guideCollapsed && (
                    <div className="text-xs text-amber-900/90 dark:text-amber-200/90 space-y-2 pt-2 border-t border-amber-500/20">
                        <p className="font-semibold">Sigue estos pasos para completar tu documentación de Ticket en {profileTrack === 'otel_expert' ? 'ITSM' : 'GLPI'}:</p>
                        <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                            <li><strong>Lee el Escenario:</strong> Revisa la alerta y los síntomas reportados en la tarjeta informativa.</li>
                            <li><strong>Cubre los aspectos clave:</strong> Severidad, Impacto en Usuarios/Negocio, Diagnóstico Técnico y Acciones de Mitigación/Escalamiento.</li>
                            <li><strong>Usa la plantilla:</strong> Completa los campos solicitados para estructurar formalmente tu entrega.</li>
                            <li><strong>Envía tu registro:</strong> Haz clic en el botón <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold text-[10px]">Enviar y Finalizar B1</span> al terminar.</li>
                        </ol>
                    </div>
                )}
            </div>

            {/* Dynamic Case Display */}
            {caseText && (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <button
                        onClick={() => setCaseCollapsed(!caseCollapsed)}
                        className="w-full flex items-center justify-between text-left cursor-pointer"
                    >
                        <h4 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 text-sm">
                            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" /> ESCENARIO DEL INCIDENTE B1 — LÉELO CON ATENCIÓN
                        </h4>
                        {caseCollapsed ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronUp className="h-4 w-4 text-blue-600" />}
                    </button>
                    {!caseCollapsed && (
                        <div className="mt-3 text-sm text-blue-950 dark:text-blue-200 whitespace-pre-wrap leading-relaxed border-l-2 border-blue-500/40 pl-3 italic">
                            {caseText}
                        </div>
                    )}
                </div>
            )}

            {/* Ticket Editor Card */}
            <Card className="bg-card border-border shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-4 bg-muted/30 py-3 border-b border-border">
                    <CardTitle className="text-foreground text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" /> {profileTrack === 'otel_expert' ? 'B1: Documentación del Ticket (ITSM)' : 'B1: Comunicación Técnica Escrita (Registro en GLPI)'}
                    </CardTitle>
                    {submitted && (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-bold text-xs border border-emerald-500/20">
                            <CheckCircle2 className="h-4 w-4" /> Ticket Registrado
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    {!submitted ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-foreground">Tu documentación del Ticket</label>
                                    <p className="text-xs text-muted-foreground">
                                        Completa la plantilla formal con los datos del escenario y las métricas observadas.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`font-mono text-xs font-bold ${wordCount >= 40 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                                        {wordCount} palabras
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowRestoreConfirm(true)}
                                        className="text-xs h-8 gap-1.5 text-primary border-primary/20 hover:bg-primary/10 transition-colors shrink-0 cursor-pointer"
                                        title="Restablecer los campos base de la plantilla"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Restaurar Plantilla
                                    </Button>
                                </div>

                                {/* Confirmation Dialog */}
                                <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="text-lg flex items-center gap-2 text-foreground">
                                                <RotateCcw className="h-5 w-5 text-amber-500" />
                                                ¿Restaurar plantilla inicial?
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="py-2 text-sm text-muted-foreground leading-relaxed">
                                            Esta acción reemplazará todo lo que hayas redactado en el editor por los campos base de la plantilla. ¿Deseas continuar?
                                        </div>
                                        <div className="flex justify-end gap-3 mt-4">
                                            <Button 
                                                variant="outline" 
                                                type="button"
                                                onClick={() => setShowRestoreConfirm(false)}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button 
                                                type="button"
                                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                                onClick={() => {
                                                    setTicket(defaultTemplate)
                                                    setShowRestoreConfirm(false)
                                                }}
                                            >
                                                Restaurar Plantilla
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <Textarea
                                placeholder={defaultTemplate}
                                className="min-h-[280px] bg-background border-border text-foreground font-mono resize-y focus-visible:ring-primary text-sm p-4 leading-relaxed"
                                value={ticket}
                                onChange={(e) => setTicket(e.target.value)}
                                onPaste={handleBypassAttempt}
                                onCopy={handleBypassAttempt}
                                onCut={handleBypassAttempt}
                                onContextMenu={handleBypassAttempt}
                                disabled={isSubmitting}
                            />

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs text-muted-foreground italic">
                                    * El pegado de texto está deshabilitado. Una vez guardado no podrás modificar tu entrega.
                                </span>
                                <Button
                                    onClick={handleSubmit}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-lg transition-all active:scale-95 h-11"
                                    disabled={!ticket.trim() || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Guardando y evaluando con IA...
                                        </>
                                    ) : (
                                        'Enviar y Finalizar B1'
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-xl text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 mb-1">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-bold text-xl text-emerald-700 dark:text-emerald-300">¡Ticket Guardado y Registrado!</h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                    Tu documentación ha sido registrada y analizada por el evaluador de IA.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tu Registro Enviado:</label>
                                <div className="p-4 bg-muted/30 border border-border rounded-xl font-mono text-sm whitespace-pre-wrap text-foreground min-h-[150px] leading-relaxed">
                                    {ticket}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
