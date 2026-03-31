'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { Bot, User, Send, ChevronDown, ChevronUp, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react'
import { handleCandidateChat, generateDynamicCaseA4 } from '@/app/actions/ai'
import { saveA4ChatSession, getA4State, saveA4Case } from '@/app/actions/candidate/a4'

export function ChatbotA4({ evaluationId }: { evaluationId: string | null }) {
    const [caseText, setCaseText] = useState<string | null>(null)
    const [caseCollapsed, setCaseCollapsed] = useState(false)
    const [loadingCase, setLoadingCase] = useState(true)
    const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isFinishing, setIsFinishing] = useState(false)
    const [isFinished, setIsFinished] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

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
                        // Reconstruir mensajes desde el log de texto
                        // Formato: ROLE: TEXT
                        const lines = state.history.split('\n')
                        const restored: { role: 'ai' | 'user'; text: string }[] = []

                        lines.forEach((line: string) => {
                            if (line.startsWith('USER: ')) restored.push({ role: 'user', text: line.replace('USER: ', '') })
                            if (line.startsWith('AI: ')) restored.push({ role: 'ai', text: line.replace('AI: ', '') })
                        })
                        setMessages(restored)

                        // Si está finalizado y no hay mensaje de éxito final, agregarlo si es necesario
                        // (Aunque suele estar en el historial ya guardado)
                    } else {
                        // Caso existe pero sin chat previo
                        setMessages([{
                            role: 'ai',
                            text: 'Bienvenido al módulo de Troubleshooting. Arriba puedes ver el caso práctico. Usa esta consola para investigar.'
                        }])
                    }
                } else {
                    // 2. Si no hay caso previo, generar uno nuevo
                    const generated = await generateDynamicCaseA4()
                    setCaseText(generated)
                    await saveA4Case(evaluationId, generated) // Persistir inmediatamente

                    setMessages([{
                        role: 'ai',
                        text: 'Bienvenido al módulo de Troubleshooting. Arriba puedes ver el caso práctico. Usa esta consola para investigar: pide logs, métricas, estados de servicios, o cualquier dato que necesites para entender la causa raíz.'
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
    }, [evaluationId])

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
                    <span>Generando caso práctico...</span>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Pinned Case Scenario */}
            {caseText && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <button
                        onClick={() => setCaseCollapsed(!caseCollapsed)}
                        className="w-full flex items-center justify-between text-left"
                    >
                        <h4 className="font-bold text-blue-800 flex items-center gap-2 text-sm">
                            📋 Caso Práctico A4 — Léelo con atención antes de empezar
                        </h4>
                        {caseCollapsed ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronUp className="h-4 w-4 text-blue-600" />}
                    </button>
                    {!caseCollapsed && (
                        <div className="mt-3 text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">
                            {caseText}
                        </div>
                    )}
                </div>
            )}

            {/* Chat */}
            <Card className="bg-card border-border shadow-sm flex flex-col h-[500px]">
                <CardHeader className="border-b border-border py-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 text-primary drop-shadow-sm">
                        <NextImage src="/icons/AIAgent.png" alt="IA" width={40} height={40} className="drop-shadow-md" /> Consola de Investigación IA
                    </CardTitle>

                    {!isFinished && messages.length >= 2 && (
                        <Button
                            onClick={handleFinish}
                            disabled={isFinishing || !evaluationId}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm font-bold"
                        >
                            {isFinishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Finalizar Investigación
                        </Button>
                    )}
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 shadow-sm border ${msg.role === 'user'
                                ? 'bg-primary/10 border-primary/20 text-foreground'
                                : 'bg-secondary border-secondary/50 text-secondary-foreground'
                                }`}>
                                <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-mono uppercase">
                                    {msg.role === 'user' ? <User className="w-3 h-3 text-primary" /> : <NextImage src="/icons/AIAgent.png" alt="IA" width={24} height={24} />}
                                    {msg.role}
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-secondary rounded-lg p-3 text-sm text-secondary-foreground animate-pulse border border-border">
                                Generando telemetría simulada...
                            </div>
                        </div>
                    )}
                    {isFinished && (
                        <div className="flex justify-center pt-4">
                            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Investigación Completada y Evaluada
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </CardContent>

                {!isFinished && (
                    <div className="p-3 border-t border-border bg-muted/30">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onPaste={(e) => e.preventDefault()}
                                onCopy={(e) => e.preventDefault()}
                                onContextMenu={(e) => e.preventDefault()}
                                placeholder={!evaluationId ? "No hay evaluación iniciada..." : "Ej: Mostrar logs de errores del proceso afectado..."}
                                className="bg-background border-input focus-visible:ring-primary text-foreground"
                                disabled={isLoading || isFinishing || !evaluationId}
                                name="chatbot-input"
                                autoComplete="off"
                            />
                            <Button type="submit" disabled={isLoading || isFinishing || !input.trim() || !evaluationId} className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                )}
            </Card>
        </div>
    )
}
