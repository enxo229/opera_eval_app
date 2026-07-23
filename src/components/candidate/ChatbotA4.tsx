'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { Bot, User, Send, ChevronDown, ChevronUp, Loader2, CheckCircle2, ShieldAlert, Compass, Sparkles, HelpCircle } from 'lucide-react'
import { handleCandidateChat, generateDynamicCaseA4 } from '@/app/actions/ai'
import { saveA4ChatSession, getA4State, saveA4Case } from '@/app/actions/candidate/a4'
import { useCandidateContext } from '@/context/CandidateContext'

export function ChatbotA4({ evaluationId, onStatusChange }: { evaluationId: string | null; onStatusChange?: (finished: boolean) => void }) {
    let profileTrack = 'general'
    try {
        const ctx = useCandidateContext()
        if (ctx?.profileTrack) profileTrack = ctx.profileTrack
    } catch {
        // Rendered outside context provider fallback
    }

    const [caseText, setCaseText] = useState<string | null>(null)
    const [caseCollapsed, setCaseCollapsed] = useState(false)
    const [guideCollapsed, setGuideCollapsed] = useState(false)
    const [loadingCase, setLoadingCase] = useState(true)
    const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isFinishing, setIsFinishing] = useState(false)
    const [isFinished, setIsFinished] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const initialGreeting = `👋 Consola de Observabilidad Simulada lista.

Estoy conectado a la telemetría de tu infraestructura (Métricas, Logs, Trazas). Revisa el Caso Práctico arriba e inicia tu investigación solicitando datos técnicos específicos.

💡 Ejemplos de lo que me puedes pedir:
• "Muestra los logs de error 5xx del servicio afectado en los últimos 15 minutos"
• "Dame el uso de CPU y memoria de los pods del clúster"
• "Muestra las trazas con latencia superior a 2000ms"

Cuando tengas suficiente evidencia, escribe en esta consola tu Diagnóstico de Causa Raíz y Plan de Mitigación, luego presiona el botón verde 'Finalizar Investigación'.`


    // Notify parent when status changes
    useEffect(() => {
        if (onStatusChange) {
            onStatusChange(isFinished)
        }
    }, [isFinished, onStatusChange])

    // Autoscroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isLoading])

    // Generate or restore dynamic case on mount
    useEffect(() => {
        async function loadCase() {
            if (!evaluationId) return
            setLoadingCase(true)

            try {
                // 1. Intentar recuperar estado previo
                const state = await getA4State(evaluationId)

                if (state.caseText) {
                    setCaseText(state.caseText)
                    setIsFinished(state.isFinished)

                    if (state.history) {
                        const lines = state.history.split('\n')
                        const restored: { role: 'ai' | 'user'; text: string }[] = []

                        lines.forEach((line: string) => {
                            if (line.startsWith('USER: ')) restored.push({ role: 'user', text: line.replace('USER: ', '') })
                            if (line.startsWith('AI: ')) restored.push({ role: 'ai', text: line.replace('AI: ', '') })
                        })
                        setMessages(restored)
                    } else {
                        setMessages([{
                            role: 'ai',
                            text: initialGreeting
                        }])
                    }
                } else {
                    // 2. Si no hay caso previo, generar uno nuevo
                    const generated = await generateDynamicCaseA4(profileTrack)
                    setCaseText(generated)
                    await saveA4Case(evaluationId, generated)

                    setMessages([{
                        role: 'ai',
                        text: initialGreeting
                    }])
                }
            } catch (e) {
                console.error('Error loading A4 state:', e)
                setCaseText('Error cargando o generando el caso. Recarga la página.')
            } finally {
                setLoadingCase(false)
            }
        }
        loadCase()
    }, [evaluationId, profileTrack])

    async function handleSend() {
        if (!input.trim() || isFinished) return
        const newMsg = { role: 'user' as const, text: input }
        setMessages((prev) => [...prev, newMsg])
        setInput('')
        setIsLoading(true)

        try {
            const historyLog = [...messages, newMsg].map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')
            const reply = await handleCandidateChat(historyLog, newMsg.text)
            setMessages((prev) => [...prev, { role: 'ai', text: reply }])
        } catch {
            setMessages((prev) => [...prev, { role: 'ai', text: 'Error: Rate Limit o Timeout. Reintenta en unos segundos.' }])
        } finally {
            setIsLoading(false)
        }
    }

    function handleChipClick(query: string) {
        if (isFinished || isLoading) return
        setInput(query)
    }

    async function handleFinish() {
        if (!evaluationId || messages.length < 2) return
        if (!confirm('¿Estás seguro de finalizar la investigación? Una vez finalizada no podrás enviar más mensajes.')) return

        setIsFinishing(true)
        try {
            const finalHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')
            const result = await saveA4ChatSession(evaluationId, finalHistory, caseText || '')
            if (result.success) {
                setIsFinished(true)
                setMessages(prev => [...prev, {
                    role: 'ai',
                    text: '✅ Investigación finalizada con éxito. Tu telemetría y el diagnóstico han sido enviados al evaluador.'
                }])
            } else {
                alert('Error al guardar: ' + result.error)
            }
        } catch (e) {
            console.error(e)
            alert('Error técnico al finalizar.')
        } finally {
            setIsFinishing(false)
        }
    }

    if (loadingCase) {
        return (
            <Card className="bg-card border-border shadow-sm h-[500px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generando caso práctico de investigación...</span>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Quick Module Instructions Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <button
                    onClick={() => setGuideCollapsed(!guideCollapsed)}
                    className="w-full flex items-center justify-between text-left"
                >
                    <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 text-sm">
                        <Compass className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        Guía del Módulo — ¿Cómo resolver esta simulación?
                    </h4>
                    {guideCollapsed ? <ChevronDown className="h-4 w-4 text-amber-600" /> : <ChevronUp className="h-4 w-4 text-amber-600" />}
                </button>
                {!guideCollapsed && (
                    <div className="text-xs text-amber-900/90 dark:text-amber-200/90 space-y-2 pt-2 border-t border-amber-500/20">
                        <p className="font-semibold">Sigue estos 4 pasos para completar tu evaluación de Troubleshooting:</p>
                        <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                            <li><strong>Lee el Caso Práctico:</strong> Revisa el reporte de incide en la tarjeta azul.</li>
                            <li><strong>Pide telemetría en la consola:</strong> Interactúa con la IA solicitando logs, métricas o trazas específicas para acotar la causa.</li>
                            <li><strong>Redacta tu Diagnóstico:</strong> Cuando identifiques el problema, escribe en el chat tu conclusión sobre la <strong>Causa Raíz</strong> y el <strong>Plan de Mitigación</strong>.</li>
                            <li><strong>Finaliza la prueba:</strong> Haz clic en el botón verde <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold text-[10px]">Finalizar Investigación</span> (arriba a la derecha) para enviar la sesión.</li>
                        </ol>
                    </div>
                )}
            </div>

            {/* Pinned Case Scenario */}
            {caseText && (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <button
                        onClick={() => setCaseCollapsed(!caseCollapsed)}
                        className="w-full flex items-center justify-between text-left"
                    >
                        <h4 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 text-sm">
                            📋 CASO PRÁCTICO A4 — LÉELO CON ATENCIÓN ANTES DE EMPEZAR
                        </h4>
                        {caseCollapsed ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronUp className="h-4 w-4 text-blue-600" />}
                    </button>
                    {!caseCollapsed && (
                        <div className="mt-3 text-sm text-blue-950 dark:text-blue-200 whitespace-pre-wrap leading-relaxed">
                            {caseText}
                        </div>
                    )}
                </div>
            )}

            {/* Chat */}
            <Card className="bg-card border-border shadow-sm flex flex-col h-[520px]">
                <CardHeader className="border-b border-border py-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 text-primary drop-shadow-sm">
                        <NextImage src="/icons/AIAgent.png" alt="IA" width={36} height={36} className="drop-shadow-md" /> Consola de Investigación IA
                    </CardTitle>

                    {!isFinished && messages.length >= 2 && (
                        <Button
                            onClick={handleFinish}
                            disabled={isFinishing || !evaluationId}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md font-bold transition-all animate-pulse"
                        >
                            {isFinishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Finalizar Investigación
                        </Button>
                    )}
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl p-3.5 shadow-sm border ${msg.role === 'user'
                                ? 'bg-primary/10 border-primary/20 text-foreground'
                                : 'bg-secondary border-secondary/50 text-secondary-foreground'
                                }`}>
                                <div className="flex items-center gap-2 mb-1.5 opacity-70 text-[11px] font-mono uppercase font-bold">
                                    {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-primary" /> : <NextImage src="/icons/AIAgent.png" alt="IA" width={20} height={20} />}
                                    {msg.role === 'user' ? 'Candidato' : 'Consola IA'}
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-secondary rounded-lg p-3 text-sm text-secondary-foreground animate-pulse border border-border flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span>Consultando fuentes de telemetría y logs...</span>
                            </div>
                        </div>
                    )}
                    {isFinished && (
                        <div className="flex justify-center pt-4">
                            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Investigación Completada y Registrada para Evaluación
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </CardContent>

                {!isFinished && (
                    <div className="p-3 border-t border-border bg-muted/30 space-y-2.5">
                        {/* Informational Prompt Guidance Hint */}
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-background/50 px-3 py-1.5 rounded-lg border border-border/60">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span><strong>Orientación de Prompt:</strong> Solicita datos específicos indicando métrica, ventana temporal o componente (ej: <em>"Muestra el consumo de CPU/Memoria"</em> o <em>"Filtra los logs por error 5xx"</em>).</span>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onPaste={(e) => e.preventDefault()}
                                onCopy={(e) => e.preventDefault()}
                                onContextMenu={(e) => e.preventDefault()}
                                placeholder={!evaluationId ? "No hay evaluación iniciada..." : "Ej: Mostrar los logs de error de las últimas 2 horas..."}
                                className="bg-background border-input focus-visible:ring-primary text-foreground text-sm"
                                disabled={isLoading || isFinishing || !evaluationId}
                                name="chatbot-input"
                                autoComplete="off"
                            />
                            <Button type="submit" disabled={isLoading || isFinishing || !input.trim() || !evaluationId} className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 font-bold">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                )}
            </Card>
        </div>
    )
}
