import { TerminalSandbox } from '@/components/candidate/TerminalSandbox'
import { Button } from '@/components/ui/button'
import { GitBranch, Sparkles, Terminal, Loader2, AlertTriangle } from 'lucide-react'
import { A3Question } from '@/app/actions/ai'

interface A3TabProps {
    a3QuestionsGenerated: boolean
    a3QuestionsLoading: boolean
    a3Questions: A3Question[]
    a3Answers: Record<string, string>
    setA3Answers: React.Dispatch<React.SetStateAction<Record<string, string>>>
    a3Submitted: boolean
    a3Submitting: boolean
    evaluationId: string | null
    setA3Commands: (commands: string[]) => void
    handleGenerateA3Questions: () => void
    handleSubmitA3: () => void
}

export function A3Tab({
    a3QuestionsGenerated,
    a3QuestionsLoading,
    a3Questions,
    a3Answers,
    setA3Answers,
    a3Submitted,
    a3Submitting,
    evaluationId,
    setA3Commands,
    handleGenerateA3Questions,
    handleSubmitA3
}: A3TabProps) {
    const allA3Answered = a3Questions.length > 0 && a3Questions.every(q => (a3Answers[q.subcategory] || '').trim().length > 0)

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                A3. Herramientas y Automatización Básica
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
                Responde las preguntas sobre Git, scripting, gestión de tickets y documentación.
            </p>

            {!a3QuestionsGenerated ? (
                <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">Genera las preguntas para la sección A3.</p>
                    <Button onClick={handleGenerateA3Questions} disabled={a3QuestionsLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {a3QuestionsLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generando preguntas...</>
                        ) : (
                            <><Sparkles className="h-4 w-4 mr-2" /> Generar Preguntas A3</>
                        )}
                    </Button>
                </div>
            ) : a3QuestionsLoading ? (
                <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Generando preguntas...</span>
                </div>
            ) : a3Questions.length > 0 ? (
                <div className="space-y-6">
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                            <Terminal className="h-4 w-4" /> Live Demo: Sandbox Git & CLI
                        </h3>
                        <TerminalSandbox mode="A3" onCommandsChange={setA3Commands} />
                        <p className="text-[10px] text-muted-foreground mt-2 italic">
                            * Usa esta terminal si tu evaluador solicita una demostración práctica de comandos.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {a3Questions.map(q => (
                            <div key={q.subcategory} className="space-y-2 bg-secondary/30 border border-border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-bold">{q.subcategory}</span>
                                    <span className="text-sm font-semibold text-foreground">{q.label}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{q.question}</p>
                                <textarea
                                    value={a3Answers[q.subcategory] || ''}
                                    onChange={(e) => setA3Answers(prev => ({ ...prev, [q.subcategory]: e.target.value }))}
                                    disabled={a3Submitted}
                                    placeholder="Escribe tu respuesta aquí..."
                                    className="w-full min-h-[80px] p-3 rounded-md border border-border bg-card text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                                />
                            </div>
                        ))}

                        {!a3Submitted ? (
                            <div className="space-y-3">
                                <Button
                                    onClick={handleSubmitA3}
                                    disabled={!allA3Answered || a3Submitting || !evaluationId}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 transition-all"
                                >
                                    {a3Submitting ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando y evaluando...</>
                                    ) : !evaluationId ? (
                                        'No hay evaluación activa — contacta al evaluador'
                                    ) : (
                                        'Guardar Respuestas A3'
                                    )}
                                </Button>
                                {!allA3Answered && !a3Submitting && evaluationId && (
                                    <p className="text-sm text-amber-600 text-center flex items-center justify-center gap-1.5 font-medium bg-amber-50/50 p-2 rounded-lg border border-amber-200/50 animate-in fade-in slide-in-from-top-1">
                                        <AlertTriangle className="h-4 w-4" /> 
                                        Faltan preguntas por responder para poder guardar esta sección.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg text-center">
                                <p className="font-bold text-lg">✅ Respuestas A3 guardadas correctamente</p>
                                <p className="text-sm mt-1">Tu evaluador ya puede ver tus respuestas.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
