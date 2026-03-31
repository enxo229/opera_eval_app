'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { MessageCircleQuestion, ArrowUp, Sparkles, RefreshCw, Trash2, Bot } from 'lucide-react'
import { getIA2State, resetIAResponses } from '@/app/actions/candidate'

interface Props {
    evaluationId: string
    existingScores: any[]
    readOnly?: boolean
}

// Evaluator guides from modelo-evaluacion-noc.md — Dimensión D (Uso IA)
const EVALUATOR_GUIDES: Record<string, {
    description: string
    positive: string[]
    alert: string[]
    scoring: { score: number; desc: string }[]
}> = {
    'IA-1': {
        description: 'Conversación sobre actitud frente a la IA como Herramienta de Trabajo.\nPregunta de apertura: "¿Usas alguna herramienta de inteligencia artificial en tu trabajo o en tu vida personal? ¿Para qué?"\nPreguntas de profundización:\n- "¿Hubo algún momento en que la IA te dio una respuesta que estaba mal o que no tenía sentido? ¿Cómo te diste cuenta?"\n- "¿Crees que herramientas como ChatGPT o Copilot pueden ayudarte a hacer mejor tu trabajo técnico? ¿De qué forma?"\n- "¿Te genera alguna preocupación el hecho de que la IA esté siendo usada cada vez más en tecnología?"',
        positive: [
            'Ya usa IA para algo concreto (buscar información, redactar, entender errores).',
            'Ha notado alguna vez que la IA se equivocó y lo puede explicar.',
            'Ve la IA como un asistente que le ahorra tiempo o le ayuda a aprender.',
            'Tiene curiosidad por aprender a usarla mejor.',
        ],
        alert: [
            'Nunca la ha usado y no muestra curiosidad por hacerlo.',
            'Acepta todo lo que la IA dice sin filtro crítico.',
            'Ve la IA como una amenaza a su trabajo sin matices.',
            'Desinterés total o rechazo activo.',
        ],
        scoring: [
            { score: 5, desc: 'Usa IA regularmente con ejemplos concretos. Tiene pensamiento crítico sobre sus limitaciones. La ve como palanca de crecimiento y quiere aprender más.' },
            { score: 4, desc: 'Usa IA ocasionalmente con ejemplo concreto. Entiende que puede equivocarse. Actitud positiva aunque no la explora activamente.' },
            { score: 3, desc: 'Ha usado IA pero de forma esporádica o superficial. Actitud neutral: ni entusiasta ni en contra.' },
            { score: 2, desc: 'Poca o nula experiencia. Actitud de indiferencia o ligera desconfianza. No ve conexión con su trabajo.' },
            { score: 1, desc: 'No la usa y tiene resistencia o miedo explícito. Percibe la IA principalmente como amenaza.' },
            { score: 0, desc: 'Rechazo activo. Expresa que no quiere usarla bajo ninguna circunstancia.' },
        ],
    },
    'IA-2': {
        description: 'Entrega al candidato el siguiente enunciado y permítele usar cualquier herramienta de IA de su preferencia (ChatGPT, Gemini, Copilot, Claude, etc.) en su celular o computador:\n\n"Usando la herramienta de IA que prefieras, pregúntale cómo buscarías en Elasticsearch todos los logs de error del servidor srv-prod-payments-01 del día de ayer. Cuando tengas la respuesta, explícame si crees que es correcta y por qué."',
        positive: [
            'Sabe cómo interactuar con una IA para obtener algo útil (cómo formula la pregunta).',
            'Tiene criterio para validar lo que la IA le responde.',
        ],
        alert: [
            'Acepta la respuesta a ciegas sin cuestionarla.',
            'Nunca ha usado una herramienta de IA y no sabe cómo acceder a ella.',
        ],
        scoring: [
            { score: 5, desc: 'Formula una pregunta clara y con contexto. Evalúa la respuesta críticamente: identifica qué es correcto, qué le falta o qué ajustaría. No acepta la respuesta a ciegas.' },
            { score: 4, desc: 'Formula bien la pregunta y entiende la respuesta, pero la acepta sin cuestionarla o con poca reflexión crítica.' },
            { score: 3, desc: 'Usa la herramienta pero la pregunta es vaga. La respuesta que obtiene es genérica y no lo nota.' },
            { score: 2, desc: 'Ha usado IA antes pero le cuesta formular la pregunta en este contexto. Necesita orientación.' },
            { score: 1, desc: 'Nunca ha usado una herramienta de IA. Lo intenta pero sin resultado útil.' },
            { score: 0, desc: 'Se niega a usar la herramienta o no sabe cómo acceder a ninguna.' },
        ],
    },
}

const CATEGORIES = [
    { id: 'IA-1', name: 'Actitud frente a la IA como Herramienta de Trabajo', max: 5 },
    { id: 'IA-2', name: 'Uso Práctico de Herramientas de IA', max: 5 },
]

export function DimensionDEvaluation({ evaluationId, existingScores, readOnly }: Props) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)

    const getInitialScore = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'D' && s.category === categoryId)
        return found ? found.raw_score : 0
    }
    const getInitialComment = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'D' && s.category === categoryId)
        return found?.comments || ''
    }

    const [scores, setScores] = useState<Record<string, number>>({
        'IA-1': getInitialScore('IA-1'),
        'IA-2': getInitialScore('IA-2'),
    })
    const [comments, setComments] = useState<Record<string, string>>({
        'IA-1': getInitialComment('IA-1'),
        'IA-2': getInitialComment('IA-2'),
    })

    const [ia2Prompt, setIa2Prompt] = useState<string | null>(null)
    const [ia2Analysis, setIa2Analysis] = useState<any>(null)
    const [isLoadingIa2, setIsLoadingIa2] = useState(false)

    const loadIa2State = async () => {
        setIsLoadingIa2(true)
        const state = await getIA2State(evaluationId)
        if (state.promptText) {
            setIa2Prompt(state.promptText)
            setIa2Analysis(state.aiAnalysis)
            // Auto-fill suggested score if empty
            if (state.aiAnalysis?.suggested_score !== undefined && scores['IA-2'] === 0) {
                setScores(prev => ({ ...prev, 'IA-2': state.aiAnalysis.suggested_score }))
            }
        } else {
            setIa2Prompt(null)
            setIa2Analysis(null)
        }
        setIsLoadingIa2(false)
    }

    useEffect(() => {
        loadIa2State()
    }, [evaluationId])

    const handleResetIa2 = async () => {
        if (!confirm('¿Estás seguro de que deseas borrar la respuesta del candidato? Tendrá que enviarla de nuevo.')) return
        await resetIAResponses(evaluationId)
        await loadIa2State()
    }

    const handleSave = async () => {
        setIsSaving(true)
        const supabase = createClient()
        for (const cat of CATEGORIES) {
            const { data: existing } = await supabase.from('dimension_scores').select('id')
                .eq('evaluation_id', evaluationId).eq('dimension', 'D').eq('category', cat.id).single()
            if (existing) {
                await supabase.from('dimension_scores').update({ raw_score: scores[cat.id], comments: comments[cat.id] }).eq('id', existing.id)
            } else {
                await supabase.from('dimension_scores').insert({ evaluation_id: evaluationId, dimension: 'D', category: cat.id, raw_score: scores[cat.id], comments: comments[cat.id] })
            }
        }
        setIsSaving(false)
        router.refresh()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-indigo-50 border border-indigo-200 rounded-xl p-5 shadow-sm">
                <div className="flex gap-4 items-start">
                    <div className="bg-indigo-500 text-white p-2 rounded-lg shrink-0">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-indigo-900">Dimensión Complementaria: Uso e Incorporación de IA</h2>
                        <p className="text-indigo-800 text-sm mt-1 leading-relaxed">
                            Esta sección <strong>no afecta</strong> los puntajes de las dimensiones A, B y C. <br />
                            Su puntaje (máx. 10 pts) se usa exclusivamente como <strong>criterio de desempate</strong> y para diseñar el plan de <em>onboarding</em> diferencial.
                        </p>
                    </div>
                </div>
                {!readOnly && (
                    <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold">
                        {isSaving ? 'Guardando...' : 'Guardar Dimensión D'}
                    </Button>
                )}
            </div>

            {CATEGORIES.map(cat => {
                const guide = EVALUATOR_GUIDES[cat.id]

                return (
                    <Card key={cat.id} className="border-border">
                        <CardHeader className="bg-muted/30 border-b border-border py-4">
                            <CardTitle className="text-xl font-bold flex justify-between items-center text-primary">
                                <span>{cat.id}. {cat.name}</span>
                                {cat.id === 'IA-2' && !readOnly && (
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={loadIa2State} disabled={isLoadingIa2} className="h-8 gap-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
                                            <RefreshCw className={`h-3 w-3 ${isLoadingIa2 ? 'animate-spin' : ''}`} /> Recargar
                                        </Button>
                                        {ia2Prompt && (
                                            <Button variant="outline" size="sm" onClick={handleResetIa2} className="h-8 gap-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 border-red-200 transition-colors">
                                                <Trash2 className="h-3 w-3" /> Resetear
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-5 space-y-4">
                            {/* Evaluator Guide Static Header */}
                            <div className="w-full flex items-center gap-2 font-bold text-indigo-800 bg-indigo-100/50 border border-indigo-200 rounded-lg px-4 py-3 mb-4 text-base">
                                <MessageCircleQuestion className="h-5 w-5" /> Guía del Evaluador — Escenario y Puntuación
                            </div>

                            {/* Permanently visible guide */}
                            {guide && (
                                <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-5 space-y-5 text-base shadow-sm">
                                    {/* Description */}
                                    <div>
                                        <p className="font-bold text-indigo-800 mb-1.5 uppercase tracking-wide text-xs">Instrucción / Contexto:</p>
                                        <div className="text-indigo-950 bg-white p-3 rounded-md italic border border-indigo-100/50 whitespace-pre-line">
                                            {guide.description}
                                        </div>
                                    </div>

                                    {/* Positive vs Alert indicators */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-4 shadow-sm">
                                            <p className="font-bold text-emerald-800 mb-3 text-sm flex items-center gap-1.5">✅ Lo que buscamos (Positivo)</p>
                                            <ul className="space-y-2">
                                                {guide.positive.map((p, i) => (
                                                    <li key={i} className="text-sm text-emerald-900 leading-snug flex items-start gap-2">
                                                        <span className="shrink-0 text-emerald-500">•</span> {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-red-50/80 border border-red-200/60 rounded-xl p-4 shadow-sm">
                                            <p className="font-bold text-red-800 mb-3 text-sm flex items-center gap-1.5">🚨 Indicadores de Alerta</p>
                                            <ul className="space-y-2">
                                                {guide.alert.map((a, i) => (
                                                    <li key={i} className="text-sm text-red-900 leading-snug flex items-start gap-2">
                                                        <span className="shrink-0 text-red-500">•</span> {a}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Scoring guide list */}
                                    <div className="pt-2 border-t border-indigo-100/50">
                                        <p className="font-bold text-indigo-800 mb-3 uppercase tracking-wide text-xs">📊 Guía de puntuación:</p>
                                        <div className="space-y-1.5">
                                            {guide.scoring.map((s, i) => {
                                                const isActive = scores[cat.id] === s.score
                                                let rowColor = 'bg-white text-slate-700 border-transparent border'
                                                if (s.score >= 4) rowColor = 'bg-emerald-50 text-emerald-800 border-emerald-100 border'
                                                else if (s.score <= 1) rowColor = 'bg-red-50 text-red-800 border-red-100 border'

                                                return (
                                                    <div key={i}
                                                        onClick={() => !readOnly && setScores(prev => ({ ...prev, [cat.id]: s.score }))}
                                                        className={`flex gap-3 text-sm items-center p-2.5 rounded-lg transition-all ${!readOnly ? 'cursor-pointer hover:shadow-md' : ''} ${isActive ? 'ring-2 ring-indigo-500 ring-offset-1 scale-[1.01] shadow-md z-10 font-medium' : rowColor}`}>
                                                        <span className={`font-black shrink-0 w-8 h-8 flex items-center justify-center rounded-md ${isActive ? 'bg-indigo-600 text-white' : 'bg-background/80 shadow-sm text-muted-foreground'}`}>
                                                            {s.score}
                                                        </span>
                                                        <span className="leading-snug">{s.desc}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Candidate Prompt and AI Analysis for IA-2 */}
                            {cat.id === 'IA-2' && (
                                <div className="mt-8 mb-6 border-t border-indigo-100 pt-6">
                                    <div className="flex items-center justify-between mb-4 pb-2">
                                        <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-lg">
                                            <NextImage src="/icons/AIAgent.png" alt="IA" width={40} height={40} /> Respuesta del Candidato (Análisis de IA)
                                        </h3>
                                    </div>

                                    {!ia2Prompt ? (
                                        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-500 shadow-sm">
                                            <NextImage src="/icons/AIAgent.png" alt="IA" width={80} height={80} className="mx-auto mb-2 opacity-30" />
                                            El candidato aún no ha enviado su prompt. <br /> Espera a que lo envíe en su pantalla y luego presiona "Recargar".
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-slate-900 rounded-xl p-5 shadow-inner">
                                                <p className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-2"><MessageCircleQuestion className="h-3.5 w-3.5" /> Prompt Original (Candidato)</p>
                                                <p className="text-sm font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">{ia2Prompt}</p>
                                            </div>

                                            {ia2Analysis && (
                                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>

                                                    <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-wide flex items-center gap-1.5">
                                                        <Sparkles className="h-4 w-4 text-amber-500" /> Auto-Análisis Gemini
                                                    </h4>
                                                    <div className="grid md:grid-cols-2 gap-4 relative z-10">
                                                        <div className="bg-white p-4 rounded-xl border border-indigo-100/60 shadow-sm text-sm">
                                                            <p className="font-bold text-indigo-900 mb-1.5">Evaluación de Contexto</p>
                                                            <p className="text-slate-700 leading-relaxed">{ia2Analysis.context_analysis}</p>
                                                        </div>
                                                        <div className="bg-white p-4 rounded-xl border border-indigo-100/60 shadow-sm text-sm">
                                                            <p className="font-bold text-indigo-900 mb-1.5">Evaluación de Claridad</p>
                                                            <p className="text-slate-700 leading-relaxed">{ia2Analysis.clarity_analysis}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col md:flex-row gap-4 relative z-10">
                                                        <div className="bg-white p-4 rounded-xl border border-indigo-100/60 shadow-sm text-sm flex-1">
                                                            <p className="font-bold text-indigo-900 mb-1.5 flex items-center gap-1.5">🎯 Sugerencia al Evaluador</p>
                                                            <p className="text-indigo-800 italic leading-relaxed font-medium">"{ia2Analysis.feedback_to_evaluator}"</p>
                                                        </div>
                                                        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-4 rounded-xl shadow border border-indigo-400 flex flex-col items-center justify-center shrink-0 min-w-[140px]">
                                                            <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider mb-1">Score IA Sugerido</p>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-3xl font-black">{ia2Analysis.suggested_score}</span>
                                                                <span className="text-sm font-medium text-indigo-200">/ 5</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Interactive Score Progress Bar (0-5) */}
                            {(() => {
                                const score = scores[cat.id] || 0
                                const max = cat.max
                                const color = score >= 4 ? { bg: 'bg-emerald-600', rng: 'ring-emerald-300', text: 'text-emerald-700' } :
                                    score >= 2 ? { bg: 'bg-orange-500', rng: 'ring-orange-300', text: 'text-orange-600' } :
                                        { bg: 'bg-red-500', rng: 'ring-red-300', text: 'text-red-700' }

                                return (
                                    <div className="mt-6 pt-4 border-t border-border border-dashed space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground w-36 shrink-0">Puntuación Final:</span>

                                            <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden shadow-inner hidden md:block">
                                                <div className={`h-full rounded-full ${color.bg} transition-all duration-300 ease-out`}
                                                    style={{ width: `${(score / max) * 100}%` }} />
                                            </div>

                                            <div className="flex gap-2 font-mono shrink-0">
                                                {[0, 1, 2, 3, 4, 5].map(v => (
                                                    <button key={v} disabled={readOnly}
                                                        onClick={() => setScores(prev => ({ ...prev, [cat.id]: v }))}
                                                        className={`w-9 h-9 rounded-lg text-center font-black transition-all text-sm ${scores[cat.id] === v
                                                            ? `${color.bg} text-white ring-4 ${color.rng} shadow-md scale-110 z-10`
                                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                                                        {v}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Comments */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Evidencia / Comentarios</label>
                                <textarea value={comments[cat.id]} disabled={readOnly}
                                    onChange={(e) => setComments(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                    placeholder="Registra lo evidenciado ante este comportamiento..." className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                        </CardContent>
                    </Card>
                )
            })}

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-border pb-10">
                <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="gap-2 shadow-sm">
                    <ArrowUp className="w-4 h-4" /> Ir al principio
                </Button>
                {!readOnly && (
                    <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold">
                        {isSaving ? 'Guardando...' : 'Guardar Dimensión D'}
                    </Button>
                )}
            </div>
        </div>
    )
}
