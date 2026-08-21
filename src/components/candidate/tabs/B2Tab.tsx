'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BQuestion } from '@/app/actions/ai'
import { Loader2, CheckCircle2, Sparkles, Users, Compass, AlertCircle } from 'lucide-react'
import { useCandidateContext } from '@/context/CandidateContext'

interface B2TabProps {
    b2QuestionsGenerated: boolean
    b2QuestionsLoading: boolean
    b2Questions: BQuestion[]
    b2Answers: Record<string, string>
    setB2Answers: React.Dispatch<React.SetStateAction<Record<string, string>>>
    b2Submitted: boolean
    b2Submitting: boolean
    evaluationId: string | null
    allB2Answered: boolean
    handleGenerateB2Questions: () => void
    handleSubmitB2: () => void
}

export function B2Tab({
    b2QuestionsGenerated,
    b2QuestionsLoading,
    b2Questions,
    b2Answers,
    setB2Answers,
    b2Submitted,
    b2Submitting,
    evaluationId,
    allB2Answered,
    handleGenerateB2Questions,
    handleSubmitB2
}: B2TabProps) {
    const ctx = useCandidateContext()

    const isOtel = ctx.profileTrack === 'otel_expert'

    const handleBypassAttempt = (e: React.SyntheticEvent) => {
        e.preventDefault()
        ctx.incrementBypassCount()
    }

    return (
        <div className="space-y-6">
            {/* Header Description */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-2">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-500" />
                    {isOtel ? 'B. Competencias Situacionales SRE' : 'B2-B6. Competencias Blandas & Gestión de Situaciones'}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    {isOtel
                        ? 'Responde brevemente a los escenarios de adaptabilidad bajo presión y colaboración blameless en entornos SRE.'
                        : 'Responde brevemente a los siguientes escenarios de resolución de problemas, negociación y trabajo en equipo.'
                    }
                </p>
            </div>

            {/* Instruction Card */}
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    Guía de la Sección — ¿Cómo responder este apartado?
                </div>
                <div className="text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5 leading-relaxed">
                    <p>• <strong>Responde de forma clara y directa:</strong> Se sugiere una extensión de <strong>~40 a 60 palabras</strong> por escenario.</p>
                    <p>• <strong>Basado en tu experiencia real:</strong> Describe cómo actuarías en cada situación respetando las buenas prácticas de ingeniería y SRE.</p>
                    <p>• <strong>Seguridad:</strong> El pegado de texto externo está inhabilitado y auditado.</p>
                </div>
            </div>

            {!b2QuestionsGenerated ? (
                <div className="text-center py-8 bg-card border border-border rounded-xl">
                    <p className="text-muted-foreground mb-4 text-sm">
                        {isOtel ? 'Genera los escenarios situacionales SRE.' : 'Genera los escenarios situacionales para la sección B2-B6.'}
                    </p>
                    <Button onClick={handleGenerateB2Questions} disabled={b2QuestionsLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                        {b2QuestionsLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generando escenarios...</>
                        ) : (
                            <><Sparkles className="h-4 w-4 mr-2" /> {isOtel ? 'Generar Escenarios SRE' : 'Generar Escenarios B2-B6'}</>
                        )}
                    </Button>
                </div>
            ) : b2QuestionsLoading ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
                    <p className="text-sm font-medium text-muted-foreground">Cargando escenarios y restaurando respuestas...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {b2Questions.map((q) => {
                        const answer = b2Answers[q.subcategory] || ''
                        const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0

                        return (
                            <Card key={q.subcategory} className="border-border shadow-xs overflow-hidden">
                                <CardHeader className="bg-muted/30 pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                            <span className="bg-indigo-600 text-white text-xs font-mono px-2 py-0.5 rounded">
                                                {q.subcategory}
                                            </span>
                                            {q.label}
                                        </CardTitle>
                                        {b2Submitted && (
                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Enviado
                                            </span>
                                        )}
                                    </div>
                                    <CardDescription className="text-sm font-medium text-foreground/90 pt-2 leading-relaxed">
                                        {q.question}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="relative">
                                        <textarea
                                            value={answer}
                                            disabled={b2Submitted || b2Submitting}
                                            onChange={(e) => setB2Answers(prev => ({ ...prev, [q.subcategory]: e.target.value }))}
                                            onPaste={handleBypassAttempt}
                                            onCopy={handleBypassAttempt}
                                            onCut={handleBypassAttempt}
                                            onContextMenu={handleBypassAttempt}
                                            placeholder="Escribe tu respuesta aquí manteniendo las recomendaciones de extensión..."
                                            className="w-full min-h-[120px] p-3 rounded-lg border border-input bg-background text-foreground text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500/50 resize-y leading-relaxed"
                                        />
                                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                                            <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                                                <AlertCircle className="h-3 w-3" /> Pegado deshabilitado por auditoría
                                            </span>
                                            <span className={`font-mono ${wordCount >= 40 && wordCount <= 75 ? 'text-emerald-600 font-bold' : ''}`}>
                                                {wordCount} palabras (Sugerido: ~40-60)
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}

                    <div className="pt-2 flex justify-end">
                        <Button
                            onClick={handleSubmitB2}
                            disabled={!allB2Answered || b2Submitting || b2Submitted}
                            className={`font-bold transition-all h-11 px-6 ${
                                b2Submitted
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                            }`}
                        >
                            {b2Submitting ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando y evaluando con IA...</>
                            ) : b2Submitted ? (
                                <><CheckCircle2 className="h-4 w-4 mr-2" /> {isOtel ? 'Sección B completada' : 'Sección B2-B6 Completada'}</>
                            ) : (
                                isOtel ? 'Guardar y Confirmar Sección B' : 'Guardar y Confirmar B2-B6'
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
