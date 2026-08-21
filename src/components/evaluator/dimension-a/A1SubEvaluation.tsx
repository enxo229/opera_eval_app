import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { RefreshCw, RotateCcw, Loader2, Sparkles, Terminal, ChevronDown, ChevronUp, HelpCircle, Activity, Info } from 'lucide-react'
import { A1_SUBS, RUBRIC_SCALE, SCORE_COLORS, TOTAL_COLORS } from './constants'

interface A1SubEvaluationProps {
    a1QuestionsData: any[]
    a1TerminalCommands?: string[]
    a1SubScores: Record<string, number>
    setA1SubScores: React.Dispatch<React.SetStateAction<Record<string, number>>>
    a1SubComments: Record<string, string>
    setA1SubComments: React.Dispatch<React.SetStateAction<Record<string, string>>>
    a1Total: number
    a1Refreshing: boolean
    a1Resetting: boolean
    onRefresh: () => void
    onReset: () => void
    readOnly?: boolean
}

export function A1SubEvaluation({
    a1QuestionsData,
    a1TerminalCommands = [],
    a1SubScores,
    setA1SubScores,
    a1SubComments,
    setA1SubComments,
    a1Total,
    a1Refreshing,
    a1Resetting,
    onRefresh,
    onReset,
    readOnly
}: A1SubEvaluationProps) {
    const [isTerminalExpanded, setIsTerminalExpanded] = useState(a1TerminalCommands.length > 0)

    // Telemetry calculations
    const totalCommands = a1TerminalCommands.length
    const helpCount = a1TerminalCommands.filter(c => c.trim().toLowerCase().startsWith('help')).length
    const logCount = a1TerminalCommands.filter(c => /cat|tail|grep|awk|less|more|journalctl/i.test(c)).length
    const procCount = a1TerminalCommands.filter(c => /ps|top|htop|kill|systemctl|service/i.test(c)).length
    const fileCount = a1TerminalCommands.filter(c => /ls|cd|pwd|find|stat|head/i.test(c)).length

    return (
        <Card className="border-border border-2 border-primary/20">
            <CardHeader className="bg-muted/30 border-b border-border py-4">
                <CardTitle className="text-lg flex justify-between items-center text-primary">
                    <span>A1. Fundamentos de Infraestructura y Sistemas</span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onRefresh}
                            disabled={a1Refreshing} className="h-8 px-3 text-xs">
                            {a1Refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                            Actualizar
                        </Button>
                        {!readOnly && a1QuestionsData.length > 0 && (
                            <Button variant="outline" size="sm" onClick={onReset}
                                disabled={a1Resetting}
                                className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50">
                                {a1Resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RotateCcw className="h-3.5 w-3.5 mr-1" />}
                                Resetear A1
                            </Button>
                        )}
                        <span className="font-mono bg-background px-3 py-1 rounded-md border text-foreground text-base">
                            {a1Total} / 15
                        </span>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
                {/* Linux Terminal Telemetry Widget */}
                <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                    <button
                        type="button"
                        onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
                        className="w-full flex items-center justify-between p-3.5 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                <Terminal className="h-4 w-4" />
                            </div>
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                                    Telemetría de Actividad en Terminal Linux (Sandbox A1)
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    {totalCommands > 0
                                        ? `${totalCommands} comandos ejecutados por el candidato`
                                        : 'El candidato no ejecutó comandos en la terminal (respondió directamente)'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {totalCommands > 0 && (
                                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    {totalCommands} cmd
                                </span>
                            )}
                            {isTerminalExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                    </button>

                    {isTerminalExpanded && (
                        <div className="p-4 border-t border-border space-y-4 bg-background/50">
                            {/* Summary Pills */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                        <Activity className="h-3 w-3 text-primary" /> Total Comandos
                                    </span>
                                    <span className="text-lg font-black font-mono mt-0.5 text-foreground">{totalCommands}</span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-blue-700 flex items-center gap-1">
                                        <HelpCircle className="h-3 w-3" /> Ayuda (help)
                                    </span>
                                    <span className="text-lg font-black font-mono mt-0.5 text-blue-700">{helpCount}</span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-amber-700 flex items-center gap-1">
                                        🔍 Logs & Filtros
                                    </span>
                                    <span className="text-lg font-black font-mono mt-0.5 text-amber-700">{logCount}</span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                                        ⚙️ Procesos & Sistema
                                    </span>
                                    <span className="text-lg font-black font-mono mt-0.5 text-emerald-700">{procCount}</span>
                                </div>
                            </div>

                            {/* Command Stream */}
                            {totalCommands > 0 ? (
                                <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                        Historial Cronológico de Comandos:
                                    </span>
                                    <div className="bg-[#1a1b26] border border-[#2a2b3d] rounded-lg p-3 max-h-[220px] overflow-y-auto font-mono text-xs text-[#c0caf5] space-y-1">
                                        {a1TerminalCommands.map((cmd, idx) => (
                                            <div key={idx} className="flex items-center gap-2 py-0.5 hover:bg-white/5 px-1.5 rounded transition-colors">
                                                <span className="text-[#565f89] select-none text-[10px] w-6 text-right shrink-0">{idx + 1}</span>
                                                <span className="text-[#9ece6a] select-none text-[11px]">candidato@srv-prod-01:~$</span>
                                                <span className="text-[#7dcfff] font-bold">{cmd}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                                    <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span>
                                        No se registraron comandos en la sandbox. Recuerda que la terminal es opcional como entorno de consulta, y el candidato puede haber respondido de forma directa.
                                    </span>
                                </div>
                            )}

                            <div className="text-[11px] text-muted-foreground/80 italic flex items-center gap-1.5 pt-1 border-t border-border/50">
                                <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
                                <span>Tip: Usa esta telemetría como evidencia cualitativa para evaluar autonomía técnica y soltura en línea de comandos.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Static Rubric reference */}
                <div className="bg-blue-50/40 border border-blue-200/60 rounded-xl overflow-hidden shadow-sm">
                    <div className="w-full flex items-center gap-2 font-bold text-blue-800 bg-blue-100/50 px-4 py-3 text-base border-b border-blue-200/50">
                        <span>📋 Escala de Valoración 0-3</span>
                    </div>
                    <div className="p-4 space-y-2 text-sm">
                        {RUBRIC_SCALE.map(r => {
                            let rowColor = 'bg-white text-slate-700 border-transparent border'
                            let numColor = 'bg-background/80 shadow-sm text-muted-foreground'
                            if (r.level === 3) { rowColor = 'bg-green-50 text-green-900 border-green-200 border'; numColor = 'bg-green-500 text-white shadow-sm' }
                            else if (r.level === 2) { rowColor = 'bg-emerald-50 text-emerald-900 border-emerald-200 border'; numColor = 'bg-emerald-500 text-white shadow-sm' }
                            else if (r.level === 1) { rowColor = 'bg-orange-50 text-orange-900 border-orange-200 border'; numColor = 'bg-orange-500 text-white shadow-sm' }
                            else if (r.level === 0) { rowColor = 'bg-red-50 text-red-900 border-red-200 border'; numColor = 'bg-red-500 text-white shadow-sm' }

                            return (
                                <div key={r.level} className={`flex gap-3 items-center p-2.5 rounded-lg ${rowColor}`}>
                                    <span className={`font-black shrink-0 w-8 h-8 flex items-center justify-center rounded-md ${numColor}`}>
                                        {r.level}
                                    </span>
                                    <span className="leading-snug">
                                        <strong className="tracking-wide mr-1">{r.label}:</strong> {r.desc}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Per-subcategory scoring */}
                {A1_SUBS.map(sub => {
                    const questionData = a1QuestionsData.find(q => q.subcategory === sub.id)
                    const hasAIScore = questionData?.ai_score !== null && questionData?.ai_score !== undefined

                    return (
                        <div key={sub.id} className="border border-border rounded-lg overflow-hidden">
                            <div className="bg-muted/20 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{sub.id}</span>
                                    <span className="text-sm font-semibold text-foreground">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {hasAIScore && (
                                        <span className="text-xs flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                                            <Sparkles className="h-3 w-3" /> IA: {questionData.ai_score}/3
                                        </span>
                                    )}
                                    <span className="font-mono text-sm font-bold text-foreground bg-background px-2 py-0.5 rounded border">
                                        {a1SubScores[sub.id]}/3
                                    </span>
                                </div>
                            </div>

                            <div className="px-4 py-3 space-y-3">
                                {/* Show candidate Q&A if exists */}
                                {questionData && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                                        <p className="text-xs text-slate-500 font-semibold uppercase">Pregunta:</p>
                                        <p className="text-xs text-slate-700">{questionData.prompt_context}</p>
                                        {questionData.candidate_response && (
                                            <>
                                                <p className="text-xs text-slate-500 font-semibold uppercase mt-2">Respuesta del candidato:</p>
                                                <p className="text-xs text-slate-800 font-mono bg-white/50 p-2 rounded">{questionData.candidate_response}</p>
                                            </>
                                        )}
                                        {questionData.ai_justification && (
                                            <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                                                <p className="text-xs text-amber-800 flex items-center gap-1">
                                                    <NextImage src="/icons/AIAgent.png" alt="IA" width={28} height={28} className="inline mr-1" /> <strong>IA ({questionData.ai_score}/3):</strong> {questionData.ai_justification}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Slider 0-3 with color coding */}
                                {(() => {
                                    const score = a1SubScores[sub.id]
                                    const color = SCORE_COLORS[score]
                                    const rubric = RUBRIC_SCALE[score]
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground w-20 shrink-0">Tu calificación:</span>
                                                {/* Progress bar */}
                                                <div className={`flex-1 h-2 rounded-full ${color.barBg} overflow-hidden`}>
                                                    <div className={`h-full rounded-full ${color.bg} transition-all duration-300`}
                                                        style={{ width: `${(score / 3) * 100}%` }} />
                                                </div>
                                                {/* Number buttons */}
                                                <div className="flex gap-1 text-xs font-mono">
                                                    {[0, 1, 2, 3].map(v => (
                                                        <button key={v} disabled={readOnly}
                                                            onClick={() => setA1SubScores(prev => ({ ...prev, [sub.id]: v }))}
                                                            className={`w-6 h-6 rounded text-center font-bold transition-all ${a1SubScores[sub.id] === v
                                                                ? `${SCORE_COLORS[v].bg} text-white ring-2 ${SCORE_COLORS[v].ring} shadow-sm`
                                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                                                            {v}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Legend */}
                                            <div className="flex items-center gap-2 pl-[calc(5rem+0.75rem)]">
                                                <span className={`text-xs font-bold ${color.text}`}>{rubric.label}</span>
                                                <span className="text-xs text-muted-foreground">— {rubric.desc}</span>
                                            </div>
                                        </div>
                                    )
                                })()}

                                {/* Comment */}
                                <textarea value={a1SubComments[sub.id]} disabled={readOnly}
                                    onChange={(e) => setA1SubComments(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                    placeholder="Evidencia observada..."
                                    className="w-full min-h-[45px] p-2 rounded-md border border-input bg-background text-foreground text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                        </div>
                    )
                })}

                {/* A1 Summary */}
                {(() => {
                    const pct = a1Total / 15
                    const level = a1Total <= 3 ? 0 : a1Total <= 7 ? 1 : a1Total <= 11 ? 2 : 3
                    const c = TOTAL_COLORS[level]
                    return (
                        <div className={`${c.fill} border ${c.border} rounded-lg p-4 space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-foreground">Total A1:</span>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold ${c.text}`}>{c.label}</span>
                                    <span className={`text-lg font-mono font-bold ${c.text}`}>{a1Total} / 15</span>
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
