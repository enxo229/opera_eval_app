import { TerminalSandbox } from '@/components/candidate/TerminalSandbox'
import { Button } from '@/components/ui/button'
import { Terminal, Sparkles, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { A1Question } from '@/app/actions/ai'

interface A1TabProps {
    a1QuestionsGenerated: boolean
    a1QuestionsLoading: boolean
    a1Questions: A1Question[]
    a1Answers: Record<string, string>
    setA1Answers: React.Dispatch<React.SetStateAction<Record<string, string>>>
    a1Submitted: boolean
    a1Submitting: boolean
    evaluationId: string | null
    allA1Answered: boolean
    setA1Commands: (commands: string[]) => void
    handleGenerateA1Questions: () => void
    handleSubmitA1: () => void
}

export function A1Tab({
    a1QuestionsGenerated,
    a1QuestionsLoading,
    a1Questions,
    a1Answers,
    setA1Answers,
    a1Submitted,
    a1Submitting,
    evaluationId,
    allA1Answered,
    setA1Commands,
    handleGenerateA1Questions,
    handleSubmitA1
}: A1TabProps) {
    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                A1. Fundamentos de Infraestructura y Sistemas
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
                Usa la terminal para demostrar tu manejo de entornos Linux. Intenta tareas como: consultar tu usuario activo y el nombre del host, mostrar en qué ruta te encuentras, ir al directorio raíz y listar su contenido, o revisar los procesos del sistema.
                Escribe <code className="bg-muted px-1 rounded">help</code> para ver los comandos disponibles.
            </p>
            <TerminalSandbox mode="A1" onCommandsChange={setA1Commands} />
            <div className="mt-6">
                {!a1QuestionsGenerated ? (
                    <div className="text-center py-4 border border-border rounded-xl mt-4">
                        <p className="text-muted-foreground mb-4">Cuando termines con la terminal, genera las preguntas para completar la sección A1.</p>
                        <Button onClick={handleGenerateA1Questions} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            Generar Preguntas A1
                        </Button>
                    </div>
                ) : a1QuestionsLoading ? (
                    <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground border border-border rounded-xl mt-4">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="font-medium">Generando preguntas adaptadas a tu perfil...</span>
                    </div>
                ) : (
                    <div className="space-y-5 border border-border rounded-xl p-6 mt-4">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" /> Preguntas — Infraestructura y Sistemas
                            {a1Submitted && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </h3>

                        {a1Questions.map((q) => (
                            <div key={q.subcategory} className="bg-secondary/30 border border-border rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        {q.subcategory}
                                    </span>
                                    <span className="text-xs font-semibold text-muted-foreground">{q.label}</span>
                                </div>
                                <p className="text-sm text-foreground">{q.question}</p>
                                <textarea
                                    value={a1Answers[q.subcategory] || ''}
                                    onChange={(e) => setA1Answers(prev => ({ ...prev, [q.subcategory]: e.target.value }))}
                                    disabled={a1Submitted}
                                    placeholder="Escribe tu respuesta aquí..."
                                    className="w-full min-h-[80px] p-3 rounded-md border border-border bg-card text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                                />
                            </div>
                        ))}

                        {!a1Submitted ? (
                            <div className="space-y-3">
                                <Button
                                    onClick={handleSubmitA1}
                                    disabled={!allA1Answered || a1Submitting || !evaluationId}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 transition-all"
                                >
                                    {a1Submitting ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando y evaluando...</>
                                    ) : !evaluationId ? (
                                        'No hay evaluación activa — contacta al evaluador'
                                    ) : (
                                        'Guardar Respuestas A1'
                                    )}
                                </Button>
                                {!allA1Answered && !a1Submitting && evaluationId && (
                                    <p className="text-sm text-amber-600 text-center flex items-center justify-center gap-1.5 font-medium bg-amber-50/50 p-2 rounded-lg border border-amber-200/50 animate-in fade-in slide-in-from-top-1">
                                        <AlertTriangle className="h-4 w-4" /> 
                                        Faltan preguntas por responder para poder guardar esta sección.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg text-center">
                                <p className="font-bold text-lg">✅ Respuestas A1 guardadas correctamente</p>
                                <p className="text-sm mt-1">Tu evaluador ya puede ver tus respuestas.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
