'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CQuestion } from '@/app/actions/ai'
import { Loader2, CheckCircle2, Sparkles, HeartHandshake, Compass } from 'lucide-react'
import { useCandidateContext } from '@/context/CandidateContext'

interface CTabProps {
    cQuestionsGenerated: boolean
    cQuestionsLoading: boolean
    cQuestions: CQuestion[]
    cAnswers: Record<string, string>
    setCAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>
    cSubmitted: boolean
    cSubmitting: boolean
    evaluationId: string | null
    allCAnswered: boolean
    handleGenerateCQuestions: () => void
    handleSubmitC: () => void
}

export function CTab({
    cQuestionsGenerated,
    cQuestionsLoading,
    cQuestions,
    cAnswers,
    setCAnswers,
    cSubmitted,
    cSubmitting,
    evaluationId,
    allCAnswered,
    handleGenerateCQuestions,
    handleSubmitC
}: CTabProps) {
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
                    <HeartHandshake className="h-5 w-5 text-teal-500" />
                    C. Fit Cultural & Filosofía SRE
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Responde brevemente a las siguientes preguntas sobre cultura Blameless, Error Budgets y prácticas de confiabilidad.
                </p>
            </div>

            {/* Instruction Card */}
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-bold text-sm">
                    <Compass className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    Guía de la Sección — ¿Cómo responder este apartado?
                </div>
                <div className="text-xs text-teal-950 dark:text-teal-200 space-y-1.5 leading-relaxed">
                    <p>• <strong>Fundamenta tu enfoque:</strong> Describe tu visión técnica y cultural sobre la gestión de SLOs y post-mortems (~40-60 palabras).</p>
                    <p>• <strong>Cultura Blameless:</strong> Expresa cómo promueves la mejora continua del sistema por encima de buscar culpables.</p>
                    <p>• <strong>Seguridad:</strong> El pegado de texto externo está inhabilitado y auditado.</p>
                </div>
            </div>

            {!cQuestionsGenerated ? (
                <div className="text-center py-8 bg-card border border-border rounded-xl">
                    <p className="text-muted-foreground mb-4 text-sm">Genera las preguntas de cultura SRE para la Sección C.</p>
                    <Button onClick={handleGenerateCQuestions} disabled={cQuestionsLoading} className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
                        {cQuestionsLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generando preguntas...</>
                        ) : (
                            <><Sparkles className="h-4 w-4 mr-2" /> Generar Preguntas Sección C</>
                        )}
                    </Button>
                </div>
            ) : cQuestionsLoading ? (
                <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                    <span className="font-medium text-sm">Generando preguntas de cultura SRE...</span>
                </div>
            ) : (
                <div className="space-y-6">
                    {cQuestions.map(q => {
                        const currentText = cAnswers[q.subcategory] || ''
                        const wordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0

                        return (
                            <div key={q.subcategory} className="space-y-3 bg-card border border-border rounded-xl p-5 shadow-xs">
                                <div className="select-none space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-teal-500/10 text-teal-600 dark:text-teal-300 rounded text-xs font-bold border border-teal-500/20">
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
                                        onChange={(e) => setCAnswers(prev => ({ ...prev, [q.subcategory]: e.target.value }))}
                                        onPaste={handleBypassAttempt}
                                        onCopy={handleBypassAttempt}
                                        onCut={handleBypassAttempt}
                                        onContextMenu={handleBypassAttempt}
                                        disabled={cSubmitted}
                                        placeholder="Escribe tu reflexión técnica aquí (~40-60 palabras)..."
                                        className="w-full h-28 p-3 rounded-lg border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60"
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
                            onClick={handleSubmitC}
                            disabled={!allCAnswered || cSubmitting || cSubmitted}
                            className={`font-bold transition-all h-11 px-6 ${
                                cSubmitted
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
                            }`}
                        >
                            {cSubmitting ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando y evaluando con IA...</>
                            ) : cSubmitted ? (
                                <><CheckCircle2 className="h-4 w-4 mr-2" /> Sección C Completada</>
                            ) : (
                                'Guardar y Confirmar Sección C'
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
