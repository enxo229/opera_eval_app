import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, RotateCcw, Loader2, Sparkles, BookOpen } from 'lucide-react'
import { A3_SUBS, RUBRIC_SCALE, SCORE_COLORS, TOTAL_COLORS } from './constants'
import { A3_EVALUATOR_GUIDANCE } from '@/lib/evaluator-guidance'

interface A3SubEvaluationProps {
    a3QData: any[]
    a3SubScores: Record<string, number>
    setA3SubScores: React.Dispatch<React.SetStateAction<Record<string, number>>>
    a3SubComments: Record<string, string>
    setA3SubComments: React.Dispatch<React.SetStateAction<Record<string, string>>>
    a3Total: number
    a3Normalized: string
    a3Refreshing: boolean
    a3Resetting: boolean
    onRefresh: () => void
    onReset: () => void
    readOnly?: boolean
}

export function A3SubEvaluation({
    a3QData,
    a3SubScores,
    setA3SubScores,
    a3SubComments,
    setA3SubComments,
    a3Total,
    a3Normalized,
    a3Refreshing,
    a3Resetting,
    onRefresh,
    onReset,
    readOnly
}: A3SubEvaluationProps) {
    return (
        <Card className="border-border border-2 border-primary/20">
            <CardHeader className="bg-muted/30 border-b border-border py-4">
                <CardTitle className="text-lg flex justify-between items-center text-primary">
                    <span>A3. Herramientas y Automatización Básica</span>
                    <div className="flex items-center gap-2">
                        {!readOnly && (
                            <>
                                <Button variant="outline" size="sm" onClick={onRefresh} disabled={a3Refreshing}
                                    className="text-xs h-7 gap-1">
                                    <RefreshCw className={`h-3 w-3 ${a3Refreshing ? 'animate-spin' : ''}`} /> Actualizar
                                </Button>
                                <Button variant="outline" size="sm" onClick={onReset} disabled={a3Resetting}
                                    className="text-xs h-7 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <RotateCcw className={`h-3 w-3 ${a3Resetting ? 'animate-spin' : ''}`} /> Resetear A3
                                </Button>
                            </>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
                {a3QData.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 space-y-2">
                        <p className="text-sm">⏳ Esperando respuestas del candidato para A3...</p>
                        <p className="text-xs">Usa el botón "Actualizar" cuando el candidato haya guardado sus respuestas.</p>
                    </div>
                ) : null}

                {A3_SUBS.map(sub => {
                    const qData = a3QData.find(q => q.subcategory === sub.id)
                    const guidance = A3_EVALUATOR_GUIDANCE[sub.id]
                    return (
                        <div key={sub.id} className="border border-border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-bold text-primary text-sm">{sub.id}</span>
                                    <span className="ml-2 font-semibold text-foreground text-sm">{sub.name}</span>
                                    <p className="text-xs text-muted-foreground">{sub.desc}</p>
                                </div>
                            </div>

                            {/* Evaluator Guidance Panel */}
                            {guidance && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                                    <div className="flex items-center gap-2 text-amber-800">
                                        <BookOpen className="h-4 w-4 shrink-0" />
                                        <span className="text-xs font-bold">{guidance.title}</span>
                                    </div>
                                    <pre className="text-xs text-amber-700 whitespace-pre-wrap font-sans leading-relaxed">{guidance.content}</pre>
                                </div>
                            )}

                            {qData && (
                                <div className="space-y-2 bg-secondary/20 rounded-md p-3">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Pregunta:</p>
                                    <p className="text-sm text-foreground">{qData.prompt_context}</p>
                                    <p className="text-xs font-bold text-muted-foreground uppercase mt-2">Respuesta del candidato:</p>
                                    <p className="text-sm text-foreground bg-white/50 p-2 rounded">{qData.candidate_response || 'Sin respuesta'}</p>
                                    {qData.ai_score !== null && (
                                        <div className="flex items-center gap-3 mt-2 p-2 rounded bg-violet-50 border border-violet-200">
                                            <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
                                            <div className="text-xs">
                                                <span className="font-bold text-violet-700">IA sugiere: {qData.ai_score}/3</span>
                                                {qData.ai_justification && (
                                                    <p className="text-violet-600 mt-0.5">{qData.ai_justification}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Scoring 0-3 */}
                            {(() => {
                                const score = a3SubScores[sub.id] || 0
                                const color = SCORE_COLORS[score]
                                const rubric = RUBRIC_SCALE[score]
                                return (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground w-20 shrink-0">Tu calificación:</span>
                                            <div className={`flex-1 h-2 rounded-full ${color.barBg} overflow-hidden`}>
                                                <div className={`h-full rounded-full ${color.bg} transition-all duration-300`}
                                                    style={{ width: `${(score / 3) * 100}%` }} />
                                            </div>
                                            <div className="flex gap-1 text-xs font-mono">
                                                {[0, 1, 2, 3].map(v => (
                                                    <button key={v} disabled={readOnly}
                                                        onClick={() => setA3SubScores(prev => ({ ...prev, [sub.id]: v }))}
                                                        className={`w-6 h-6 rounded text-center font-bold transition-all ${a3SubScores[sub.id] === v
                                                            ? `${SCORE_COLORS[v].bg} text-white ring-2 ${SCORE_COLORS[v].ring} shadow-sm`
                                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                                                        {v}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pl-[calc(5rem+0.75rem)]">
                                            <span className={`text-xs font-bold ${color.text}`}>{rubric.label}</span>
                                            <span className="text-xs text-muted-foreground">— {rubric.desc}</span>
                                        </div>
                                    </div>
                                )
                            })()}

                            <textarea value={a3SubComments[sub.id] || ''} disabled={readOnly}
                                onChange={(e) => setA3SubComments(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                placeholder="Evidencia observada..."
                                className="w-full min-h-[45px] p-2 rounded-md border border-input bg-background text-foreground text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" />
                        </div>
                    )
                })}

                {/* A3 Summary (Normalized) */}
                {(() => {
                    const pct = a3Total / 12
                    const level = a3Total <= 3 ? 0 : a3Total <= 6 ? 1 : a3Total <= 9 ? 2 : 3
                    const c = TOTAL_COLORS[level]
                    return (
                        <div className={`${c.fill} border ${c.border} rounded-lg p-4 space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-foreground">Total A3:</span>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold ${c.text}`}>{c.label}</span>
                                    <span className={`text-lg font-mono font-bold ${c.text}`}>{a3Total} / 12</span>
                                    <span className="text-xs text-muted-foreground">(normalizado: {a3Normalized} / 10)</span>
                                </div>
                            </div>
                            <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${c.bg} transition-all duration-500`}
                                    style={{ width: `${pct * 100}%` }} />
                            </div>
                        </div>
                    )
                })()}
            </CardContent>
        </Card>
    )
}
