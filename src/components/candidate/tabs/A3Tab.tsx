import { TerminalSandbox } from '@/components/candidate/TerminalSandbox'
import { Button } from '@/components/ui/button'
import { GitBranch, Sparkles, Terminal, Loader2, AlertTriangle, FileText } from 'lucide-react'
import { A3Question } from '@/app/actions/ai'
import { FormattedQuestion } from '@/components/candidate/FormattedQuestion'

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
    profileTrack?: string
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
    handleSubmitA3,
    profileTrack
}: A3TabProps) {
    const allA3Answered = a3Questions.length > 0 && a3Questions.every(q => (a3Answers[q.subcategory] || '').trim().length > 0)
    const isOtelExpert = profileTrack === 'otel_expert'

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                {isOtelExpert ? 'A3. Configuración, OTTL & Pipelines' : 'A3. Git & Análisis de Datos con Pandas'}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
                {isOtelExpert 
                    ? 'Analiza el archivo de configuración del OpenTelemetry Collector provisto y responde las preguntas sobre el pipeline de procesamiento y reglas de transformación (OTTL).'
                    : 'Responde las preguntas prácticas sobre control de versiones en Git y manipulación/análisis de métricas con Python & Pandas.'}
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
                    {isOtelExpert ? (
                        <div className="p-4 bg-slate-900 border border-slate-700/80 rounded-xl space-y-3 shadow-lg">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-sky-400" /> otel-collector-config.yaml
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-sky-300 border border-slate-700 select-none">
                                    YAML (READ-ONLY)
                                </span>
                            </div>
                            <pre className="text-xs font-mono p-5 rounded-lg overflow-x-auto border border-slate-800 shadow-inner max-h-[360px] leading-relaxed select-text" style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
                                <code className="font-mono">
                                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>receivers</span>:<br />
                                    {'  '}<span style={{ color: '#38bdf8' }}>otlp</span>:<br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>protocols</span>:<br />
                                    {'      '}<span style={{ color: '#38bdf8' }}>grpc</span>:<br />
                                    {'        '}<span style={{ color: '#38bdf8' }}>endpoint</span>: <span style={{ color: '#fbbf24' }}>"0.0.0.0:4317"</span><br />
                                    {'      '}<span style={{ color: '#38bdf8' }}>http</span>:<br />
                                    {'        '}<span style={{ color: '#38bdf8' }}>endpoint</span>: <span style={{ color: '#fbbf24' }}>"0.0.0.0:4318"</span><br /><br />

                                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>processors</span>:<br />
                                    {'  '}<span style={{ color: '#38bdf8' }}>batch</span>:<br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>timeout</span>: <span style={{ color: '#c084fc' }}>1s</span><br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>send_batch_size</span>: <span style={{ color: '#c084fc' }}>256</span><br /><br />

                                    {'  '}<span style={{ color: '#38bdf8' }}>transform</span>:<br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>error_mode</span>: <span style={{ color: '#fbbf24' }}>ignore</span><br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>trace_statements</span>:<br />
                                    {'      '}- <span style={{ color: '#38bdf8' }}>context</span>: <span style={{ color: '#fbbf24' }}>span</span><br />
                                    {'        '}<span style={{ color: '#38bdf8' }}>statements</span>:<br />
                                    {'          '}- <span style={{ color: '#fbbf24' }}>'set(attributes["service.env"], "production")'</span><br />
                                    {'          '}- <span style={{ color: '#fbbf24' }}>'replace_pattern(attributes["http.target"], "^/api/v1/auth/.*", "/api/v1/auth/*")'</span><br />
                                    {'          '}- <span style={{ color: '#fbbf24' }}>'keep_keys(attributes, ["http.method", "http.status_code", "service.env", "http.target"])'</span><br /><br />

                                    {'  '}<span style={{ color: '#38bdf8' }}>tail_sampling</span>:<br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>decision_wait</span>: <span style={{ color: '#c084fc' }}>10s</span><br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>num_traces</span>: <span style={{ color: '#c084fc' }}>10000</span><br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>expected_new_traces_per_sec</span>: <span style={{ color: '#c084fc' }}>2000</span><br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>policies</span>:<br />
                                    {'      '}- <span style={{ color: '#38bdf8' }}>name</span>: <span style={{ color: '#fbbf24' }}>filter_errors</span><br />
                                    {'        '}<span style={{ color: '#38bdf8' }}>type</span>: <span style={{ color: '#fbbf24' }}>status_code</span><br />
                                    {'        '}<span style={{ color: '#38bdf8' }}>status_code</span>:<br />
                                    {'          '}<span style={{ color: '#38bdf8' }}>status_codes</span>: [<span style={{ color: '#fbbf24' }}>ERROR</span>]<br />
                                    {'      '}- <span style={{ color: '#38bdf8' }}>name</span>: <span style={{ color: '#fbbf24' }}>filter_latency</span><br />
                                    {'        '}<span style={{ color: '#38bdf8' }}>type</span>: <span style={{ color: '#fbbf24' }}>latency</span><br />
                                    {'        '}<span style={{ color: '#38bdf8' }}>latency</span>:<br />
                                    {'          '}<span style={{ color: '#38bdf8' }}>threshold_ms</span>: <span style={{ color: '#c084fc' }}>2000</span><br />
                                    {'      '}- <span style={{ color: '#38bdf8' }}>name</span>: <span style={{ color: '#fbbf24' }}>probabilistic_sample</span><br />
                                    {'        '}<span style={{ color: '#38bdf8' }}>type</span>: <span style={{ color: '#fbbf24' }}>probabilistic</span><br />
                                    {'        '}<span style={{ color: '#38bdf8' }}>probabilistic</span>:<br />
                                    {'          '}<span style={{ color: '#38bdf8' }}>sampling_percentage</span>: <span style={{ color: '#c084fc' }}>10.0</span><br /><br />

                                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>exporters</span>:<br />
                                    {'  '}<span style={{ color: '#38bdf8' }}>otlp</span>:<br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>endpoint</span>: <span style={{ color: '#fbbf24' }}>"tempo-us-central.grafana.net:443"</span><br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>headers</span>:<br />
                                    {'      '}<span style={{ color: '#38bdf8' }}>authorization</span>: <span style={{ color: '#fbbf24' }}>"Bearer ${'${'}GRAFANA_CLOUD_API_TOKEN{'}'}"</span><br /><br />

                                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>service</span>:<br />
                                    {'  '}<span style={{ color: '#38bdf8' }}>pipelines</span>:<br />
                                    {'    '}<span style={{ color: '#38bdf8' }}>traces</span>:<br />
                                    {'      '}<span style={{ color: '#38bdf8' }}>receivers</span>: [<span style={{ color: '#fbbf24' }}>otlp</span>]<br />
                                    {'      '}<span style={{ color: '#38bdf8' }}>processors</span>: [<span style={{ color: '#fbbf24' }}>transform</span>, <span style={{ color: '#fbbf24' }}>tail_sampling</span>, <span style={{ color: '#fbbf24' }}>batch</span>]<br />
                                    {'      '}<span style={{ color: '#38bdf8' }}>exporters</span>: [<span style={{ color: '#fbbf24' }}>otlp</span>]<br />
                                </code>
                            </pre>
                        </div>
                    ) : (
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                            <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                                <Terminal className="h-4 w-4" /> Live Demo: Sandbox Git & CLI
                            </h3>
                            <TerminalSandbox mode="A3" onCommandsChange={setA3Commands} />
                            <p className="text-[10px] text-muted-foreground mt-2 italic">
                                * Usa esta terminal si tu evaluador solicita una demostración práctica de comandos.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {a3Questions.map(q => (
                            <div key={q.subcategory} className="space-y-2 bg-secondary/30 border border-border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-bold">{q.subcategory}</span>
                                    <span className="text-sm font-semibold text-foreground">{q.label}</span>
                                </div>
                                <FormattedQuestion text={q.question} />
                                <textarea
                                    value={a3Answers[q.subcategory] || ''}
                                    onChange={(e) => setA3Answers(prev => ({ ...prev, [q.subcategory]: e.target.value }))}
                                    onPaste={(e) => e.preventDefault()}
                                    onCopy={(e) => e.preventDefault()}
                                    onContextMenu={(e) => e.preventDefault()}
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
