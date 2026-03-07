'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { evaluateTicketB1 } from '@/app/actions/ai'
import { AlertCircle, Clock } from 'lucide-react'

export function TicketEditor({ onComplete }: { onComplete?: () => void }) {
    const [ticket, setTicket] = useState('')
    const [timeLeft, setTimeLeft] = useState(20 * 60) // 20 minutes
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [feedback, setFeedback] = useState<string | null>(null)

    useEffect(() => {
        if (timeLeft <= 0) return
        const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
        return () => clearInterval(timer)
    }, [timeLeft])

    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    const isWarning = timeLeft < 300 // less than 5 mins

    async function handleSubmit() {
        setIsSubmitting(true)
        try {
            // Server action call simulated
            const result = await evaluateTicketB1(ticket)
            setFeedback(result)
            if (onComplete) onComplete()
        } catch (e) {
            console.error(e)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="bg-[#11151F] border-[#1F2937]">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-[#00A3FF] text-xl">Módulo B1: Documentación de Incidente</CardTitle>
                    <CardDescription className="text-gray-400 mt-2 max-w-2xl">
                        Son las 2:47 a.m. del martes. Recibes una alerta: &quot;CRITICAL – High CPU Usage – srv-prod-payments-01&quot;.
                        El proceso java_billing_worker generaba OutOfMemoryError. A las 3:15 a.m. se hace rollback y baja el CPU.
                        Documenta en esta caja text simualda (tipo GLPI) el incidente.
                    </CardDescription>
                </div>
                <div className={`flex items-center gap-2 font-mono text-lg p-2 rounded ${isWarning ? 'bg-red-500/10 text-red-500 font-bold animate-pulse' : 'bg-[#1F2937] text-[#E5E7EB]'}`}>
                    <Clock className="w-5 h-5" />
                    {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {feedback ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md whitespace-pre-wrap">
                        <h4 className="font-bold mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Feedback Generado por IA (Vista Previa Desarrollo)</h4>
                        {feedback}
                    </div>
                ) : (
                    <>
                        <div className="bg-[#0B0E14] border border-[#1F2937] p-2 rounded-t-md border-b-0 flex gap-2">
                            <Button size="sm" variant="secondary" className="h-7 text-xs bg-[#1F2937] hover:bg-gray-700">Negrita</Button>
                            <Button size="sm" variant="secondary" className="h-7 text-xs bg-[#1F2937] hover:bg-gray-700">Código</Button>
                        </div>
                        <Textarea
                            placeholder="Descripción del ticket..."
                            className="min-h-[250px] bg-[#0B0E14] border-[#1F2937] text-[#E5E7EB] font-mono rounded-t-none resize-none focus-visible:ring-[#00A3FF]"
                            value={ticket}
                            onChange={(e) => setTicket(e.target.value)}
                            disabled={isSubmitting || timeLeft === 0}
                        />
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                className="bg-[#00A3FF] hover:bg-[#00A3FF]/80 text-white"
                                disabled={!ticket.trim() || isSubmitting || timeLeft === 0}
                            >
                                {isSubmitting ? 'Enviando...' : 'Guardar Ticket'}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
