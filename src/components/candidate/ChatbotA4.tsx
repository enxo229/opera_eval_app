'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Bot, User, Send } from 'lucide-react'
import { handleCandidateChat } from '@/app/actions/ai'

export function ChatbotA4() {
    const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
        {
            role: 'ai',
            text: 'Hola. Estás investigando un problema en srv-prod-payments-01. Soy tu asistente de IA técnica. ¿Qué consulta de logs o métricas de Dynatrace/Grafana te gustaría formular para entender la causa raíz?'
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    async function handleSend() {
        if (!input.trim()) return
        const newMsg = { role: 'user' as const, text: input }
        setMessages((prev) => [...prev, newMsg])
        setInput('')
        setIsLoading(true)

        try {
            const historyLog = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')
            const reply = await handleCandidateChat(historyLog, newMsg.text)

            setMessages((prev) => [...prev, { role: 'ai', text: reply }])
        } catch (e) {
            setMessages((prev) => [...prev, { role: 'ai', text: 'Error: Rate Limit Exceeded o Timeout de API. Reintenta en unos segundos.' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="bg-card border-border shadow-sm flex flex-col h-[500px]">
            <CardHeader className="border-b border-border py-4">
                <CardTitle className="text-xl flex items-center gap-2 text-primary drop-shadow-sm">
                    <Bot className="w-5 h-5 drop-shadow-md" /> Consola de Ayuda IA
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 shadow-sm border ${msg.role === 'user'
                            ? 'bg-primary/10 border-primary/20 text-foreground'
                            : 'bg-secondary border-secondary/50 text-secondary-foreground'
                            }`}>
                            <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-mono uppercase">
                                {msg.role === 'user' ? <User className="w-3 h-3 drop-shadow-sm text-primary" /> : <Bot className="w-3 h-3 drop-shadow-sm text-primary" />}
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
            </CardContent>

            <div className="p-4 border-t border-border bg-muted/30">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ej: Mostrar logs de errores de las últimas 2 horas de java_billing_worker"
                        className="bg-background border-input focus-visible:ring-primary text-foreground"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 drop-shadow-md">
                        <Send className="w-4 h-4 ml-1 drop-shadow-md" />
                    </Button>
                </form>
            </div>
        </Card>
    )
}
