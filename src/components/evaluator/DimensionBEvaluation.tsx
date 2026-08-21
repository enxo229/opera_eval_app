'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bot, MailCheck, ChevronDown, ChevronUp, MessageCircleQuestion, Eye, RotateCcw, Info, AlertTriangle, CheckCircle2, TrendingUp, Sparkles, Loader2, ArrowUp } from 'lucide-react'
import { resetBResponses, triggerB1Evaluation } from '@/app/actions/candidate/b1'

interface Props {
    evaluationId: string
    existingScores: any[]
    dynamicTests: any[]
    readOnly?: boolean
}

// Evaluator question guides per category (B2-B3)
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

const CATEGORIES = [
    { id: 'B1', name: 'Comunicación Técnica Escrita (Ticket)', max: 16, normMax: 10, sub: 'B1.x' },
    { id: 'B2', name: 'Comunicación Verbal & Stakeholders', max: 16, normMax: 10, sub: 'B2.x' },
    { id: 'B3', name: 'Colaboración, Priorización y Manejo bajo Presión', max: 12, normMax: 10, sub: 'B3.x' },
]

const B1_SUBS = [
    { id: 'B1.1', label: 'Estructura del registro', levels: ['Solo describe sin orden', 'Inicio/fin básico (faltan campos)', 'Cubre todos los campos', 'Plantilla profesional'] },
    { id: 'B1.2', label: 'Precisión técnica', levels: ['Omite/confunde datos', 'Error sin contexto técnico', 'Proceso, error y métricas', 'Evidencia y cronología completa'] },
    { id: 'B1.3', label: 'Acciones documentadas', levels: ['Sin acciones tomadas', 'Menciona escalamiento', 'Pasos propios y escalado', 'Cronología con responsables'] },
    { id: 'B1.4', label: 'Impacto descrito', levels: ['No menciona impacto', 'Impacto sin cuantificar', 'Servicio afectado y duración', 'Cuantifica con datos concretos'] }
]

const B2_SUBS = [
    { id: 'B2.1', label: 'Claridad del lenguaje', levels: ['Usa jerga técnica', 'Pierde precisión al simplificar', 'Explica hechos sin tecnicismos', 'Lenguaje claro orientado a negocio'] },
    { id: 'B2.2', label: 'Estructura narrativa', levels: ['Sin orden cronológico', 'Saltos o confusión en el relato', 'Explica qué pasó y resolución', 'Narrativa fluida y completa'] },
    { id: 'B2.3', label: 'Manejo de incertidumbre', levels: ['Inventa o evita lo que no sabe', 'Reconoce ignorancia sin proponer', 'Reconoce limites con honestidad', 'Propone cómo obtener la información'] },
    { id: 'B2.4', label: 'Transmisión del impacto', levels: ['No menciona impacto al cliente', 'Impacto sin contexto', 'Comunica duración y servicio', 'Comunica impacto/acciones claramente'] }
]

const B3_SUBS = [
    { id: 'B3.1', label: 'Colaboración & Trabajo en Equipo', levels: ['Individualista', 'Colaboración puntual', 'Colabora activamente', 'Coordina y apoya proactivamente'] },
    { id: 'B3.2', label: 'Priorización de Alertas y Gestión del Tiempo', levels: ['Sin criterio / Caos', 'Prioriza por orden de llegada', 'Prioriza por urgencia básica', 'Criterio estructurado impacto/urgencia'] },
    { id: 'B3.3', label: 'Documentación & Traspaso de Guardia (Handoff)', levels: ['Sin información', 'Documenta lo mínimo', 'Documenta consistentemente', 'Handoff autoexplicativo y detallado'] }
]

export function DimensionBEvaluation({ evaluationId, existingScores, dynamicTests, readOnly }: Props) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [expandedEvidence, setExpandedEvidence] = useState<string | null>('B1')

    const testB1 = dynamicTests.find(t => t.test_type === 'B1_TICKET' && t.subcategory === 'RESPONSE')
    const testB1Case = dynamicTests.find(t => t.test_type === 'B1_TICKET' && t.subcategory === 'CASE')
    const aiB1Data = dynamicTests.filter(t => t.test_type === 'B1_TICKET' && t.subcategory?.startsWith('EVAL_')).sort((a, b) => a.subcategory.localeCompare(b.subcategory))

    const isB1Finished = !!testB1

    const getInitialSubScore = (subId: string) => {
        const found = existingScores.find(s => s.dimension === 'B' && s.category === subId)
        return found ? found.raw_score : 1
    }

    const getInitialScore = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'B' && s.category === categoryId)
        return found ? found.raw_score : 0
    }
    const getInitialComment = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'B' && s.category === categoryId)
        return found?.comments || ''
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
        const init: Record<string, number> = {}
        B3_SUBS.forEach(s => init[s.id] = getInitialSubScore(s.id))
        return init
    })

    const [scores, setScores] = useState<Record<string, number>>({
        B1: getInitialScore('B1'), B2: getInitialScore('B2'), B3: getInitialScore('B3')
    })
    const [comments, setComments] = useState<Record<string, string>>({
        B1: getInitialComment('B1'), B2: getInitialComment('B2'), B3: getInitialComment('B3')
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

    const handleSave = async () => {
        setIsSaving(true)
        const supabase = createClient()
        try {
            const subScoresData = [
                ...B1_SUBS.map(s => ({ category: s.id, score: b1SubScores[s.id], dimension: 'B' })),
                ...B2_SUBS.map(s => ({ category: s.id, score: b2SubScores[s.id], dimension: 'B' })),
                ...B3_SUBS.map(s => ({ category: s.id, score: b3SubScores[s.id], dimension: 'B' })),
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
                { category: 'B1', score: b1TotalRaw, comment: comments['B1'] },
                { category: 'B2', score: b2TotalRaw, comment: comments['B2'] },
                { category: 'B3', score: b3TotalRaw, comment: comments['B3'] },
            ]

            for (const t of totalScores) {
                const ext = existingScores.find(s => s.dimension === 'B' && s.category === t.category)
                const { error: totalErr } = await supabase
                    .from('dimension_scores')
                    .upsert({
                        ...(ext ? { id: ext.id } : {}),
                        evaluation_id: evaluationId,
                        dimension: 'B',
                        category: t.category,
                        raw_score: t.score,
                        comments: t.comment
                    })
                if (totalErr) throw totalErr
            }

            setScores({ B1: b1TotalRaw, B2: b2TotalRaw, B3: b3TotalRaw })
            router.refresh()
            alert('Cambios guardados exitosamente.')
        } catch (error: any) {
            console.error('Error saving scores:', error)
            alert('Error al guardar puntajes: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleResetB = async () => {
        if (!confirm('¿Estás seguro de resetear la Dimensión B? Esto borrará el ticket del candidato y las evaluaciones de IA.')) return
        setIsResetting(true)
        try {
            const res = await resetBResponses(evaluationId)
            if (res.success) {
                setScores({ B1: 0, B2: 0, B3: 0 })
                router.refresh()
            } else {
                alert('Error al resetear: ' + res.error)
            }
        } finally {
            setIsResetting(false)
        }
    }

    const handleTriggerAI = async () => {
        if (!isB1Finished) {
            alert('El candidato aún no ha enviado el ticket de incidente.')
            return
        }
        setIsEvaluating(true)
        try {
            const res = await triggerB1Evaluation(evaluationId)
            if (res.success) {
                alert('Evaluación de IA completada. Se han actualizado las sugerencias.')
                router.refresh()
            } else {
                alert('Error al ejecutar evaluación: ' + res.error)
            }
        } catch (e: any) {
            alert('Excepción: ' + e.message)
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
                        Comunicación Técnica Escrita, Verbal con Stakeholders y Colaboración Bajo Presión (30 pts).
                    </p>
                </div>
                {!readOnly && (
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            onClick={handleResetB}
                            disabled={isResetting || isSaving}
                            className="text-xs h-9 bg-red-600/10 text-red-600 hover:bg-red-600/20 border border-red-600/20"
                        >
                            {isResetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                            Resetear Respuestas
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-sm"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Dimensión B'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm pb-4 pt-2 -mt-2 border-b border-border/50 mb-6">
                <div className="flex flex-wrap gap-2 p-1.5 bg-muted/30 rounded-xl border border-border/40">
                    {[
                        { id: 'section-B1', label: 'B1. Ticket Escrito (10 pts)' },
                        { id: 'section-B2', label: 'B2. Comunicación Verbal (10 pts)' },
                        { id: 'section-B3', label: 'B3. Colaboración & Presión (10 pts)' },
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
                                    const elementPosition = el.getBoundingClientRect().top + window.scrollY;
                                    window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
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
                                <span className="text-sm font-mono text-muted-foreground">Ponderado: {cat.normMax} pts</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {cat.id === 'B1' && (
                                <div className="space-y-4">
                                    <div className="border border-border rounded-lg overflow-hidden bg-background">
                                        <button type="button" onClick={() => setExpandedEvidence(expandedEvidence === 'B1' ? null : 'B1')} className="w-full flex items-center justify-between p-3.5 bg-muted/40 hover:bg-muted/60 transition-colors text-left">
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
                                                    <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 p-4 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <NextImage src="/icons/AIAgent.png" alt="IA" width={48} height={48} className="shrink-0" />
                                                            <div>
                                                                <h4 className="text-sm font-bold text-amber-800">Evaluación Sincrónica por IA (B1)</h4>
                                                                <p className="text-xs text-amber-700/80 mt-0.5">Los insights sobre Estructura y Precisión del Ticket están integrados debajo de cada criterio.</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline" size="sm" onClick={handleTriggerAI} disabled={isEvaluating} className="border-amber-500/30 hover:bg-amber-500/10 text-amber-700 font-bold gap-2 shrink-0 bg-white shadow-sm">
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
                            {cat.id !== 'B1' && guide && (
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
                                        const color = { bg: 'bg-primary', barBg: 'bg-muted' }
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
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 h-12 rounded-xl shadow-xl">
                        {isSaving ? 'Guardando...' : 'Consolidar Dimensión B'}
                    </Button>
                )}
            </div>
        </div>
    )
}
