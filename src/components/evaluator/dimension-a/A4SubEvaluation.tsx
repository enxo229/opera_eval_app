import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { RefreshCw, RotateCcw, Loader2, Sparkles, ChevronDown, ChevronUp, Eye, BookOpen } from 'lucide-react'
import { A4_SUBS, RUBRIC_SCALE, SCORE_COLORS, TOTAL_COLORS } from './constants'
import { A4_EVALUATOR_GUIDANCE } from '@/lib/evaluator-guidance'
import { AiLikelihoodBadge } from '../AiLikelihoodBadge'
import { RefObject } from 'react'
import { TelemetryChatRenderer } from '@/components/candidate/TelemetryChatRenderer'

interface A4SubEvaluationProps {
    a4Data: any[]
    a4History: string
    a4HistoryRef: RefObject<HTMLDivElement | null>
    expandedEvidence: string | null
    setExpandedEvidence: React.Dispatch<React.SetStateAction<string | null>>
    a4SubScores: Record<string, number>
    setA4SubScores: React.Dispatch<React.SetStateAction<Record<string, number>>>
    a4SubComments: Record<string, string>
    setA4SubComments: React.Dispatch<React.SetStateAction<Record<string, string>>>
    a4Total: number
    a4Normalized: string
    a4Refreshing: boolean
    a4Resetting: boolean
    onRefresh: () => void
    onReset: () => void
    readOnly?: boolean
}

export function A4SubEvaluation({
    a4Data,
    a4History,
    a4HistoryRef,
    expandedEvidence,
    setExpandedEvidence,
    a4SubScores,
    setA4SubScores,
    a4SubComments,
    setA4SubComments,
    a4Total,
    a4Normalized,
    a4Refreshing,
    a4Resetting,
    onRefresh,
    onReset,
    readOnly
}: A4SubEvaluationProps) {
    return (
        <Card className="border-border border-2 border-primary/20">
            <CardHeader className="bg-muted/30 border-b border-border py-4">
                <CardTitle className="text-lg flex justify-between items-center text-primary">
                    <span className="flex items-center gap-2"><NextImage src="/icons/AIAgent.png" alt="IA" width={40} height={40} /> A4. Pensamiento Analítico (Chatbot)</span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onRefresh} disabled={a4Refreshing} className="h-8 px-3 text-xs">
                            {a4Refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                            Actualizar
                        </Button>
                        {!readOnly && a4Data.length > 0 && (
                            <Button variant="outline" size="sm" onClick={onReset} disabled={a4Resetting}
                                className="text-xs h-7 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <RotateCcw className={`h-3 w-3 ${a4Resetting ? 'animate-spin' : ''}`} /> Resetear A4
                            </Button>
                        )}
                        <span className="font-mono bg-background px-3 py-1 rounded-md border text-foreground text-base">
                            {a4Total} / 9
                        </span>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
                {a4Data.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 space-y-2 border-2 border-dashed rounded-lg">
                        <NextImage src="/icons/AIAgent.png" alt="IA" width={64} height={64} className="mx-auto opacity-20" />
                        <p className="text-sm italic">⏳ Esperando que el candidato finalice la investigación en el Chatbot...</p>
                    </div>
                ) : (
                    <>
                        {/* Chat History Viewer */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <button onClick={() => setExpandedEvidence(expandedEvidence === 'A4' ? null : 'A4')}
                                className="flex-1 flex items-center justify-between text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 hover:bg-emerald-100 transition-colors">
                                <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> Ver Historial de Chat Completo</span>
                                {expandedEvidence === 'A4' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {a4Data.length > 0 && a4Data[0]?.ai_likelihood !== null && a4Data[0]?.ai_likelihood !== undefined && (
                                <div className="shrink-0 flex items-center">
                                    <AiLikelihoodBadge percentage={a4Data[0].ai_likelihood} />
                                </div>
                            )}
                        </div>
                        {expandedEvidence === 'A4' && (() => {
                            const parsedMessages: { role: 'user' | 'ai'; text: string }[] = []
                            let currentRole: 'user' | 'ai' = 'ai'
                            let currentBuffer: string[] = []

                            a4History.split('\n').forEach((line) => {
                                if (line.startsWith('USER:')) {
                                    if (currentBuffer.length > 0) {
                                        parsedMessages.push({ role: currentRole, text: currentBuffer.join('\n') })
                                        currentBuffer = []
                                    }
                                    currentRole = 'user'
                                    currentBuffer.push(line.replace(/^USER:\s*/, ''))
                                } else if (line.startsWith('AI:') || line.startsWith('SISTEMA SIMULADO:')) {
                                    if (currentBuffer.length > 0) {
                                        parsedMessages.push({ role: currentRole, text: currentBuffer.join('\n') })
                                        currentBuffer = []
                                    }
                                    currentRole = 'ai'
                                    currentBuffer.push(line.replace(/^(AI|SISTEMA SIMULADO):\s*/, ''))
                                } else {
                                    currentBuffer.push(line)
                                }
                            })
                            if (currentBuffer.length > 0) {
                                parsedMessages.push({ role: currentRole, text: currentBuffer.join('\n') })
                            }

                            return (
                                <div
                                    ref={a4HistoryRef}
                                    className="bg-[#0b0f19] rounded-xl p-4 font-mono text-xs max-h-[420px] overflow-y-auto space-y-4 border border-slate-800 shadow-inner"
                                >
                                    {parsedMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[90%] p-3.5 rounded-xl shadow-sm border ${msg.role === 'user'
                                                ? 'bg-blue-950/40 text-blue-100 border-blue-800/80'
                                                : 'bg-[#131722] text-slate-100 border-slate-700/80'
                                                }`}>
                                                <span className="font-bold opacity-60 block mb-1 uppercase text-[10px] tracking-wider">
                                                    {msg.role === 'user' ? '👤 Candidato' : '🖥️ Consola de Observabilidad (IA)'}
                                                </span>
                                                <TelemetryChatRenderer content={msg.text} isAi={msg.role === 'ai'} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        })()}

                        {/* Per-subcategory scoring */}
                        {A4_SUBS.map(sub => {
                            const qData = a4Data.find(q => q.subcategory === sub.id)
                            const guidance = A4_EVALUATOR_GUIDANCE[sub.id]
                            const hasAIScore = qData?.ai_score !== null && qData?.ai_score !== undefined

                            return (
                                <div key={sub.id} className="border border-border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-primary text-sm">{sub.id}</span>
                                            <span className="ml-2 font-semibold text-foreground text-sm">{sub.name}</span>
                                            <p className="text-xs text-muted-foreground">{sub.desc}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {hasAIScore && (
                                                <span className="text-xs flex items-center gap-1 bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-full font-semibold border border-violet-200">
                                                    <Sparkles className="h-3 w-3 text-violet-600" /> IA sugiere: {qData.ai_score}/3
                                                </span>
                                            )}
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

                                    {/* AI Likelihood Badge in subcategory */}
                                    {qData?.ai_likelihood !== null && qData?.ai_likelihood !== undefined && (
                                        <AiLikelihoodBadge percentage={qData.ai_likelihood} />
                                    )}

                                    {qData && qData.ai_score !== null && (
                                        <div className="flex items-center gap-3 p-2 rounded bg-violet-50 border border-violet-200">
                                            <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
                                            <div className="text-xs">
                                                <span className="font-bold text-violet-700">IA sugiere: {qData.ai_score}/3</span>
                                                {qData.ai_justification && (
                                                    <p className="text-violet-600 mt-0.5 italic">"{qData.ai_justification}"</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Scoring 0-3 */}
                                    {(() => {
                                        const score = a4SubScores[sub.id] || 0
                                        const color = SCORE_COLORS[score] || SCORE_COLORS[0]
                                        const rubric = RUBRIC_SCALE[score] || RUBRIC_SCALE[0]
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
                                                                onClick={() => setA4SubScores(prev => ({ ...prev, [sub.id]: v }))}
                                                                className={`w-6 h-6 rounded text-center font-bold transition-all ${a4SubScores[sub.id] === v
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

                                    <textarea value={a4SubComments[sub.id] || ''} disabled={readOnly}
                                        onChange={(e) => setA4SubComments(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                        placeholder="Evidencia observada..."
                                        className="w-full min-h-[45px] p-2 rounded-md border border-input bg-background text-foreground text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" />
                                </div>
                            )
                        })}

                        {/* A4 Summary (Normalized) */}
                        {(() => {
                            const pct = a4Total / 9
                            const level = a4Total <= 2 ? 0 : a4Total <= 5 ? 1 : a4Total <= 7 ? 2 : 3
                            const c = TOTAL_COLORS[level]
                            return (
                                <div className={`${c.fill} border ${c.border} rounded-lg p-4 space-y-2`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-foreground">Total A4:</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-bold ${c.text}`}>{c.label}</span>
                                            <span className={`text-lg font-mono font-bold ${c.text}`}>{a4Total} / 9</span>
                                            <span className="text-xs text-muted-foreground">(normalizado: {a4Normalized} / 10)</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${c.bg} transition-all duration-500`}
                                            style={{ width: `${pct * 100}%` }} />
                                    </div>
                                </div>
                            )
                        })()}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
