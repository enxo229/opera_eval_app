import { Button } from '@/components/ui/button'
import { HelpCircle, Loader2 } from 'lucide-react'
import { A2Question } from '@/app/actions/ai'

const TOOL_OPTIONS = [
    { value: 'Grafana', label: 'Grafana' },
    { value: 'Elasticsearch/Kibana', label: 'Elasticsearch / Kibana' },
    { value: 'Zabbix', label: 'Zabbix' },
    { value: 'Dynatrace', label: 'Dynatrace' },
    { value: 'Datadog', label: 'Datadog' },
    { value: 'Otra herramienta de monitoreo', label: 'Otra' },
]

interface A2TabProps {
    a2SelectedTool: string | null
    a2Submitted: boolean
    a2QuestionsLoading: boolean
    a2QuestionsGenerated: boolean
    a2Questions: A2Question[]
    a2Answers: Record<string, string>
    setA2Answers: React.Dispatch<React.SetStateAction<Record<string, string>>>
    a2Submitting: boolean
    evaluationId: string | null
    handleSelectTool: (tool: string) => void
    handleSubmitA2: () => void
}

export function A2Tab({
    a2SelectedTool,
    a2Submitted,
    a2QuestionsLoading,
    a2QuestionsGenerated,
    a2Questions,
    a2Answers,
    setA2Answers,
    a2Submitting,
    evaluationId,
    handleSelectTool,
    handleSubmitA2
}: A2TabProps) {
    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                A2. Observabilidad y Monitoreo
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
                Selecciona la herramienta de observabilidad que mejor conozcas. Las preguntas se adaptarán a tu experiencia.
            </p>

            {!a2SelectedTool ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {TOOL_OPTIONS.map(tool => (
                        <button
                            key={tool.value}
                            onClick={() => handleSelectTool(tool.value)}
                            disabled={a2Submitted}
                            className="p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-md transition-all text-center font-medium text-foreground disabled:opacity-50"
                        >
                            {tool.label}
                        </button>
                    ))}
                </div>
            ) : (
                <>
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-4">
                        🔧 Herramienta seleccionada: {a2SelectedTool}
                    </div>

                    {a2QuestionsLoading ? (
                        <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="font-medium">Generando preguntas personalizadas para {a2SelectedTool}...</span>
                        </div>
                    ) : a2QuestionsGenerated && a2Questions.length > 0 ? (
                        <div className="space-y-4">
                            {a2Questions.map(q => (
                                <div key={q.subcategory} className="space-y-2 bg-secondary/30 border border-border rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-bold">{q.subcategory}</span>
                                        <span className="text-sm font-semibold text-foreground">{q.label}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{q.question}</p>
                                    <textarea
                                        value={a2Answers[q.subcategory] || ''}
                                        onChange={(e) => setA2Answers(prev => ({ ...prev, [q.subcategory]: e.target.value }))}
                                        disabled={a2Submitted}
                                        placeholder="Escribe tu respuesta aquí..."
                                        name={`answer-${q.subcategory}`}
                                        className="w-full min-h-[80px] p-3 rounded-md border border-border bg-card text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                                    />
                                </div>
                            ))}

                            {!a2Submitted ? (
                                <Button
                                    onClick={handleSubmitA2}
                                    disabled={a2Submitting || !evaluationId || a2Questions.some(q => !(a2Answers[q.subcategory] || '').trim())}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    {a2Submitting ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando y evaluando...</>
                                    ) : (
                                        'Guardar Respuestas A2'
                                    )}
                                </Button>
                            ) : (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg text-center">
                                    <p className="font-bold text-lg">✅ Respuestas A2 guardadas correctamente</p>
                                    <p className="text-sm mt-1">Tu evaluador ya puede ver tus respuestas.</p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </>
            )}
        </div>
    )
}
