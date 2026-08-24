'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { MessageCircleQuestion, ArrowUp, Sparkles } from 'lucide-react'
import { AiLikelihoodBadge } from './AiLikelihoodBadge'
import { calculateDimensionC } from '@/app/actions/evaluation'

interface Props {
    evaluationId: string
    existingScores: any[]
    dynamicTests?: any[]
    readOnly?: boolean
    profileTrack?: string
}

// Evaluator guides from modelo-evaluacion-talento-tecnico.md — Dimensión C (General Track)
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
        opening: '"Imagina que en tu equipo introducen una nueva herramienta de observabilidad que nunca has usado y cambia la forma en que gestionan las alertas. ¿Cómo enfrentas esa transición?"',
        deepening: [
            '"¿Qué haces primero: lees la documentación, experimentas directamente o pides ayuda a un compañero?"',
            '"Cuéntame de una ocasión real donde te cambiaron una herramienta o procedimiento de forma imprevista."',
            '"¿Cómo manejas la frustración cuando una herramienta o script no se comporta como esperabas?"',
        ],
        positive: [
            'Actitud de bienvenida al cambio como oportunidad de crecimiento',
            'Estrategia balanceada: experimenta, documenta y consulta oportunamente',
            'Resiliencia y enfoque analítico frente a fallas o errores',
            'Acepta feedback constructivo con madurez',
        ],
        alert: [
            'Resistencia activa: "La herramienta anterior era mejor y no era necesario cambiar"',
            'Dependencia excesiva de otros para aprender lo básico',
            'Se frustra fácilmente y abandona la tarea o culpa al entorno',
            'Rechazo a adaptar sus flujos de trabajo',
        ],
        scoring: [
            { score: 7, desc: 'Adopción proactiva, investiga documentación por cuenta propia y ayuda a otros en la transición.' },
            { score: 5, desc: 'Se adapta positivamente en tiempo razonable tras un periodo de ajuste natural.' },
            { score: 3, desc: 'Acepta el cambio pero requiere supervisión y apoyo constante para utilizar la nueva herramienta.' },
            { score: 1, desc: 'Resistencia pasiva o frustración evidente que retrasa la adopción.' },
            { score: 0, desc: 'Rechazo explícito al cambio y negatividad ante la evolución tecnológica.' },
        ],
    },
    C3: {
        opening: '"Pensando en tu desarrollo profesional a mediano plazo, ¿hacia dónde te gustaría orientar tu carrera técnica (Observabilidad, SRE, Cloud, DevOps)? ¿Por qué te llama la atención esa ruta?"',
        deepening: [
            '"¿Qué diferencias ves entre la operación tradicional de soporte y la disciplina de Observabilidad/SRE?"',
            '"¿Qué pasos concretos estás dando o planeas dar para formarte en esa dirección?"',
            '"¿Qué tipo de problemas técnicos son los que más disfrutas resolver en tu día a día?"',
        ],
        positive: [
            'Visión clara de evolución desde soporte hacia Observabilidad / SRE',
            'Entiende la diferencia entre monitoreo reactivo y observabilidad proactiva',
            'Demuestra motivación intrínseca por la confiabilidad y el análisis de sistemas',
            'Tiene metas de aprendizaje concretas y alcanzables',
        ],
        alert: [
            'No tiene claridad sobre su proyección o busca únicamente un cambio de título',
            'Ve la observabilidad solo como "ver pantallas con métricas"',
            'Falta de ambición técnica o conformismo con tareas repetitivas',
            'Expectativas desconectadas de las realidades operativas de TI',
        ],
        scoring: [
            { score: 6, desc: 'Visión sólida, motivación genuina y comprensión profunda del valor de la observabilidad moderna.' },
            { score: 4, desc: 'Interés claro y positivo por evolucionar, con nociones correctas sobre el rol de observabilidad.' },
            { score: 3, desc: 'Interés general por crecer pero sin foco definido en observabilidad o confiabilidad.' },
            { score: 1, desc: 'Poco interés en proyección técnica; motivado principalmente por aspectos extrínsecos.' },
            { score: 0, desc: 'Sin ninguna aspiración de desarrollo ni interés por aprender nuevas disciplinas.' },
        ],
    },
}

// Evaluator question guides per category (C1-C2) - OTel Expert Track
const EVALUATOR_GUIDES_OTEL: Record<string, {
    opening: string
    deepening: string[]
    positive: string[]
    alert: string[]
    scoring: { score: number; desc: string }[]
}> = {
    C1: {
        opening: '"¿Cómo gestionas una cultura Blameless (sin culpas) durante y después de un incidente grave de producción?"',
        deepening: [
            '"¿Cómo diferencias un error humano de una falla sistémica en los post-mortems?"',
            '"¿Qué acciones tomas para que los aprendizajes de un post-mortem se traduzcan en mejoras arquitectónicas reales?"'
        ],
        positive: [
            'Foco en causas sistémicas y mejora de procesos, no en señalar personas',
            'Documentación exhaustiva con líneas de tiempo y planes de acción accionables',
            'Fomenta la seguridad psicológica en el equipo'
        ],
        alert: [
            'Tendencia a buscar culpables o castigar errores individuales',
            'Post-mortems superficiales que no previenen incidentes futuros'
        ],
        scoring: [
            { score: 5, desc: 'Cultura blameless ejemplar, post-mortems estructurados y orientados a ingeniería de resiliencia.' },
            { score: 3, desc: 'Entiende el concepto pero en la práctica se enfoca en resolver rápido sin documentar lecciones.' },
            { score: 1, desc: 'Enfoque reactivo y punitivo ante fallas.' }
        ]
    },
    C2: {
        opening: '"¿Cómo aplicas el concepto de Error Budget para balancear la velocidad de despliegue con la confiabilidad del servicio?"',
        deepening: [
            '"¿Qué decisión tomas si el presupuesto de error se agota a mitad de mes y el equipo de producto quiere lanzar un release crítico?"',
            '"¿Cómo defines qué es un SLI relevante para el usuario final vs una simple métrica de servidor?"'
        ],
        positive: [
            'Definición de SLIs desde la perspectiva del usuario final',
            'Aplicación rigurosa y constructiva de políticas ante presupuestos de error agotados',
            'Alineación entre objetivos de ingeniería y metas de negocio'
        ],
        alert: [
            'Tratar los SLOs como metas inalcanzables del 100% de disponibilidad',
            'Ignorar el presupuesto de error ante presiones comerciales sin análisis de riesgo'
        ],
        scoring: [
            { score: 5, desc: 'Mentalidad SRE madura; maneja trade-offs entre velocidad y disponibilidad con datos.' },
            { score: 3, desc: 'Conoce los términos pero no ha participado en la gobernanza de Error Budgets.' },
            { score: 1, desc: 'Desconoce la metodología o pretende 100% disponibilidad sin balance.' }
        ]
    }
}

export function DimensionCEvaluation({ evaluationId, existingScores, dynamicTests = [], readOnly, profileTrack }: Props) {
    const router = useRouter()
    const isOtel = profileTrack === 'otel_expert'

    const CATEGORIES = isOtel ? [
        { id: 'C1', name: 'Cultura Blameless & Post-mortems', max: 5 },
        { id: 'C2', name: 'Mentalidad de SLOs & Error Budgets', max: 5 },
    ] : [
        { id: 'C1', name: 'Aprendizaje Continuo y Curiosidad Técnica', max: 7 },
        { id: 'C2', name: 'Adaptabilidad al Cambio y Nuevas Herramientas', max: 7 },
        { id: 'C3', name: 'Proyección y Motivación hacia Observabilidad / SRE', max: 6 },
    ]

    const [isSaving, setIsSaving] = useState(false)

    const getInitialScore = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'C' && s.category === categoryId)
        return found ? found.raw_score : 0
    }
    const getInitialComment = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'C' && s.category === categoryId)
        return found?.comments || ''
    }

    const [scores, setScores] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {
            C1: getInitialScore('C1'),
            C2: getInitialScore('C2')
        }
        if (!isOtel) {
            init.C3 = getInitialScore('C3')
        }
        return init
    })
    const [comments, setComments] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {
            C1: getInitialComment('C1'),
            C2: getInitialComment('C2')
        }
        if (!isOtel) {
            init.C3 = getInitialComment('C3')
        }
        return init
    })

    const handleSave = async () => {
        setIsSaving(true)
        const supabase = createClient()
        try {
            for (const cat of CATEGORIES) {
                const ext = existingScores.find(s => s.dimension === 'C' && s.category === cat.id)
                const { error: upsertErr } = await supabase.from('dimension_scores').upsert({
                    ...(ext ? { id: ext.id } : {}),
                    evaluation_id: evaluationId,
                    dimension: 'C',
                    category: cat.id,
                    raw_score: scores[cat.id] || 0,
                    comments: comments[cat.id] || ''
                })
                if (upsertErr) throw upsertErr
            }

            // Normalizar y guardar score_c en evaluations
            const calculatedC = await calculateDimensionC({
                c1: scores['C1'] || 0,
                c2: scores['C2'] || 0,
                c3: scores['C3'] || 0
            }, profileTrack)

            await supabase.from('evaluations').update({ score_c: calculatedC }).eq('id', evaluationId)

            alert('Dimensión C guardada exitosamente.')
            router.refresh()
        } catch (error: any) {
            console.error('Error guardando Dimensión C:', error)
            alert('Error al guardar Dimensión C: ' + (error?.message || 'Error desconocido'))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Dimensión C: Actitudinal</h2>
                    <p className="text-muted-foreground text-sm">
                        {isOtel
                            ? 'Cultura Blameless, Filosofía SRE, SLOs y Error Budgets (20 pts).'
                            : 'Aprendizaje Autónomo, Adaptabilidad y Proyección hacia SRE/Observabilidad (20 pts).'}
                    </p>
                </div>
                {!readOnly && (
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer">
                        {isSaving ? 'Guardando...' : 'Guardar Dimensión C'}
                    </Button>
                )}
            </div>

            {/* Sticky Sub-navigation */}
            <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm pb-4 pt-2 -mt-2 border-b border-border/50 mb-6">
                <div className="flex flex-wrap gap-2 p-1.5 bg-muted/30 rounded-xl border border-border/40">
                    {CATEGORIES.map(link => (
                        <Button
                            key={link.id}
                            variant="secondary"
                            size="sm"
                            className="text-[10px] sm:text-xs font-black uppercase tracking-wider h-8 px-4 rounded-lg bg-background shadow-sm hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer"
                            onClick={() => {
                                const element = document.getElementById(`section-${link.id}`);
                                if (element) {
                                    const yCoordinate = element.getBoundingClientRect().top + window.scrollY;
                                    const offset = 120;
                                    const offsetPosition = yCoordinate - offset;
                                    window.scrollTo({
                                        top: offsetPosition,
                                        behavior: 'smooth'
                                    });
                                }
                            }}
                        >
                            {link.id}. {link.name} ({link.max} pts)
                        </Button>
                    ))}
                </div>
            </div>

            {CATEGORIES.map(cat => {
                const guidesMap = isOtel ? EVALUATOR_GUIDES_OTEL : EVALUATOR_GUIDES
                const guide = guidesMap[cat.id]

                return (
                    <Card key={cat.id} id={`section-${cat.id}`} className="border-border scroll-mt-32">
                        <CardHeader className="bg-muted/30 border-b border-border py-4">
                            <CardTitle className="text-xl font-bold text-primary flex justify-between items-center">
                                <span>{cat.id}. {cat.name}</span>
                                <span className="text-sm font-mono text-muted-foreground">Máx. {cat.max} pts</span>
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-5 space-y-4">
                            {/* Candidate Written Response & AI Likelihood Evidence */}
                            {(() => {
                                const qData = dynamicTests.find(t => t.test_type === 'QUESTIONS_C' && t.subcategory === cat.id)
                                if (!qData) return null

                                return (
                                    <div className="space-y-3 bg-secondary/20 p-4 rounded-xl border border-border">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                Respuesta Asíncrona del Candidato ({qData.subcategory})
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground">Pregunta Presentada:</p>
                                            <p className="text-sm font-semibold text-foreground">{qData.prompt_context}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground">Respuesta Escrita:</p>
                                            <div className="p-3 bg-background border border-border rounded-lg text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                {qData.candidate_response || <span className="italic opacity-60">Sin respuesta del candidato aún.</span>}
                                            </div>
                                        </div>
                                        {qData.candidate_response && qData.ai_likelihood !== undefined && qData.ai_likelihood !== null && (
                                            <AiLikelihoodBadge percentage={qData.ai_likelihood} />
                                        )}
                                        {qData.ai_score !== null && (
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs">
                                                <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                                <div>
                                                    <span className="font-bold text-teal-700 dark:text-teal-300">
                                                        IA Sugiere Puntaje: {qData.ai_score}/3
                                                    </span>
                                                    {qData.ai_justification && (
                                                        <p className="text-muted-foreground mt-0.5">{qData.ai_justification}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}

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
                                                    <span className="text-purple-600 font-bold shrink-0 mt-0.5">•</span>
                                                    <span>{q}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Positive / Alert Indicators */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg p-3.5 space-y-1.5">
                                            <p className="font-bold text-emerald-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                                                <span>✅</span> Indicadores positivos
                                            </p>
                                            <ul className="space-y-1 text-emerald-950 text-xs">
                                                {guide.positive.map((p, i) => (
                                                    <li key={i} className="flex items-start gap-1.5">
                                                        <span className="text-emerald-600 shrink-0 mt-0.5">✔</span>
                                                        <span>{p}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-3.5 space-y-1.5">
                                            <p className="font-bold text-amber-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                                                <span>⚠️</span> Señales de alerta
                                            </p>
                                            <ul className="space-y-1 text-amber-950 text-xs">
                                                {guide.alert.map((a, i) => (
                                                    <li key={i} className="flex items-start gap-1.5">
                                                        <span className="text-amber-600 shrink-0 mt-0.5">✖</span>
                                                        <span>{a}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Scoring rubric */}
                                    <div>
                                        <p className="font-bold text-purple-800 mb-2 uppercase tracking-wide text-xs">📊 Escala de puntuación:</p>
                                        <div className="space-y-1.5">
                                            {guide.scoring.map(({ score: s, desc }) => (
                                                <div
                                                    key={s}
                                                    onClick={() => !readOnly && setScores(prev => ({ ...prev, [cat.id]: s }))}
                                                    className={`flex items-start gap-3 p-2.5 rounded-lg text-xs transition-colors ${
                                                        scores[cat.id] === s
                                                            ? 'bg-purple-600 text-white font-medium shadow-sm'
                                                            : 'bg-white text-purple-950 border border-purple-100 hover:bg-purple-50'
                                                    } ${!readOnly ? 'cursor-pointer' : ''}`}
                                                >
                                                    <span className={`font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                                                        scores[cat.id] === s
                                                            ? 'bg-white text-purple-700'
                                                            : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {s} pts
                                                    </span>
                                                    <span className="leading-relaxed mt-0.5">{desc}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Score selector */}
                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Puntaje Seleccionado (0 a {cat.max})
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {Array.from({ length: cat.max + 1 }, (_, i) => i).map((score) => (
                                        <Button
                                            key={score}
                                            type="button"
                                            variant={scores[cat.id] === score ? 'default' : 'outline'}
                                            onClick={() => setScores(prev => ({ ...prev, [cat.id]: score }))}
                                            disabled={readOnly}
                                            className="w-12 h-10 text-sm font-bold cursor-pointer"
                                        >
                                            {score}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Observations textarea */}
                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Evidencia y Justificación ({cat.id})
                                </label>
                                <textarea
                                    value={comments[cat.id] || ''}
                                    onChange={(e) => setComments(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                    placeholder={`Registra la respuesta del candidato a la pregunta de ${cat.name}, ejemplos concretos mencionados y la justificación de la puntuación...`}
                                    disabled={readOnly}
                                    className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )
            })}

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border pb-10">
                <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <ArrowUp className="w-4 h-4 mr-2" /> Volver arriba
                </Button>
                {!readOnly && (
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 h-12 rounded-xl shadow-xl cursor-pointer">
                        {isSaving ? 'Guardando...' : 'Consolidar Dimensión C'}
                    </Button>
                )}
            </div>
        </div>
    )
}
