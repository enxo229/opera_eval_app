'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, MessageCircleQuestion, ArrowUp } from 'lucide-react'

interface Props {
    evaluationId: string
    existingScores: any[]
    readOnly?: boolean
}

// Evaluator guides from modelo-evaluacion-noc.md — Dimensión C
const EVALUATOR_GUIDES: Record<string, {
    opening: string
    deepening: string[]
    positive: string[]
    alert: string[]
    scoring: { score: number; desc: string }[]
}> = {
    C1: {
        opening: '"Fuera del trabajo, ¿hay algo relacionado con tecnología que hayas aprendido por tu cuenta últimamente? ¿Qué te motivó a aprenderlo?"',
        deepening: [
            '"¿Cómo lo aprendiste? ¿Usaste algún recurso en particular?"',
            '"¿Lo aplicaste en algo concreto, ya sea en el trabajo o en un proyecto personal?"',
            '"¿Se lo contaste o enseñaste a alguien?"',
        ],
        positive: [
            'Menciona fuentes concretas (curso, video, documentación, práctica en lab)',
            'El aprendizaje fue auto-motivado, no por obligación laboral',
            'Hay aplicación real, aunque sea en proyecto personal',
            'Lo comparte con otros de forma natural',
        ],
        alert: [
            '"No he tenido tiempo" como respuesta principal',
            'Solo aprende cuando el trabajo lo exige',
            'Conocimiento puramente teórico sin aplicación',
            'Aprendizaje solitario y sin reflexión sobre el uso',
        ],
        scoring: [
            { score: 5, desc: 'Ejemplo específico con fuente, contexto y aplicación. Comparte lo que aprende. Hábito, no evento.' },
            { score: 4, desc: 'Ejemplo concreto con fuente y aplicación pero no profundiza en el hábito o en compartirlo.' },
            { score: 3, desc: 'Aprendió algo pero fue motivado por el trabajo. No hay iniciativa propia.' },
            { score: 2, desc: 'Respuesta vaga ("a veces veo videos") sin ejemplo concreto ni aplicación verificable.' },
            { score: 1, desc: 'No recuerda haber aprendido nada por su cuenta. No muestra interés.' },
            { score: 0, desc: 'Expresa que no le interesa aprender más de lo necesario para su trabajo.' },
        ],
    },
    C2: {
        opening: '"En el tiempo que llevas en Ópera, ¿ha habido algún cambio en cómo trabajan, en los procesos o herramientas? ¿Cómo te fue con eso?"',
        deepening: [
            '"¿Qué fue lo más difícil de ese cambio?"',
            '"¿Hubo algo que hicieras tú específicamente para adaptarte más rápido?"',
            '"Si hoy llegara un cambio grande en tu forma de trabajar, ¿qué sería lo primero que harías?"',
        ],
        positive: [
            'Describe acciones concretas que tomó para adaptarse',
            'Reconoce la dificultad pero la enmarca como aprendizaje',
            'Propuso algo o ayudó a otros durante la transición',
            'Reflexión sobre cómo mejoraría su respuesta futura',
        ],
        alert: [
            'La resistencia o la queja es el centro del relato',
            'Esperó pasivamente que el cambio "pasara"',
            'Percibe el cambio como algo que le pasa, no algo que puede manejar',
            'Cada cambio pasado fue vivido como negativo sin aprendizaje',
        ],
        scoring: [
            { score: 5, desc: 'Cambio real con dificultades, acciones tomadas y reflexión. Actitud proactiva ante cambios futuros.' },
            { score: 4, desc: 'Ejemplo real y lo manejó bien, reflexión superficial o no propuso algo.' },
            { score: 3, desc: 'Se adaptó pero de forma pasiva ("me tocó y lo hice"). Sin iniciativa propia.' },
            { score: 2, desc: 'Relato dominado por incomodidad. Resistencia significativa sin aprendizaje.' },
            { score: 1, desc: 'Resistencia al cambio sin mitigantes. No reconoce valor en cambios pasados.' },
            { score: 0, desc: 'Declara que no le gustan los cambios o preferiría que todo siga igual.' },
        ],
    },
    C3: {
        opening: '"Si pudieras elegir en qué dirección crecer profesionalmente dentro de tecnología, ¿hacia dónde irías? ¿Hay algo que te llame la atención?"',
        deepening: [
            '"¿Por qué esa área en particular?"',
            '"¿Hay algo de lo que haces hoy en Ópera que sientas que podría conectarse con ese camino?"',
            '"¿Has hecho algo concreto para acercarte a eso, aunque sea pequeño?"',
        ],
        positive: [
            'Dirección clara aunque no sea observabilidad (infra, DevOps, cloud, seguridad)',
            'Puede explicar por qué le interesa esa área',
            'Conecta algo de su trabajo actual con sus aspiraciones',
            'Ha dado algún paso concreto, por pequeño que sea',
        ],
        alert: [
            '"No sé" o "donde haya trabajo" como respuesta principal',
            'Motivación exclusivamente económica sin curiosidad técnica',
            'No ve relación entre lo que hace hoy y lo que quiere',
            'Solo aspiraciones sin ninguna acción',
        ],
        scoring: [
            { score: 5, desc: 'Dirección clara y compatible (infra, cloud, DevOps, SRE). Pasos concretos. Conecta con trabajo actual.' },
            { score: 4, desc: 'Dirección clara y bien argumentada, aún sin pasos concretos. Dirección compatible.' },
            { score: 3, desc: 'Aspiraciones difusas. No ha actuado. Dirección puede o no ser compatible.' },
            { score: 2, desc: 'Aspiraciones principalmente externas (salario, estabilidad) sin curiosidad técnica.' },
            { score: 1, desc: 'Sin dirección clara. Respuesta vaga sin reflexión sobre desarrollo propio.' },
            { score: 0, desc: 'No le interesa crecer o cambiar. Cómodo con statu quo sin aspiración técnica.' },
        ],
    },
    C4: {
        opening: '"Cuéntame de una situación en Ópera en que recibiste una alerta que no sabías cómo manejar y no había nadie disponible. ¿Qué hiciste?"',
        deepening: [
            '"¿Qué fue lo primero que hiciste antes de escalar?"',
            '"¿Dejaste algún registro de lo que investigaste?"',
            '"¿Qué harías diferente si volviera a pasar?"',
        ],
        positive: [
            'Buscó información por su cuenta antes de escalar',
            'Documentó lo que encontró aunque no resolviera el problema',
            'Escaló con contexto (qué encontró, qué intentó)',
            'Reflexiona sobre qué haría distinto',
        ],
        alert: [
            'Escala inmediatamente sin ninguna investigación previa',
            'No dejó rastro de sus acciones',
            'Escaló con "hay un problema" sin información adicional',
            'No extrae aprendizaje de la situación',
        ],
        scoring: [
            { score: 5, desc: 'Investigación concreta antes de escalar. Escaló con contexto claro. Documentó. Reflexión sobre mejora.' },
            { score: 4, desc: 'Investigó y escaló con contexto, pero no documentó o reflexión superficial.' },
            { score: 3, desc: 'Investigó brevemente pero escaló rápido. Contexto incompleto.' },
            { score: 2, desc: 'Escaló rápidamente con poco o ningún intento de investigación. Sin documentación.' },
            { score: 1, desc: 'Escaló inmediatamente sin investigar. No reconoce que debería haber hecho algo diferente.' },
            { score: 0, desc: 'Parálisis o confusión total sin ninguna acción tomada.' },
        ],
    },
}

const CATEGORIES = [
    { id: 'C1', name: 'Disposición al Aprendizaje Autónomo', max: 5 },
    { id: 'C2', name: 'Adaptabilidad al Cambio', max: 5 },
    { id: 'C3', name: 'Aspiraciones de Crecimiento Profesional', max: 5 },
    { id: 'C4', name: 'Tolerancia a la Incertidumbre', max: 5 }
]

export function DimensionCEvaluation({ evaluationId, existingScores, readOnly }: Props) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [expandedGuide, setExpandedGuide] = useState<string | null>(null)

    const getInitialScore = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'C' && s.category === categoryId)
        return found ? found.raw_score : 0
    }
    const getInitialComment = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'C' && s.category === categoryId)
        return found?.comments || ''
    }

    const [scores, setScores] = useState<Record<string, number>>({
        C1: getInitialScore('C1'), C2: getInitialScore('C2'),
        C3: getInitialScore('C3'), C4: getInitialScore('C4')
    })
    const [comments, setComments] = useState<Record<string, string>>({
        C1: getInitialComment('C1'), C2: getInitialComment('C2'),
        C3: getInitialComment('C3'), C4: getInitialComment('C4')
    })

    const handleSave = async () => {
        setIsSaving(true)
        const supabase = createClient()
        for (const cat of CATEGORIES) {
            const { data: existing } = await supabase.from('dimension_scores').select('id')
                .eq('evaluation_id', evaluationId).eq('dimension', 'C').eq('category', cat.id).single()
            if (existing) {
                await supabase.from('dimension_scores').update({ raw_score: scores[cat.id], comments: comments[cat.id] }).eq('id', existing.id)
            } else {
                await supabase.from('dimension_scores').insert({ evaluation_id: evaluationId, dimension: 'C', category: cat.id, raw_score: scores[cat.id], comments: comments[cat.id] })
            }
        }
        setIsSaving(false)
        router.refresh()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Dimensión C: Actitudinal</h2>
                    <p className="text-muted-foreground text-sm">Aprendizaje, Entorno y Crecimiento Personal (20 pts). Evaluada como conversación de desarrollo profesional.</p>
                </div>
                {!readOnly && (
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                        {isSaving ? 'Guardando...' : 'Guardar Dimensión C'}
                    </Button>
                )}
            </div>


            {CATEGORIES.map(cat => {
                const guide = EVALUATOR_GUIDES[cat.id]
                const isGuideOpen = expandedGuide === cat.id

                return (
                    <Card key={cat.id} className="border-border">
                        <CardHeader className="bg-muted/30 border-b border-border py-4">
                            <CardTitle className="text-xl font-bold text-primary">
                                {cat.id}. {cat.name}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-5 space-y-4">
                            {/* Evaluator Guide Static Header */}
                            <div className="w-full flex items-center gap-2 font-bold text-purple-800 bg-purple-100/50 border border-purple-200 rounded-lg px-4 py-3 mb-4 text-base">
                                <MessageCircleQuestion className="h-5 w-5" /> Guía del Evaluador — Preguntas, Indicadores y Puntuación
                            </div>

                            {/* Permanently visible guide */}
                            {guide && (
                                <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-5 space-y-5 text-base shadow-sm">
                                    {/* Opening question */}
                                    <div>
                                        <p className="font-bold text-purple-800 mb-1.5 uppercase tracking-wide text-xs">🎯 Pregunta de apertura:</p>
                                        <p className="text-purple-950 bg-white p-3 rounded-md italic border border-purple-100/50">{guide.opening}</p>
                                    </div>

                                    {/* Deepening questions */}
                                    <div>
                                        <p className="font-bold text-purple-800 mb-1.5 uppercase tracking-wide text-xs">🔍 Preguntas de profundización:</p>
                                        <ul className="space-y-2 bg-white/50 p-3 rounded-md border border-purple-100/30">
                                            {guide.deepening.map((q, i) => (
                                                <li key={i} className="text-purple-950 flex items-start gap-2">
                                                    <span className="text-purple-400 mt-0.5">•</span> <span>{q}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Positive vs Alert indicators */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-4 shadow-sm">
                                            <p className="font-bold text-emerald-800 mb-3 text-sm flex items-center gap-1.5">✅ Indicadores Positivos</p>
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
                                    <div className="pt-2 border-t border-purple-100/50">
                                        <p className="font-bold text-purple-800 mb-3 uppercase tracking-wide text-xs">📊 Guía de puntuación:</p>
                                        <div className="space-y-1.5">
                                            {guide.scoring.map((s, i) => {
                                                const isActive = scores[cat.id] === s.score
                                                let rowColor = 'bg-white text-slate-700 border-transparent border'
                                                if (s.score >= 4) rowColor = 'bg-emerald-50 text-emerald-800 border-emerald-100 border'
                                                else if (s.score <= 1) rowColor = 'bg-red-50 text-red-800 border-red-100 border'

                                                return (
                                                    <div key={i}
                                                        onClick={() => !readOnly && setScores(prev => ({ ...prev, [cat.id]: s.score }))}
                                                        className={`flex gap-3 text-sm items-center p-2.5 rounded-lg transition-all ${!readOnly ? 'cursor-pointer hover:shadow-md' : ''} ${isActive ? 'ring-2 ring-primary ring-offset-1 scale-[1.01] shadow-md z-10 font-medium' : rowColor}`}>
                                                        <span className={`font-black shrink-0 w-8 h-8 flex items-center justify-center rounded-md ${isActive ? 'bg-primary text-primary-foreground' : 'bg-background/80 shadow-sm text-muted-foreground'}`}>
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

                            {/* Interactive Score Progress Bar */}
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
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                        {isSaving ? 'Guardando...' : 'Guardar Dimensión C'}
                    </Button>
                )}
            </div>
        </div>
    )
}
