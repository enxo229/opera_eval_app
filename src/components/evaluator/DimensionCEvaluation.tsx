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

// Evaluator guides from modelo-evaluacion-talento-tecnico.md — Dimensión C
const EVALUATOR_GUIDES: Record<string, {
    opening: string
    deepening: string[]
    positive: string[]
    alert: string[]
    scoring: { score: number; desc: string }[]
}> = {
    C1: {
        opening: '"Fuera de tus tareas rutinarias, ¿hay algún tema tecnológico (Linux, automatización, cloud, observabilidad) que hayas estudiado o practicado por tu cuenta recientemente? ¿Qué te motivó y cómo lo aplicaste?"',
        deepening: [
            '"¿Cómo lo aprendiste? ¿Usaste algún recurso en particular (documentación, laboratorios, cursos)?"',
            '"¿Lo aplicaste en algo concreto, ya sea en el trabajo o en un proyecto/laboratorio personal?"',
            '"¿Se lo compartiste o enseñaste a alguien de tu equipo?"',
        ],
        positive: [
            'Menciona fuentes técnicas concretas y aprendizaje autodirigido',
            'El aprendizaje fue auto-motivado por curiosidad técnica genuina',
            'Hay aplicación práctica real o en entornos de prueba',
            'Comparte lo aprendido con sus compañeros de forma natural',
        ],
        alert: [
            '"No he tenido tiempo" como respuesta principal y única',
            'Solo estudia cuando es una exigencia obligatoria de la empresa',
            'Conocimiento puramente memorístico sin interés práctico',
            'Desinterés por explorar nuevas herramientas',
        ],
        scoring: [
            { score: 7, desc: 'Hábito continuo y auto-motivado. Cita fuentes sólidas, laboratorios prácticos y comparte activamente.' },
            { score: 5, desc: 'Ejemplo concreto con fuentes y aplicación práctica pero con menor frecuencia o sin compartirlo.' },
            { score: 3, desc: 'Aprendió algo motivado por requerimientos laborales o de forma esporádica.' },
            { score: 1, desc: 'Respuesta vaga sin ejemplos verificables ni iniciativa de estudio propio.' },
            { score: 0, desc: 'Declara que no le interesa aprender más allá de su rutina diaria.' },
        ],
    },
    C2: {
        opening: '"En los turnos de soporte o infraestructura es común que cambien los procesos, herramientas o prioridades de emergencia. Cuéntame de un cambio reciente o un incidente inesperado difícil y cómo te adaptaste."',
        deepening: [
            '"¿Qué fue lo más retador de esa transición o situación inesperada?"',
            '"¿Hubo algo que hicieras tú específicamente para adaptarte más rápido o ayudar a otros?"',
            '"Si hoy implementaran una herramienta completamente nueva en tu guardia, ¿cómo lo abordarías?"',
        ],
        positive: [
            'Describe acciones concretas de adaptación y madurez emocional',
            'Enfoca los problemas y cambios como oportunidades de aprendizaje',
            'Investiga antes de bloquearse y apoya a sus compañeros',
            'Tiene reflexión crítica sobre cómo mejorar su respuesta operativa',
        ],
        alert: [
            'La queja, frustración o resistencia pasiva domina el relato',
            'Esperó pasivamente que otros resolvieran el impacto del cambio',
            'Percibe los cambios como imposiciones injustas sin valor',
            'Bloqueo ante la incertidumbre o fallos imprevistos',
        ],
        scoring: [
            { score: 7, desc: 'Adaptación proactiva y resiliente. Asume la transición con madurez, investiga y apoya al equipo.' },
            { score: 5, desc: 'Manejó bien el cambio con acciones concretas, aunque con menor iniciativa propia.' },
            { score: 3, desc: 'Se adaptó de forma pasiva ("me tocó y lo hice"). Sin aprendizaje explícito.' },
            { score: 1, desc: 'Relato dominado por resistencia, incomodidad o quejas persistentes.' },
            { score: 0, desc: 'Rechazo activo al cambio y parálisis ante situaciones nuevas.' },
        ],
    },
    C3: {
        opening: '"Si proyectas tu carrera en tecnología a 1 o 2 años, ¿hacia qué áreas (SRE, observabilidad, cloud, ingeniería de confiabilidad) te gustaría evolucionar y qué pasos estás dando para lograrlo?"',
        deepening: [
            '"¿Por qué te llama la atención esa especialidad técnica?"',
            '"¿Cómo conectas tu experiencia de soporte/NOC con el valor de la observabilidad y confiabilidad?"',
            '"¿Has dado algún paso concreto (estudio, laboratorios, certificaciones) para acercarte a esa meta?"',
        ],
        positive: [
            'Vector profesional claro y alineado a observabilidad, SRE, cloud o automatización',
            'Argumenta su interés técnico más allá de motivaciones externas',
            'Conecta el aprendizaje de métricas/incidentes con su proyección',
            'Ha tomado iniciativa concreta (rutas de formación, prácticas, lecturas)',
        ],
        alert: [
            '"No sé" o "donde me pongan" como respuesta principal',
            'Motivación exclusivamente salarial sin interés por el desarrollo técnico',
            'No ve conexión entre resolver problemas operativos y la ingeniería de confiabilidad',
            'Metas sin ningún paso o acción concreta',
        ],
        scoring: [
            { score: 6, desc: 'Visión clara y compatible (SRE, Observabilidad, Cloud). Pasos concretos iniciados y alta motivación.' },
            { score: 4, desc: 'Dirección clara y bien argumentada, aunque aún está iniciando los pasos prácticos.' },
            { score: 2, desc: 'Aspiraciones difusas o motivadas principalmente por factores externos.' },
            { score: 0, desc: 'No le interesa evolucionar técnicamente ni proyectar su crecimiento.' },
        ],
    },
}

const CATEGORIES = [
    { id: 'C1', name: 'Disposición al Aprendizaje Autónomo & Curiosidad', max: 7 },
    { id: 'C2', name: 'Adaptabilidad al Cambio & Resiliencia Operativa', max: 7 },
    { id: 'C3', name: 'Aspiraciones y Proyección hacia SRE/Observabilidad', max: 6 }
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
        C1: getInitialScore('C1'), C2: getInitialScore('C2'), C3: getInitialScore('C3')
    })
    const [comments, setComments] = useState<Record<string, string>>({
        C1: getInitialComment('C1'), C2: getInitialComment('C2'), C3: getInitialComment('C3')
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
                    <p className="text-muted-foreground text-sm">Aprendizaje Autónomo, Adaptabilidad y Proyección hacia SRE/Observabilidad (20 pts).</p>
                </div>
                {!readOnly && (
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                        {isSaving ? 'Guardando...' : 'Guardar Dimensión C'}
                    </Button>
                )}
            </div>

            {/* Sticky Sub-navigation */}
            <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm pb-4 pt-2 -mt-2 border-b border-border/50 mb-6">
                <div className="flex flex-wrap gap-2 p-1.5 bg-muted/30 rounded-xl border border-border/40">
                    {[
                        { id: 'section-C1', label: 'C1. Aprendizaje (7 pts)' },
                        { id: 'section-C2', label: 'C2. Adaptabilidad (7 pts)' },
                        { id: 'section-C3', label: 'C3. Proyección SRE (6 pts)' }
                    ].map(link => (
                        <Button 
                            key={link.id} 
                            variant="secondary" 
                            size="sm" 
                            className="text-[10px] sm:text-xs font-black uppercase tracking-wider h-8 px-4 rounded-lg bg-background shadow-sm hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                            onClick={() => {
                                const el = document.getElementById(link.id);
                                if (el) {
                                    const offset = 120;
                                    const bodyRect = document.body.getBoundingClientRect().top;
                                    const elementRect = el.getBoundingClientRect().top;
                                    const elementPosition = elementRect - bodyRect;
                                    const offsetPosition = elementPosition - offset;

                                    window.scrollTo({
                                        top: offsetPosition,
                                        behavior: 'smooth'
                                    });
                                }
                            }}
                        >
                            {link.label}
                        </Button>
                    ))}
                </div>
            </div>


            {CATEGORIES.map(cat => {
                const guide = EVALUATOR_GUIDES[cat.id]

                return (
                    <Card key={cat.id} id={`section-${cat.id}`} className="border-border scroll-mt-32">
                        <CardHeader className="bg-muted/30 border-b border-border py-4">
                            <CardTitle className="text-xl font-bold text-primary flex justify-between items-center">
                                <span>{cat.id}. {cat.name}</span>
                                <span className="text-sm font-mono text-muted-foreground">Máx. {cat.max} pts</span>
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
                                                if (s.score >= cat.max * 0.7) rowColor = 'bg-emerald-50 text-emerald-800 border-emerald-100 border'
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
                                const pct = (score / max) * 100
                                const color = pct >= 70 ? { bg: 'bg-emerald-600', rng: 'ring-emerald-300', text: 'text-emerald-700' } :
                                    pct >= 40 ? { bg: 'bg-orange-500', rng: 'ring-orange-300', text: 'text-orange-600' } :
                                        { bg: 'bg-red-500', rng: 'ring-red-300', text: 'text-red-700' }

                                const scoreOptions = Array.from({ length: max + 1 }, (_, i) => i)

                                return (
                                    <div className="mt-6 pt-4 border-t border-border border-dashed space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground w-36 shrink-0">Puntuación Final:</span>

                                            <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden shadow-inner hidden md:block">
                                                <div className={`h-full rounded-full ${color.bg} transition-all duration-300 ease-out`}
                                                    style={{ width: `${pct}%` }} />
                                            </div>

                                            <div className="flex gap-1.5 font-mono shrink-0 flex-wrap">
                                                {scoreOptions.map(v => (
                                                    <button key={v} disabled={readOnly}
                                                        onClick={() => setScores(prev => ({ ...prev, [cat.id]: v }))}
                                                        className={`w-8 h-8 rounded-lg text-center font-black transition-all text-sm ${scores[cat.id] === v
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
