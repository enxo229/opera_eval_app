'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bot, MailCheck, ChevronDown, ChevronUp, MessageCircleQuestion, Eye, RotateCcw, Info, AlertTriangle, CheckCircle2, TrendingUp, Sparkles, Loader2, ArrowUp } from 'lucide-react'
import { resetBResponses, triggerB1Evaluation } from '@/app/actions/candidate/b1'
import { AiLikelihoodBadge } from './AiLikelihoodBadge'
import { calculateDimensionB } from '@/app/actions/evaluation'

interface Props {
    evaluationId: string
    existingScores: any[]
    dynamicTests: any[]
    readOnly?: boolean
    profileTrack?: string
}

// Evaluator question guides per category (B2-B3) - General Track
const EVALUATOR_GUIDES: Record<string, { description: string; questions: string[]; indicators: { score: number; what: string }[] }> = {
    B2: {
        description: 'Usando el mismo escenario del incidente de B1, pídele al candidato que lo explique verbalmente como si fueras un stakeholder no técnico (gerente de cuenta o cliente). Máximo 5 minutos.',
        questions: [
            '"Imagina que soy el gerente de cuenta del cliente y quiero entender qué ocurrió con el servicio de pagos. Explícamelo de forma clara y sin tecnicismos excesivos."',
            '"Si tuviéramos un retraso en la resolución definitiva, ¿cómo me comunicarías el estado y las expectativas?"',
        ],
        indicators: [
            { score: 4, what: 'Lenguaje claro, empático, orientado al impacto del negocio. Narrativa fluida con inicio, diagnóstico y resolución.' },
            { score: 3, what: 'Explica los hechos sin tecnicismos manteniendo la precisión. Relato ordenado.' },
            { score: 2, what: 'Intenta simplificar pero pierde precisión o incurre en confusión en la cronología.' },
            { score: 1, what: 'Usa jerga técnica confusa, relato desordenado o a la defensiva.' },
        ],
    },
    B3: {
        description: 'Evalúa colaboración en equipo, priorización de alertas concurrentes y rigor en la documentación/traspaso de turno (handoff).',
        questions: [
            '"Cuando recibes múltiples alertas simultáneas en tu guardia, ¿qué criterio usas para decidir cuál atender primero?"',
            '"Cuéntame de una situación de alta presión en la que apoyaste a un compañero o coordinaste una tarea crítica."',
            '"Si debes entregar tu turno dejando un incidente activo, ¿qué información incluyes en el traspaso para asegurar continuidad?"',
        ],
        indicators: [
            { score: 4, what: 'Criterio sólido de impacto/urgencia, actitud proactiva de colaboración y handoffs autoexplicativos.' },
            { score: 3, what: 'Prioriza por urgencia básica, colabora activamente y documenta de forma consistente.' },
            { score: 2, what: 'Prioriza por orden de llegada, colaboración puntual transaccional y documentación mínima.' },
            { score: 1, what: 'Sensación de caos, individualismo y documentación incompleta o ausente.' },
        ],
    },
}

// Evaluator question guides per category (B2) - OTel Expert Track (Asynchronous SRE Evaluation)
const EVALUATOR_GUIDES_OTEL: Record<string, { description: string; questions: string[]; indicators: { score: number; what: string }[] }> = {
    B2: {
        description: 'Evalúa la capacidad de adaptación, comunicación de diagnósticos técnicos complejos y gestión bajo incidentes críticos de producción.',
        questions: [
            'Pregunta autónoma respondida por el candidato en la plataforma (escrita y evaluada por IA).',
        ],
        indicators: [
            { score: 4, what: 'Respuesta altamente técnica, estructurada, orientada a mitigación rápida y comunicación clara.' },
            { score: 3, what: 'Respuesta técnica correcta y ordenada.' },
            { score: 2, what: 'Respuesta parcial o con ambigüedades técnicas.' },
            { score: 1, what: 'Respuesta deficiente o errónea.' },
        ],
    },
}

const B1_SUBS = [
    { id: 'B1.1', label: 'Estructura Formal del Ticket', levels: ['Desordenado, sin campos claros.', 'Estructura básica con omisiones.', 'Estructura ordenada según plantilla.', 'Estructura impecable y profesional.'] },
    { id: 'B1.2', label: 'Precisión Técnica y Métricas', levels: ['Vago, sin datos técnicos.', 'Menciona datos generales.', 'Métricas precisas del incidente.', 'Detalle técnico exacto con evidencia.'] },
    { id: 'B1.3', label: 'Plan de Acción y Mitigación', levels: ['Sin acciones propuestas.', 'Acciones genéricas.', 'Acciones concretas y ordenadas.', 'Plan paso a paso con mitigación y contingencia.'] },
    { id: 'B1.4', label: 'Impacto al Negocio y Escalamiento', levels: ['No menciona impacto ni escalamiento.', 'Mención superficial del impacto.', 'Impacto claro y escalamiento correcto.', 'Impacto cuantitativo y protocolo exacto.'] },
]

const B2_SUBS = [
    { id: 'B2.1', label: 'Claridad y Lenguaje para Negocio', levels: ['Jerga excesiva o confuso.', 'Intenta simplificar con tropiezos.', 'Explicación clara y sin tecnicismos.', 'Narrativa impecable para stakeholders.'] },
    { id: 'B2.2', label: 'Estructura del Mensaje (Inicio/Fin)', levels: ['Desordenado o disperso.', 'Secuencia parcial.', 'Secuencia ordenada (qué/por qué/qué sigue).', 'Estructura ejecutiva y contundente.'] },
    { id: 'B2.3', label: 'Manejo de Tiempos y Expectativas', levels: ['Promete tiempos irreales.', 'Impreciso con los plazos.', 'Fija expectativas realistas.', 'Excelente gestión de incertidumbre.'] },
    { id: 'B2.4', label: 'Empatía y Calma', levels: ['A la defensiva o tenso.', 'Neutral / distante.', 'Tranquilo y empático.', 'Transmite total confianza y serenidad.'] },
]

const B3_SUBS = [
    { id: 'B3.1', label: 'Criterio de Priorización', levels: ['Atiende al azar o por orden de llegada.', 'Prioriza por intuición sin marco claro.', 'Prioriza por criticidad del servicio y SLA.', 'Priorización estratégica por impacto al negocio.'] },
    { id: 'B3.2', label: 'Colaboración y Apoyo en Equipo', levels: ['Individualista, no comparte contexto.', 'Colabora solo si se le solicita explícitamente.', 'Proactivo para apoyar y compartir hallazgos.', 'Liderazgo positivo y articulación del equipo.'] },
    { id: 'B3.3', label: 'Rigor en Handoff / Traspaso de Turno', levels: ['Handoff ausente o incompleto.', 'Traspaso verbal informal con omisiones.', 'Traspaso estructurado con estado claro.', 'Handoff impecable con acciones pendientes y alertas.'] },
]

export function DimensionBEvaluation({ evaluationId, existingScores, dynamicTests, readOnly, profileTrack }: Props) {
    const router = useRouter()
    const isOtel = profileTrack === 'otel_expert'

    const CATEGORIES = isOtel ? [
        { id: 'B1', name: 'Comunicación Técnica Escrita (Ticket ITSM)', max: 16, normMax: 18, sub: 'B1.x' },
        { id: 'B2', name: 'Adaptabilidad & Gestión de Presión', max: 16, normMax: 12, sub: 'B2.1' },
    ] : [
        { id: 'B1', name: 'Comunicación Técnica Escrita (GLPI)', max: 16, normMax: 10, sub: 'B1.x' },
        { id: 'B2', name: 'Comunicación Verbal con Stakeholders', max: 16, normMax: 10, sub: 'B2.x' },
        { id: 'B3', name: 'Colaboración, Priorización & Presión', max: 12, normMax: 10, sub: 'B3.x' },
    ]

    const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null)
    const [expandedGuide, setExpandedGuide] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [isEvaluating, setIsEvaluating] = useState(false)

    const testB1 = dynamicTests.find(t => t.test_type === 'B1_TICKET') || {}
    const testB1Case = dynamicTests.find(t => t.test_type === 'B1_CASE')
    const aiB1Data = dynamicTests.filter(t => t.test_type === 'B1_TICKET' && t.subcategory?.startsWith('EVAL_'))
    const isB1Finished = !!testB1.candidate_response

    const getInitialScore = (catId: string) => {
        const found = existingScores.find(s => s.dimension === 'B' && s.category === catId)
        return found ? found.raw_score : 1
    }
    const getInitialComment = (catId: string) => {
        const found = existingScores.find(s => s.dimension === 'B' && s.category === catId)
        return found?.comments || ''
    }

    const getInitialSubScore = (subId: string) => {
        const found = existingScores.find(s => s.dimension === 'B' && s.category === subId)
        return found ? found.raw_score : 1
    }

    const [b1SubScores, setB1SubScores] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {}
        B1_SUBS.forEach(s => init[s.id] = getInitialSubScore(s.id))
        return init
    })
    const [b2SubScores, setB2SubScores] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {}
        B2_SUBS.forEach(s => init[s.id] = getInitialSubScore(s.id))
        return init
    })
    const [b3SubScores, setB3SubScores] = useState<Record<string, number>>(() => {
        if (isOtel) return {}
        const init: Record<string, number> = {}
        B3_SUBS.forEach(s => init[s.id] = getInitialSubScore(s.id))
        return init
    })

    const [comments, setComments] = useState<Record<string, string>>({
        B1: getInitialComment('B1'),
        B2: getInitialComment('B2'),
        B3: getInitialComment('B3'),
    })

    const hasAppliedAutoFill = useRef(false)

    useEffect(() => {
        if (aiB1Data.length > 0 && !hasAppliedAutoFill.current) {
            const hasExistingB1 = B1_SUBS.some(s => existingScores.some(es => es.dimension === 'B' && es.category === s.id && es.raw_score > 1))
            if (!hasExistingB1) {
                setB1SubScores(prev => {
                    const next = { ...prev }
                    aiB1Data.forEach(q => {
                        if (q.subcategory && q.ai_score !== null) {
                            const targetId = q.subcategory.replace('EVAL_', '')
                            if (next[targetId] !== undefined) next[targetId] = q.ai_score
                        }
                    })
                    return next
                })
            }
            hasAppliedAutoFill.current = true
        }
    }, [aiB1Data, existingScores])

    // Auto-fill B2 score from AI evaluation of candidate's written responses (OTel only)
    const hasAppliedB2AutoFill = useRef(false)
    useEffect(() => {
        if (!isOtel || hasAppliedB2AutoFill.current) return
        const b2QData = dynamicTests.filter(t => t.test_type === 'QUESTIONS_B2' && t.ai_score !== null)
        if (b2QData.length > 0) {
            const hasExistingB2Override = existingScores.some(es => es.dimension === 'B' && es.category === 'B2' && es.raw_score > 0)
            if (!hasExistingB2Override) {
                const totalAiScore = b2QData.reduce((sum, q) => sum + (q.ai_score || 0), 0)
                const avgMapped = Math.min(4, Math.max(1, Math.round((totalAiScore / b2QData.length) * (4 / 3))))
                setB2SubScores(prev => {
                    const next = { ...prev }
                    B2_SUBS.forEach(s => next[s.id] = avgMapped)
                    return next
                })
            }
            hasAppliedB2AutoFill.current = true
        }
    }, [isOtel, dynamicTests, existingScores])

    const handleSave = async () => {
        setIsSaving(true)
        const supabase = createClient()
        try {
            const subScoresData = [
                ...B1_SUBS.map(s => ({ category: s.id, score: b1SubScores[s.id] || 1, dimension: 'B' })),
                ...B2_SUBS.map(s => ({ category: s.id, score: b2SubScores[s.id] || 1, dimension: 'B' })),
                ...(!isOtel ? B3_SUBS.map(s => ({ category: s.id, score: b3SubScores[s.id] || 1, dimension: 'B' })) : []),
            ]

            for (const item of subScoresData) {
                const ext = existingScores.find(s => s.dimension === 'B' && s.category === item.category)
                const { error: scoreErr } = await supabase
                    .from('dimension_scores')
                    .upsert({
                        ...(ext ? { id: ext.id } : {}),
                        evaluation_id: evaluationId,
                        dimension: 'B',
                        category: item.category,
                        raw_score: item.score
                    })
                if (scoreErr) throw scoreErr
            }

            const b1TotalRaw = Object.values(b1SubScores).reduce((a, b) => a + b, 0)
            const b2TotalRaw = Object.values(b2SubScores).reduce((a, b) => a + b, 0)
            const b3TotalRaw = Object.values(b3SubScores).reduce((a, b) => a + b, 0)

            const totalScores = [
                { category: 'B1', score: b1TotalRaw, comment: comments['B1'] || '' },
                { category: 'B2', score: b2TotalRaw, comment: comments['B2'] || '' },
                ...(!isOtel ? [{ category: 'B3', score: b3TotalRaw, comment: comments['B3'] || '' }] : []),
            ]

            for (const item of totalScores) {
                const ext = existingScores.find(s => s.dimension === 'B' && s.category === item.category)
                const { error: scoreErr } = await supabase
                    .from('dimension_scores')
                    .upsert({
                        ...(ext ? { id: ext.id } : {}),
                        evaluation_id: evaluationId,
                        dimension: 'B',
                        category: item.category,
                        raw_score: item.score,
                        comments: item.comment || ''
                    })
                if (scoreErr) throw scoreErr
            }

            // Persist normalized score_b in evaluations
            const calculatedB = await calculateDimensionB({
                b1: b1TotalRaw,
                b2: b2TotalRaw,
                b3: b3TotalRaw
            }, profileTrack)

            await supabase
                .from('evaluations')
                .update({ score_b: calculatedB })
                .eq('id', evaluationId)

            alert('Dimensión B guardada exitosamente.')
            router.refresh()
        } catch (e: any) {
            console.error('Error saving dimension B:', e)
            alert('Error al guardar la dimensión B: ' + (e.message || ''))
        } finally {
            setIsSaving(false)
        }
    }

    const handleResetB = async () => {
        if (!confirm('¿Estás seguro de que deseas resetear la sección B? Esto borrará el ticket y las respuestas del candidato.')) return
        setIsResetting(true)
        try {
            await resetBResponses(evaluationId)
            router.refresh()
        } catch (e) {
            console.error('Error resetting B:', e)
            alert('Error al resetear la dimensión B.')
        } finally {
            setIsResetting(false)
        }
    }

    const handleTriggerAI = async () => {
        if (!testB1.candidate_response) return
        setIsEvaluating(true)
        try {
            await triggerB1Evaluation(evaluationId)
            router.refresh()
        } catch (e) {
            console.error('Error triggering AI evaluation:', e)
            alert('Error al reevaluar con IA.')
        } finally {
            setIsEvaluating(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Dimensión B: Habilidades Blandas</h2>
                    <p className="text-muted-foreground text-sm">
                        {isOtel 
                            ? 'Comunicación Técnica Escrita (Ticket ITSM) y Adaptabilidad / Gestión de Presión (30 pts).' 
                            : 'Comunicación Técnica Escrita (GLPI), Verbal con Stakeholders y Colaboración Bajo Presión (30 pts).'}
                    </p>
                </div>
                {!readOnly && (
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            onClick={handleResetB}
                            disabled={isResetting || isSaving}
                            className="text-xs h-9 bg-red-600/10 text-red-600 hover:bg-red-600/20 border border-red-600/20 cursor-pointer"
                        >
                            {isResetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                            Resetear Respuestas
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-sm cursor-pointer"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Dimensión B'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm pb-4 pt-2 -mt-2 border-b border-border/50 mb-6">
                <div className="flex flex-wrap gap-2 p-1.5 bg-muted/30 rounded-xl border border-border/40">
                    {CATEGORIES.map(link => (
                        <Button
                            key={link.id}
                            variant="secondary"
                            size="sm"
                            className="text-[10px] sm:text-xs font-black uppercase tracking-wider h-8 px-4 rounded-lg bg-background shadow-sm hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer"
                            onClick={() => {
                                const el = document.getElementById(`section-${link.id}`);
                                if (el) {
                                    const offset = 120;
                                    const elementPosition = el.getBoundingClientRect().top + window.scrollY;
                                    window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
                                }
                            }}
                        >
                            {link.id}. {link.name} ({link.normMax} pts)
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
                                <span className="text-sm font-mono text-muted-foreground">Ponderado: {cat.normMax} pts</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {cat.id === 'B1' && (
                                <div className="space-y-4">
                                    <div className="border border-border rounded-lg overflow-hidden bg-background">
                                        <button type="button" onClick={() => setExpandedEvidence(expandedEvidence === 'B1' ? null : 'B1')} className="w-full flex items-center justify-between p-3.5 bg-muted/40 hover:bg-muted/60 transition-colors text-left cursor-pointer">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-primary" /> Evidencia del Candidato: Ticket de Incidente Simulado
                                            </span>
                                            {expandedEvidence === 'B1' ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                        </button>
                                        <div className={`p-4 space-y-4 border-t border-border ${expandedEvidence === 'B1' ? 'block' : 'hidden'}`}>
                                            {isB1Finished ? (
                                                <div className="space-y-4">
                                                    {testB1Case && (
                                                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Info className="w-4 h-4 text-primary shrink-0" />
                                                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Caso que recibió el candidato:</h4>
                                                            </div>
                                                            <p className="text-xs text-foreground/90 leading-relaxed italic whitespace-pre-wrap">{testB1Case.prompt_context}</p>
                                                        </div>
                                                    )}
                                                    <div className="bg-card border border-border p-4 rounded-lg font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed shadow-inner">
                                                        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border/50 text-muted-foreground font-sans font-bold">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ticket Documentado por el Candidato:
                                                        </div>
                                                        {testB1.candidate_response}
                                                    </div>

                                                    {testB1.ai_likelihood !== undefined && testB1.ai_likelihood !== null && (
                                                        <AiLikelihoodBadge percentage={testB1.ai_likelihood} />
                                                    )}

                                                    <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 p-4 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <NextImage src="/icons/AIAgent.png" alt="IA" width={48} height={48} className="shrink-0" />
                                                            <div>
                                                                <h4 className="text-sm font-bold text-amber-800">Evaluación Sincrónica por IA (B1)</h4>
                                                                <p className="text-xs text-amber-700/80 mt-0.5">Los insights sobre Estructura y Precisión del Ticket están integrados debajo de cada criterio.</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline" size="sm" onClick={handleTriggerAI} disabled={isEvaluating} className="border-amber-500/30 hover:bg-amber-500/10 text-amber-700 font-bold gap-2 shrink-0 bg-white shadow-sm cursor-pointer">
                                                            {isEvaluating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Evaluando...</>) : (<><RotateCcw className="h-4 w-4" /> Re-evaluar con IA</>)}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center p-8 text-muted-foreground text-sm italic">El candidato no ha enviado el ticket.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* B2 OTel Expert Async Written Evidence */}
                            {cat.id !== 'B1' && isOtel && (() => {
                                const qData = dynamicTests.find(t => t.test_type === 'QUESTIONS_B2' && t.subcategory === cat.id)
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
                                            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs">
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                                                    <div>
                                                        <span className="font-bold text-violet-700 dark:text-violet-300">
                                                            IA Sugiere Puntaje: {qData.ai_score}/3
                                                        </span>
                                                        {qData.ai_justification && (
                                                            <p className="text-muted-foreground mt-0.5">{qData.ai_justification}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}

                            {cat.id !== 'B1' && !isOtel && guide && (
                                <div className="space-y-4">
                                    <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/10">
                                        <p className="text-sm font-medium text-purple-900 flex items-start gap-2">
                                            <MessageCircleQuestion className="h-4 w-4 mt-0.5" /> {guide.description}
                                        </p>
                                        <div className="mt-3">
                                            <p className="text-xs font-bold text-purple-800 uppercase mb-1">Preguntas Sugeridas:</p>
                                            <ul className="list-disc list-inside text-xs text-purple-900/80 space-y-1">
                                                {guide.questions.map((q, i) => (<li key={i}>{q}</li>))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 space-y-4">
                                {(() => {
                                    const subs = cat.id === 'B1' ? B1_SUBS : cat.id === 'B2' ? B2_SUBS : B3_SUBS
                                    const subScores = cat.id === 'B1' ? b1SubScores : cat.id === 'B2' ? b2SubScores : b3SubScores
                                    const setSubScores = (cat.id === 'B1' ? setB1SubScores : cat.id === 'B2' ? setB2SubScores : setB3SubScores) as React.Dispatch<React.SetStateAction<Record<string, number>>>
                                    return subs.map((subItem) => {
                                        let aiHint = null
                                        if (cat.id === 'B1') {
                                             const aiMatch = aiB1Data.find(t => t.subcategory === `EVAL_${subItem.id}`)
                                             if (aiMatch && aiMatch.ai_score !== null) aiHint = { score: aiMatch.ai_score as number, justification: aiMatch.ai_justification }
                                        }
                                        const currentScore = subScores[subItem.id] || 1
                                        return (
                                            <div key={subItem.id} className="border border-border rounded-lg p-5 space-y-4 bg-background shadow-sm">
                                                <div className="flex justify-between items-start gap-4">
                                                    <span className="font-bold text-primary text-sm bg-primary/10 px-2 py-1 rounded inline-flex items-center gap-2">{subItem.id} <span className="text-foreground">{subItem.label}</span></span>
                                                    {aiHint && (
                                                        <div className="flex items-start gap-2 max-w-sm bg-amber-50 rounded-md border border-amber-200 p-2 text-xs">
                                                            <div className="flex flex-col items-center gap-1 shrink-0 bg-amber-100 p-1.5 rounded"><NextImage src="/icons/AIAgent.png" alt="IA" width={28} height={28} /> <span className="font-bold text-amber-800">{aiHint.score}/4</span></div>
                                                            <p className="text-amber-800/90 leading-tight">{aiHint.justification || 'Evaluación sugerida por IA.'}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2 pt-1">
                                                    {subItem.levels.map((levelDesc, idx) => {
                                                        const scoreVal = idx + 1
                                                        const isActive = currentScore === scoreVal
                                                        return (
                                                            <div key={idx} onClick={() => !readOnly && setSubScores(prev => ({ ...prev, [subItem.id]: scoreVal }))} className={`flex gap-3 text-sm items-center p-2.5 rounded-lg transition-all ${!readOnly ? 'cursor-pointer' : ''} ${isActive ? 'ring-2 ring-primary bg-primary/5' : 'bg-muted/20'}`}>
                                                                <span className={`font-black w-7 h-7 flex items-center justify-center rounded-md text-xs ${isActive ? 'bg-primary text-primary-foreground' : 'bg-background shadow-sm text-muted-foreground'}`}>{scoreVal}</span>
                                                                <span className="text-xs md:text-sm">{levelDesc}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })
                                })()}
                                {(() => {
                                    const subScores = cat.id === 'B1' ? b1SubScores : cat.id === 'B2' ? b2SubScores : b3SubScores
                                    const totalRaw = Object.values(subScores).reduce((a, b) => a + (b || 1), 0)
                                    const maxRaw = (cat.id === 'B1' || cat.id === 'B2') ? 16 : 12
                                    const normScore = ((totalRaw / maxRaw) * cat.normMax).toFixed(1)
                                    const ratio = totalRaw / maxRaw
                                    const color = ratio < 0.4 ? 'text-red-700 bg-red-500/10 border border-red-200' : ratio < 0.7 ? 'text-orange-700 bg-orange-500/10 border border-orange-200' : 'text-emerald-700 bg-emerald-500/10 border border-emerald-200'
                                    const barColor = ratio < 0.4 ? 'bg-red-500' : ratio < 0.7 ? 'bg-orange-500' : 'bg-emerald-600'
                                    return (
                                        <div className={`mt-6 p-4 rounded-lg flex flex-col gap-3 ${color}`}>
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <span>Total {cat.id}:</span>
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-lg font-black font-mono">
                                                        {totalRaw} / {maxRaw} <span className="text-xs text-muted-foreground font-normal">(normalizado: {normScore} / {cat.normMax})</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full h-3 rounded-full bg-white/50 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`} style={{ width: `${ratio * 100}%` }} />
                                            </div>
                                        </div>
                                    )
                                })()}
                                <div className="mt-4 pt-4 border-t border-border border-dashed">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evidencia y Notas del Evaluador ({cat.id})</label>
                                    <textarea value={comments[cat.id]} disabled={readOnly} onChange={(e) => setComments(prev => ({ ...prev, [cat.id]: e.target.value }))} className="w-full min-h-[80px] p-4 rounded-lg border border-border bg-background mt-2" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border pb-10">
                <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp className="w-4 h-4 mr-2" /> Volver arriba</Button>
                {!readOnly && (
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 h-12 rounded-xl shadow-xl cursor-pointer">
                        {isSaving ? 'Guardando...' : 'Consolidar Dimensión B'}
                    </Button>
                )}
            </div>
        </div>
    )
}
