'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bot, MailCheck, ChevronDown, ChevronUp, MessageCircleQuestion, Eye, RotateCcw, Info, AlertTriangle, CheckCircle2, TrendingUp, Sparkles, Loader2, ArrowUp, BookOpen, Trash2 } from 'lucide-react'
import { resetBResponses, triggerB1Evaluation, resetB1Only, getB1Evidence } from '@/app/actions/candidate/b1'
import { triggerB2Evaluation, resetB2Responses, getB2Results } from '@/app/actions/candidate/b2'
import { AiLikelihoodBadge } from './AiLikelihoodBadge'
import { calculateDimensionB } from '@/app/actions/evaluation'
import { B_EVALUATOR_GUIDANCE_OTEL } from '@/lib/evaluator-guidance'

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
        description: 'Evalúa la capacidad de adaptación técnica bajo presión ante incidentes y la colaboración blameless para la resiliencia sistémica.',
        questions: [
            'Escenario B2.1: Gestión de presión e incidentes (mitigación vs telemetría en OTel / Grafana).',
            'Escenario B2.2: Colaboración blameless y salvaguardas sistémicas ante errores humanos.',
        ],
        indicators: [
            { score: 4, what: 'Liderazgo SRE senior: preservación forense, alta disponibilidad, seguridad psicológica y salvaguardas automáticas en CI/CD.' },
            { score: 3, what: 'Enfoque técnico y cultural equilibrado y correcto.' },
            { score: 2, what: 'Respuestas intermedias con vacíos en automatización o telemetría.' },
            { score: 1, what: 'Respuestas reactivas, punitivas o reinicios a ciegas sin guardar datos.' },
        ],
    },
}

const B2_SUBS_OTEL = [
    { id: 'B2.1', label: 'Preservación de Evidencia vs. Mitigación (Escenario 1)', levels: ['Cede ciegamente al reinicio sin resguardar datos.', 'Propone mitigar pero con imprecisiones en telemetría.', 'Estrategia balanceada: drena tráfico o fuerza flush de colas.', 'Liderazgo SRE senior: preservación forense y alta disponibilidad.'] },
    { id: 'B2.2', label: 'Liderazgo Técnico y Gestión de Presión (Escenario 1)', levels: ['A la defensiva o pasivo ante la presión.', 'Intenta negociar sin argumentos técnicos sólidos.', 'Negociación asertiva basada en impacto al negocio.', 'Manejo sereno ejemplar, comunica riesgos y plazos realistas.'] },
    { id: 'B2.3', label: 'Cultura Blameless & Seguridad Psicológica (Escenario 2)', levels: ['Enfoque punitivo o búsqueda de culpables.', 'Empatía verbal sin enfoque estructurado.', 'Cultura blameless clara y mentoría constructiva.', 'Seguridad psicológica ejemplar, impulsa aprendizaje continuo.'] },
    { id: 'B2.4', label: 'Salvaguardas Sistémicas & Automatización (Escenario 2)', levels: ['Sin propuestas técnicas para evitar recurrencia.', 'Propuestas manuales o advertencias verbales.', 'Implementa validaciones en CI/CD o alertas en Grafana.', 'Ingeniería de resiliencia: GitOps, guardrails automáticos y post-mortem.'] },
]

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
        { id: 'B2', name: 'Competencias Situacionales SRE', max: 16, normMax: 12, sub: 'B2.x' },
    ] : [
        { id: 'B1', name: 'Comunicación Técnica Escrita (GLPI)', max: 16, normMax: 10, sub: 'B1.x' },
        { id: 'B2', name: 'Comunicación Verbal con Stakeholders', max: 16, normMax: 10, sub: 'B2.x' },
        { id: 'B3', name: 'Colaboración, Priorización & Presión', max: 12, normMax: 10, sub: 'B3.x' },
    ]

    const [localTests, setLocalTests] = useState(dynamicTests)
    useEffect(() => {
        setLocalTests(dynamicTests)
    }, [dynamicTests])

    const [expandedEvidence, setExpandedEvidence] = useState<string | null>('B1')
    const [expandedGuide, setExpandedGuide] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [isEvaluating, setIsEvaluating] = useState(false)

    // Section Action States
    const [b1Refreshing, setB1Refreshing] = useState(false)
    const [b1Resetting, setB1Resetting] = useState(false)
    const [b2Refreshing, setB2Refreshing] = useState(false)
    const [b2Resetting, setB2Resetting] = useState(false)
    const [b2Evaluating, setB2Evaluating] = useState(false)

    const testB1 = localTests.find(t => t.test_type === 'B1_TICKET' && (t.subcategory === 'RESPONSE' || t.subcategory === 'TICKET' || (!t.subcategory?.startsWith('EVAL_') && t.subcategory !== 'CASE'))) || {}
    const testB1Case = localTests.find(t => t.test_type === 'B1_CASE' || (t.test_type === 'B1_TICKET' && t.subcategory === 'CASE'))
    const aiB1Data = localTests.filter(t => t.test_type === 'B1_TICKET' && t.subcategory?.startsWith('EVAL_'))
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
        const subs = isOtel ? B2_SUBS_OTEL : B2_SUBS
        subs.forEach(s => init[s.id] = getInitialSubScore(s.id))
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
        const b2QData = localTests.filter(t => t.test_type === 'QUESTIONS_B2' && t.ai_score !== null)
        if (b2QData.length > 0) {
            const hasExistingB2Override = existingScores.some(es => es.dimension === 'B' && es.category === 'B2' && es.raw_score > 0)
            if (!hasExistingB2Override) {
                const q1 = b2QData.find(q => q.subcategory === 'B2.1' || q.subcategory === 'B2')
                const q2 = b2QData.find(q => q.subcategory === 'B2.2' || q.subcategory === 'B5')

                const s1 = q1?.ai_score !== null && q1?.ai_score !== undefined ? Math.min(4, Math.max(1, q1.ai_score + 1)) : 2
                const s2 = q2?.ai_score !== null && q2?.ai_score !== undefined ? Math.min(4, Math.max(1, q2.ai_score + 1)) : 2

                setB2SubScores(prev => ({
                    ...prev,
                    'B2.1': s1,
                    'B2.2': s1,
                    'B2.3': s2,
                    'B2.4': s2
                }))
            }
            hasAppliedB2AutoFill.current = true
        }
    }, [isOtel, localTests, existingScores])

    const handleSave = async () => {
        setIsSaving(true)
        const supabase = createClient()
        try {
            const subScoresData = [
                ...B1_SUBS.map(s => ({ category: s.id, score: b1SubScores[s.id] || 1, dimension: 'B' })),
                ...(isOtel ? B2_SUBS_OTEL : B2_SUBS).map(s => ({ category: s.id, score: b2SubScores[s.id] || 1, dimension: 'B' })),
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
            await handleRefreshB1()
        } catch (e) {
            console.error('Error triggering AI evaluation:', e)
            alert('Error al reevaluar con IA.')
        } finally {
            setIsEvaluating(false)
        }
    }

    const handleRefreshB1 = async () => {
        setB1Refreshing(true)
        try {
            const data = await getB1Evidence(evaluationId)
            if (data) {
                setLocalTests(prev => {
                    const withoutB1 = prev.filter(t => t.test_type !== 'B1_TICKET' && t.test_type !== 'B1_CASE')
                    const added: any[] = []
                    if (data.ticket) added.push(data.ticket)
                    if (data.case) added.push(data.case)
                    if (data.aiEvaluations) added.push(...data.aiEvaluations)
                    return [...withoutB1, ...added]
                })
            }
            router.refresh()
        } catch (e) {
            console.error('Error refreshing B1:', e)
        } finally {
            setB1Refreshing(false)
        }
    }

    const handleResetB1 = async () => {
        if (!confirm('⚠️ ¿Estás seguro de que deseas resetear únicamente el Ticket B1? Esto eliminará el ticket y las evaluaciones de IA asociadas.')) return
        setB1Resetting(true)
        try {
            const res = await resetB1Only(evaluationId)
            if (res.success) {
                setLocalTests(prev => prev.filter(t => t.test_type !== 'B1_TICKET' && t.test_type !== 'B1_CASE'))
                setB1SubScores({ 'B1.1': 1, 'B1.2': 1, 'B1.3': 1, 'B1.4': 1 })
                setComments(prev => ({ ...prev, B1: '' }))
                router.refresh()
            } else {
                alert('Error: ' + res.error)
            }
        } catch (e) {
            console.error('Error resetting B1:', e)
        } finally {
            setB1Resetting(false)
        }
    }

    const handleRefreshB2 = async () => {
        setB2Refreshing(true)
        try {
            const res = await getB2Results(evaluationId)
            if (res) {
                setLocalTests(prev => {
                    const withoutB2 = prev.filter(t => t.test_type !== 'QUESTIONS_B2')
                    const added = res.questions.map(q => ({
                        test_type: 'QUESTIONS_B2',
                        subcategory: q.subcategory,
                        prompt_context: q.question,
                        ai_generated_content: q.label,
                        candidate_response: res.answers[q.subcategory] || null,
                        ai_score: res.aiResults?.find(a => a.subcategory === q.subcategory)?.score ?? null,
                        ai_justification: res.aiResults?.find(a => a.subcategory === q.subcategory)?.justification ?? null,
                        ai_likelihood: res.aiResults?.find(a => a.subcategory === q.subcategory)?.likelihood ?? null
                    }))
                    return [...withoutB2, ...added]
                })
            }
            router.refresh()
        } catch (e) {
            console.error('Error refreshing B2:', e)
        } finally {
            setB2Refreshing(false)
        }
    }

    const handleTriggerAIB2 = async () => {
        setB2Evaluating(true)
        try {
            const res = await triggerB2Evaluation(evaluationId)
            if (res.success) {
                await handleRefreshB2()
                alert(`Re-evaluación con IA completada (${res.count || 0} respuestas analizadas).`)
            } else {
                alert('Error al reevaluar B2: ' + (res.error || ''))
            }
        } catch (e: any) {
            console.error('Error in triggerB2Evaluation:', e)
            alert('Error: ' + (e?.message || 'Error desconocido'))
        } finally {
            setB2Evaluating(false)
        }
    }

    const handleResetB2 = async () => {
        if (!confirm('⚠️ ¿Estás seguro de que deseas resetear las respuestas situacionales de B2?')) return
        setB2Resetting(true)
        try {
            const res = await resetB2Responses(evaluationId)
            if (res.success) {
                setLocalTests(prev => prev.filter(t => t.test_type !== 'QUESTIONS_B2'))
                const resetScores: Record<string, number> = {}
                const subs = isOtel ? B2_SUBS_OTEL : B2_SUBS
                subs.forEach(s => resetScores[s.id] = 1)
                setB2SubScores(resetScores)
                setComments(prev => ({ ...prev, B2: '' }))
                router.refresh()
            } else {
                alert('Error: ' + res.error)
            }
        } catch (e) {
            console.error('Error resetting B2:', e)
        } finally {
            setB2Resetting(false)
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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <CardTitle className="text-xl font-bold text-primary flex items-center gap-3">
                                    <span>{cat.id}. {cat.name}</span>
                                    <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                                        Ponderado: {cat.normMax} pts
                                    </span>
                                </CardTitle>

                                {/* Section Actions Toolbar */}
                                {!readOnly && (
                                    <div className="flex items-center gap-2">
                                        {cat.id === 'B1' && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleRefreshB1}
                                                    disabled={b1Refreshing}
                                                    className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-primary gap-1.5 cursor-pointer bg-background/80 border border-border/60 shadow-sm"
                                                    title="Refrescar ticket y caso de B1"
                                                >
                                                    <RotateCcw className={`h-3.5 w-3.5 ${b1Refreshing ? 'animate-spin' : ''}`} />
                                                    <span>Refrescar</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleResetB1}
                                                    disabled={b1Resetting}
                                                    className="h-8 px-2.5 text-xs font-semibold text-red-600/80 hover:text-red-600 hover:bg-red-500/10 gap-1.5 cursor-pointer bg-background/80 border border-red-200/40 shadow-sm"
                                                    title="Resetear ticket de B1"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span>Resetear B1</span>
                                                </Button>
                                            </>
                                        )}

                                        {cat.id === 'B2' && (
                                            <>
                                                {isOtel && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleTriggerAIB2}
                                                        disabled={b2Evaluating}
                                                        className="h-8 px-2.5 text-xs font-bold text-amber-700 hover:bg-amber-500/10 border-amber-500/30 gap-1.5 cursor-pointer bg-amber-50/50 shadow-sm"
                                                        title="Re-evaluar respuestas de B2 con IA"
                                                    >
                                                        {b2Evaluating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                                                        <span>Re-evaluar con IA</span>
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleRefreshB2}
                                                    disabled={b2Refreshing}
                                                    className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-primary gap-1.5 cursor-pointer bg-background/80 border border-border/60 shadow-sm"
                                                    title="Refrescar respuestas de B2"
                                                >
                                                    <RotateCcw className={`h-3.5 w-3.5 ${b2Refreshing ? 'animate-spin' : ''}`} />
                                                    <span>Refrescar</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleResetB2}
                                                    disabled={b2Resetting}
                                                    className="h-8 px-2.5 text-xs font-semibold text-red-600/80 hover:text-red-600 hover:bg-red-500/10 gap-1.5 cursor-pointer bg-background/80 border border-red-200/40 shadow-sm"
                                                    title="Resetear respuestas de B2"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span>Resetear B2</span>
                                                </Button>
                                            </>
                                        )}

                                        {cat.id === 'B3' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.refresh()}
                                                className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-primary gap-1.5 cursor-pointer bg-background/80 border border-border/60 shadow-sm"
                                                title="Refrescar B3"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" />
                                                <span>Refrescar</span>
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
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
                                                            <p className="text-xs text-foreground/90 leading-relaxed italic whitespace-pre-wrap">{testB1Case.prompt_context || testB1Case.candidate_response || testB1.prompt_context}</p>
                                                        </div>
                                                    )}
                                                    <div className="bg-card border border-border p-4 rounded-lg font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed shadow-inner">
                                                        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border/50 text-muted-foreground font-sans font-bold">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ticket Documentado por el Candidato:
                                                        </div>
                                                        {testB1.candidate_response || <span className="text-muted-foreground italic font-sans">Sin respuesta redactada aún.</span>}
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

                            {/* B2 OTel Expert Async Written Evidence (All Scenarios) */}
                            {cat.id === 'B2' && isOtel && (() => {
                                const b2Tests = localTests
                                    .filter(t => t.test_type === 'QUESTIONS_B2')
                                    .sort((a, b) => (a.subcategory || '').localeCompare(b.subcategory || ''))

                                if (b2Tests.length === 0) {
                                    return (
                                        <div className="p-6 bg-muted/20 rounded-xl border border-border text-center text-muted-foreground text-sm italic">
                                            El candidato no ha enviado las respuestas situacionales de la sección B2 aún.
                                        </div>
                                    )
                                }

                                return (
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            <Eye className="w-4 h-4 text-primary" /> Evidencias Escritas del Candidato ({b2Tests.length} escenarios evaluados)
                                        </div>
                                        {b2Tests.map((qData) => {
                                            const subKey = qData.subcategory === 'B5' ? 'B2.2' : qData.subcategory === 'B2' ? 'B2.1' : qData.subcategory
                                            const guidance = B_EVALUATOR_GUIDANCE_OTEL[subKey]

                                            return (
                                                <div key={qData.id || qData.subcategory} className="space-y-3 bg-secondary/20 p-5 rounded-xl border border-border">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-primary/20">
                                                            {subKey} — {qData.ai_generated_content || (subKey === 'B2.1' ? 'Adaptabilidad & Gestión de Presión' : 'Colaboración Blameless & Resiliencia')}
                                                        </span>
                                                        {qData.ai_score !== null && (
                                                            <span className="text-xs flex items-center gap-1 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-bold border border-purple-200 dark:border-purple-800">
                                                                <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" /> IA sugiere: {qData.ai_score}/3
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Guidance Panel */}
                                                    {guidance && (
                                                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-1">
                                                            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                                                                <BookOpen className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                                                <span>{guidance.title}</span>
                                                            </div>
                                                            <pre className="text-xs text-amber-950 dark:text-amber-200 whitespace-pre-wrap font-sans leading-relaxed pt-1">
                                                                {guidance.content}
                                                            </pre>
                                                        </div>
                                                    )}

                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Pregunta Presentada:</p>
                                                        <p className="text-sm font-semibold text-foreground leading-relaxed">{qData.prompt_context}</p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Respuesta Escrita del Candidato:</p>
                                                        <div className="p-3.5 bg-background border border-border rounded-lg text-sm text-foreground whitespace-pre-wrap leading-relaxed shadow-xs">
                                                            {qData.candidate_response || <span className="italic opacity-60">Sin respuesta del candidato aún.</span>}
                                                        </div>
                                                    </div>

                                                    {qData.candidate_response && qData.ai_likelihood !== undefined && qData.ai_likelihood !== null && (
                                                        <AiLikelihoodBadge percentage={qData.ai_likelihood} />
                                                    )}

                                                    {qData.ai_score !== null && qData.ai_justification && (
                                                        <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-foreground/90 space-y-1">
                                                            <span className="font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                                                                <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" /> Justificación de la Sugerencia IA:
                                                            </span>
                                                            <p className="text-muted-foreground leading-relaxed">{qData.ai_justification}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
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
                                    const subs = cat.id === 'B1' ? B1_SUBS : cat.id === 'B2' ? (isOtel ? B2_SUBS_OTEL : B2_SUBS) : B3_SUBS
                                    const subScores = cat.id === 'B1' ? b1SubScores : cat.id === 'B2' ? b2SubScores : b3SubScores
                                    const setSubScores = (cat.id === 'B1' ? setB1SubScores : cat.id === 'B2' ? setB2SubScores : setB3SubScores) as React.Dispatch<React.SetStateAction<Record<string, number>>>
                                    return subs.map((subItem) => {
                                        let aiHint = null
                                        if (cat.id === 'B1') {
                                             const aiMatch = aiB1Data.find(t => t.subcategory === `EVAL_${subItem.id}`)
                                             if (aiMatch && aiMatch.ai_score !== null) aiHint = { score: aiMatch.ai_score as number, justification: aiMatch.ai_justification }
                                        } else if (cat.id === 'B2' && isOtel) {
                                             const targetSubs = (subItem.id === 'B2.1' || subItem.id === 'B2.2') ? ['B2.1', 'B2'] : ['B2.2', 'B5']
                                             const aiMatch = localTests.find(t => t.test_type === 'QUESTIONS_B2' && targetSubs.includes(t.subcategory))
                                             if (aiMatch && aiMatch.ai_score !== null) aiHint = { score: Math.min(4, Math.max(1, aiMatch.ai_score + 1)), justification: aiMatch.ai_justification }
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
