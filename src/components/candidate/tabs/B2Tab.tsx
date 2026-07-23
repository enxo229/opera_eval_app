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
                    B2-B6. Competencias Blandas & Gestión de Situaciones
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Responde brevemente a los siguientes escenarios de resolución de problemas, negociación y trabajo en equipo.
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
                    <p className="text-muted-foreground mb-4 text-sm">Genera los escenarios situacionales para la sección B2-B6.</p>
                    <Button onClick={handleGenerateB2Questions} disabled={b2QuestionsLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                        {b2QuestionsLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generando escenarios...</>
                        ) : (
                            <><Sparkles className="h-4 w-4 mr-2" /> Generar Escenarios B2-B6</>
                        )}
                    </Button>
                </div>
            ) : b2QuestionsLoading ? (
                <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                    <span className="font-medium text-sm">Generando escenarios situacionales...</span>
                </div>
            ) : (
                <div className="space-y-6">
                    {b2Questions.map(q => {
                        const currentText = b2Answers[q.subcategory] || ''
                        const wordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0

                        return (
                            <div key={q.subcategory} className="space-y-3 bg-card border border-border rounded-xl p-5 shadow-xs">
                                <div className="select-none space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded text-xs font-bold border border-indigo-500/20">
                                            {q.subcategory}
                                        </span>
                                        <span className="text-sm font-bold text-foreground">{q.label}</span>
                                    </div>
                                    <p className="text-sm text-foreground/90 font-medium leading-relaxed pt-1 select-none">
                                        {q.question}
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <textarea
                                        value={currentText}
                                        onChange={(e) => setB2Answers(prev => ({ ...prev, [q.subcategory]: e.target.value }))}
                                        onPaste={handleBypassAttempt}
                                        onCopy={handleBypassAttempt}
                                        onCut={handleBypassAttempt}
                                        onContextMenu={handleBypassAttempt}
                                        disabled={b2Submitted}
                                        placeholder="Escribe tu respuesta situacional aquí (~40-60 palabras)..."
                                        className="w-full h-28 p-3 rounded-lg border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
                                    />
                                    <div className="flex justify-between items-center text-[11px] text-muted-foreground px-1">
                                        <span className="italic">* No se permite pegar texto.</span>
                                        <span className={`font-mono font-bold ${wordCount >= 25 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                                            {wordCount} palabras (Sugerido: ~40-60)
                                        </span>
                                    </div>
                                </div>
                            </div>
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
                                <><CheckCircle2 className="h-4 w-4 mr-2" /> Sección B2-B6 Completada</>
                            ) : (
                                'Guardar y Confirmar B2-B6'
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
