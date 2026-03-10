'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Terminal, Eye, Bot, Sparkles, RefreshCw, RotateCcw, Loader2, Wrench, BookOpen, ArrowUp } from 'lucide-react'
import { getA1Results, resetA1Responses, getA2Results, resetA2Responses, getA3Results, resetA3Responses, getA4Results, resetA4Responses } from '@/app/actions/candidate'
import { A3_EVALUATOR_GUIDANCE } from '@/lib/evaluator-guidance'

interface Props {
    evaluationId: string
    existingScores: any[]
    dynamicTests: any[]
    readOnly?: boolean
}

const RUBRIC_SCALE = [
    { level: 0, label: 'Sin conocimiento', desc: 'No conoce el concepto ni ha tenido contacto' },
    { level: 1, label: 'Básico', desc: 'Ha escuchado el concepto, puede describirlo pero no lo ha aplicado' },
    { level: 2, label: 'Funcional', desc: 'Lo ha aplicado en contexto real con supervisión' },
    { level: 3, label: 'Autónomo', desc: 'Lo aplica sin supervisión y puede explicarlo a otros' },
]

// A1 subcategories (scored individually 0-3)
const A1_SUBS = [
    { id: 'A1.1', name: 'Administración básica de Linux' },
    { id: 'A1.2', name: 'Administración básica de Windows Server' },
    { id: 'A1.3', name: 'Fundamentos de redes' },
    { id: 'A1.4', name: 'Conocimiento de contenedores' },
    { id: 'A1.5', name: 'Conocimiento de Cloud' },
]

// A2 subcategories (scored individually 0-3)
const A2_SUBS = [
    { id: 'A2.1', name: 'Monitoreo vs Observabilidad', desc: 'Diferencia entre monitoreo reactivo y observabilidad proactiva' },
    { id: 'A2.2', name: 'Tres Pilares', desc: 'Métricas, Logs y Trazas' },
    { id: 'A2.3', name: 'Dashboards', desc: 'Navegación, lectura de dashboards, filtros básicos' },
    { id: 'A2.4', name: 'Búsqueda de Logs', desc: 'Filtros por campo y rango de tiempo' },
    { id: 'A2.5', name: 'Interpretación de Alertas', desc: 'Interpretar una alerta y proponer primeros pasos' },
]

// A3 subcategories (scored individually 0-3, max 12 normalized to 10)
const A3_SUBS = [
    { id: 'A3.1', name: 'Git Básico', desc: 'Clonar, crear rama, commit, push' },
    { id: 'A3.2', name: 'Scripting', desc: 'Leer y ejecutar scripts Bash/Python' },
    { id: 'A3.3', name: 'Gestión ITSM', desc: 'Registrar, categorizar y escalar tickets' },
    { id: 'A3.4', name: 'Documentación', desc: 'Documentar procedimientos en wikis/Confluence' },
]

// A4 subcategories (Troubleshooting Chatbot)
const A4_SUBS = [
    { id: 'A4.1', name: 'Identificación de Fuentes', desc: 'Identifica fuentes relevantes (logs, métricas, estados)' },
    { id: 'A4.2', name: 'Lógica de Investigación', desc: 'Propone una secuencia lógica y coherente' },
    { id: 'A4.3', name: 'Diagnóstico y Resolución', desc: 'Diferencia entre síntoma y causa raíz' },
]

// Categorías restantes (vacío por ahora si no hay más módulos)
const OTHER_CATEGORIES: any[] = []

export function DimensionAEvaluation({ evaluationId, existingScores, dynamicTests, readOnly }: Props) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [expandedRubric, setExpandedRubric] = useState<string | null>(null)
    const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null)

    // A1 sub-scores (per subcategory, 0-3 each)
    const getInitialA1SubScore = (subId: string) => {
        const found = existingScores.find(s => s.dimension === 'A' && s.category === subId)
        return found ? found.raw_score : 0
    }
    const getInitialA1SubComment = (subId: string) => {
        const found = existingScores.find(s => s.dimension === 'A' && s.category === subId)
        return found?.comments || ''
    }

    const [a1SubScores, setA1SubScores] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        A1_SUBS.forEach(s => { initial[s.id] = getInitialA1SubScore(s.id) })
        return initial
    })
    const [a1SubComments, setA1SubComments] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        A1_SUBS.forEach(s => { initial[s.id] = getInitialA1SubComment(s.id) })
        return initial
    })

    // A2-A4 scores (existing flow)
    const getInitialScore = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'A' && s.category === categoryId)
        return found ? found.raw_score : 0
    }
    const getInitialComment = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'A' && s.category === categoryId)
        return found?.comments || ''
    }

    const [scores, setScores] = useState<Record<string, number>>({})
    const [comments, setComments] = useState<Record<string, string>>({})

    // A4 sub-scores (0-3 each)
    const [a4SubScores, setA4SubScores] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        A4_SUBS.forEach(s => { initial[s.id] = getInitialA1SubScore(s.id) })
        return initial
    })
    const [a4SubComments, setA4SubComments] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        A4_SUBS.forEach(s => { initial[s.id] = getInitialA1SubComment(s.id) })
        return initial
    })

    // A2 sub-scores (per subcategory, 0-3 each)
    const [a2SubScores, setA2SubScores] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        A2_SUBS.forEach(s => { initial[s.id] = getInitialA1SubScore(s.id) })
        return initial
    })
    const [a2SubComments, setA2SubComments] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        A2_SUBS.forEach(s => { initial[s.id] = getInitialA1SubComment(s.id) })
        return initial
    })

    // A1 candidate questions + AI scores from dynamic_tests
    // Use state so we can refresh without reloading the page
    const [a1QData, setA1QData] = useState(dynamicTests.filter(t => t.test_type === 'QUESTIONS_A1'))
    const [a1Refreshing, setA1Refreshing] = useState(false)
    const [a1Resetting, setA1Resetting] = useState(false)

    // A4 chatbot history + AI scores
    const [a4Data, setA4Data] = useState<any[]>([])
    const [a4Refreshing, setA4Refreshing] = useState(false)
    const [a4Resetting, setA4Resetting] = useState(false)
    const [a4History, setA4History] = useState<string>('')
    const a4HistoryRef = useRef<HTMLDivElement>(null)

    // Autoscroll A4 history when expanded or updated
    useEffect(() => {
        if (expandedEvidence === 'A4' && a4HistoryRef.current) {
            a4HistoryRef.current.scrollTop = a4HistoryRef.current.scrollHeight
        }
    }, [expandedEvidence, a4History])

    const handleRefreshA1 = async () => {
        setA1Refreshing(true)
        try {
            const results = await getA1Results(evaluationId)
            // Map results to the dynamicTests shape
            setA1QData(results.map(r => ({
                test_type: 'QUESTIONS_A1',
                subcategory: r.subcategory,
                prompt_context: r.question,
                candidate_response: r.answer,
                ai_score: r.ai_score,
                ai_justification: r.ai_justification,
            })))
        } catch (e) {
            console.error('Error refreshing A1:', e)
        } finally {
            setA1Refreshing(false)
        }
    }

    const handleResetA1 = async () => {
        if (!confirm('⚠️ ¿Estás seguro? Esto eliminará TODAS las preguntas y respuestas de A1 del candidato. El candidato deberá generar nuevas preguntas.')) return
        setA1Resetting(true)
        try {
            const result = await resetA1Responses(evaluationId)
            if (result.success) {
                setA1QData([])
                // Reset AI-prefilled scores
                const resetScores: Record<string, number> = {}
                A1_SUBS.forEach(s => { resetScores[s.id] = 0 })
                setA1SubScores(resetScores)
            } else {
                alert(`Error: ${result.error}`)
            }
        } catch (e) {
            console.error('Error resetting A1:', e)
        } finally {
            setA1Resetting(false)
        }
    }

    const a1QuestionsData = a1QData

    // Pre-fill A1 sub-scores from AI if not already scored by evaluator
    useEffect(() => {
        if (a1QuestionsData.length > 0) {
            const hasExistingScores = A1_SUBS.some(s => getInitialA1SubScore(s.id) > 0)
            if (!hasExistingScores) {
                const aiScores: Record<string, number> = {}
                a1QuestionsData.forEach(q => {
                    if (q.subcategory && q.ai_score !== null) {
                        aiScores[q.subcategory] = q.ai_score
                    }
                })
                if (Object.keys(aiScores).length > 0) {
                    setA1SubScores(prev => ({ ...prev, ...aiScores }))
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    // A2 candidate Q&A data
    const [a2QData, setA2QData] = useState(dynamicTests.filter(t => t.test_type === 'QUESTIONS_A2'))
    const [a2Refreshing, setA2Refreshing] = useState(false)
    const [a2Resetting, setA2Resetting] = useState(false)

    // A2 selected tool (from the first dynamic_test record)
    const a2SelectedTool = a2QData.length > 0 ? (a2QData[0].ai_generated_content || null) : null

    const handleRefreshA2 = async () => {
        setA2Refreshing(true)
        try {
            const results = await getA2Results(evaluationId)
            setA2QData(results.map(r => ({
                test_type: 'QUESTIONS_A2',
                subcategory: r.subcategory,
                prompt_context: r.question,
                candidate_response: r.answer,
                ai_score: r.ai_score,
                ai_justification: r.ai_justification,
                ai_generated_content: r.tool,
            })))
        } catch (e) {
            console.error('Error refreshing A2:', e)
        } finally {
            setA2Refreshing(false)
        }
    }

    const handleResetA2 = async () => {
        if (!confirm('⚠️ ¿Estás seguro? Esto eliminará TODAS las preguntas y respuestas de A2 del candidato.')) return
        setA2Resetting(true)
        try {
            const result = await resetA2Responses(evaluationId)
            if (result.success) {
                setA2QData([])
                const resetScores: Record<string, number> = {}
                A2_SUBS.forEach(s => { resetScores[s.id] = 0 })
                setA2SubScores(resetScores)
            } else {
                alert(`Error: ${result.error}`)
            }
        } catch (e) {
            console.error('Error resetting A2:', e)
        } finally {
            setA2Resetting(false)
        }
    }

    // Pre-fill A2 sub-scores from AI if not already scored
    useEffect(() => {
        if (a2QData.length > 0) {
            const hasExisting = A2_SUBS.some(s => getInitialA1SubScore(s.id) > 0)
            if (!hasExisting) {
                const aiScores: Record<string, number> = {}
                a2QData.forEach(q => {
                    if (q.subcategory && q.ai_score !== null) {
                        aiScores[q.subcategory] = q.ai_score
                    }
                })
                if (Object.keys(aiScores).length > 0) {
                    setA2SubScores(prev => ({ ...prev, ...aiScores }))
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    // A3 candidate Q&A data
    const [a3QData, setA3QData] = useState(dynamicTests.filter(t => t.test_type === 'QUESTIONS_A3'))
    const [a3Refreshing, setA3Refreshing] = useState(false)
    const [a3Resetting, setA3Resetting] = useState(false)

    // A3 sub-scores (per subcategory, 0-3 each)
    const [a3SubScores, setA3SubScores] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        A3_SUBS.forEach(s => { initial[s.id] = getInitialA1SubScore(s.id) })
        return initial
    })
    const [a3SubComments, setA3SubComments] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        A3_SUBS.forEach(s => { initial[s.id] = getInitialA1SubComment(s.id) })
        return initial
    })

    const handleRefreshA3 = async () => {
        setA3Refreshing(true)
        try {
            const results = await getA3Results(evaluationId)
            setA3QData(results.map(r => ({
                test_type: 'QUESTIONS_A3',
                subcategory: r.subcategory,
                prompt_context: r.question,
                candidate_response: r.answer,
                ai_score: r.ai_score,
                ai_justification: r.ai_justification,
            })))
        } catch (e) {
            console.error('Error refreshing A3:', e)
        } finally {
            setA3Refreshing(false)
        }
    }

    const handleResetA3 = async () => {
        if (!confirm('⚠️ ¿Estás seguro? Esto eliminará TODAS las preguntas y respuestas de A3 del candidato.')) return
        setA3Resetting(true)
        try {
            const result = await resetA3Responses(evaluationId)
            if (result.success) {
                setA3QData([])
                const resetScores: Record<string, number> = {}
                A3_SUBS.forEach(s => { resetScores[s.id] = 0 })
                setA3SubScores(resetScores)
            } else {
                alert(`Error: ${result.error}`)
            }
        } catch (e) {
            console.error('Error resetting A3:', e)
        } finally {
            setA3Resetting(false)
        }
    }

    // Pre-fill A3 sub-scores from AI
    useEffect(() => {
        if (a3QData.length > 0) {
            const hasExisting = A3_SUBS.some(s => getInitialA1SubScore(s.id) > 0)
            if (!hasExisting) {
                const aiScores: Record<string, number> = {}
                a3QData.forEach(q => {
                    if (q.subcategory && q.ai_score !== null) {
                        aiScores[q.subcategory] = q.ai_score
                    }
                })
                if (Object.keys(aiScores).length > 0) {
                    setA3SubScores(prev => ({ ...prev, ...aiScores }))
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const a1Total = Object.values(a1SubScores).reduce((a, b) => a + b, 0)
    const a2Total = Object.values(a2SubScores).reduce((a, b) => a + b, 0)
    const a3Total = Object.values(a3SubScores).reduce((sum, v) => sum + v, 0)
    const a3Normalized = Math.round((a3Total / 12) * 10 * 10) / 10  // 1 decimal
    const a4Total = Object.values(a4SubScores).reduce((sum, v) => sum + v, 0)
    const a4Normalized = Math.round((a4Total / 9) * 10 * 10) / 10  // 1 decimal

    const handleRefreshA4 = async () => {
        setA4Refreshing(true)
        try {
            const results = await getA4Results(evaluationId)
            setA4Data(results)
            if (results.length > 0 && results[0].history) {
                setA4History(results[0].history)
            }
            // Update individual sub-scores state if they exist
            results.forEach(r => {
                if (r.ai_score !== null) {
                    setA4SubScores(prev => ({ ...prev, [r.subcategory]: r.ai_score! }))
                }
                if (r.ai_justification) {
                    setA4SubComments(prev => ({ ...prev, [r.subcategory]: r.ai_justification! }))
                }
            })
        } catch (e) {
            console.error('Error refreshing A4:', e)
        } finally {
            setA4Refreshing(false)
        }
    }

    const handleResetA4 = async () => {
        if (!confirm('⚠️ ¿Estás seguro? Esto eliminará el chat y la evaluación IA de A4.')) return
        setA4Resetting(true)
        try {
            const result = await resetA4Responses(evaluationId)
            if (result.success) {
                setA4Data([])
                setA4History('')
                setA4SubScores({ 'A4.1': 0, 'A4.2': 0, 'A4.3': 0 })
                setA4SubComments({ 'A4.1': '', 'A4.2': '', 'A4.3': '' })
            }
        } finally {
            setA4Resetting(false)
        }
    }

    // Load initial A4 data
    useEffect(() => {
        handleRefreshA4()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        const supabase = createClient()

        try {
            // Dimension A sub-scores A1, A2, A3, A4
            const subScoresData = [
                ...A1_SUBS.map(s => ({ category: s.id, score: a1SubScores[s.id], comment: a1SubComments[s.id] })),
                ...A2_SUBS.map(s => ({ category: s.id, score: a2SubScores[s.id], comment: a2SubComments[s.id] })),
                ...A3_SUBS.map(s => ({ category: s.id, score: a3SubScores[s.id], comment: a3SubComments[s.id] })),
                ...A4_SUBS.map(s => ({ category: s.id, score: a4SubScores[s.id], comment: a4SubComments[s.id] })),
            ]

            for (const item of subScoresData) {
                const ext = existingScores.find(s => s.dimension === 'A' && s.category === item.category)
                const { error: scoreErr } = await supabase
                    .from('dimension_scores')
                    .upsert({
                        ...(ext ? { id: ext.id } : {}),
                        evaluation_id: evaluationId,
                        dimension: 'A',
                        category: item.category,
                        raw_score: item.score,
                        comments: item.comment
                    })
                if (scoreErr) throw scoreErr
            }

            // Parent categories totals (for summary/radar)
            const a1TotalRaw = Object.values(a1SubScores).reduce((a, b) => a + b, 0)
            const a2TotalRaw = Object.values(a2SubScores).reduce((a, b) => a + b, 0)
            const a3TotalRaw = Object.values(a3SubScores).reduce((a, b) => a + b, 0)
            const a4TotalRaw = Object.values(a4SubScores).reduce((a, b) => a + b, 0)

            const totalScores = [
                { category: 'A1', score: a1TotalRaw },
                { category: 'A2', score: a2TotalRaw },
                { category: 'A3', score: a3TotalRaw },
                { category: 'A4', score: a4TotalRaw },
            ]

            for (const t of totalScores) {
                const ext = existingScores.find(s => s.dimension === 'A' && s.category === t.category)
                const { error: totalErr } = await supabase
                    .from('dimension_scores')
                    .upsert({
                        ...(ext ? { id: ext.id } : {}),
                        evaluation_id: evaluationId,
                        dimension: 'A',
                        category: t.category,
                        raw_score: t.score,
                    })
                if (totalErr) throw totalErr
            }

            router.refresh()
        } catch (e) {
            console.error('Error in handleSave:', e)
            alert('Error guardando la calificación.')
        } finally {
            setIsSaving(false)
        }
    }

    const getTestData = (testType?: string) => dynamicTests.find(t => t.test_type === testType)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Dimensión A: Habilidades Técnicas</h2>
                    <p className="text-muted-foreground text-sm">Competencias base de Sistemas, Observabilidad y Analítica (50 pts).</p>
                </div>
                {!readOnly && (
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                        {isSaving ? 'Guardando...' : 'Guardar Dimensión A'}
                    </Button>
                )}
            </div>

            {/* ===== A1: PER-SUBCATEGORY EVALUATION ===== */}
            <Card className="border-border border-2 border-primary/20">
                <CardHeader className="bg-muted/30 border-b border-border py-4">
                    <CardTitle className="text-lg flex justify-between items-center text-primary">
                        <span>A1. Fundamentos de Infraestructura y Sistemas</span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleRefreshA1}
                                disabled={a1Refreshing} className="h-8 px-3 text-xs">
                                {a1Refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                                Actualizar
                            </Button>
                            {!readOnly && a1QuestionsData.length > 0 && (
                                <Button variant="outline" size="sm" onClick={handleResetA1}
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

                <CardContent className="p-5 space-y-4">
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
                                        const SCORE_COLORS = [
                                            { bg: 'bg-red-500', text: 'text-red-600', accent: '#ef4444', ring: 'ring-red-300', barBg: 'bg-red-100' },
                                            { bg: 'bg-orange-500', text: 'text-orange-600', accent: '#f97316', ring: 'ring-orange-300', barBg: 'bg-orange-100' },
                                            { bg: 'bg-emerald-700', text: 'text-emerald-700', accent: '#047857', ring: 'ring-emerald-300', barBg: 'bg-emerald-100' },
                                            { bg: 'bg-green-400', text: 'text-green-500', accent: '#4ade80', ring: 'ring-green-300', barBg: 'bg-green-100' },
                                        ]
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
                        const TOTAL_COLORS = [
                            { bg: 'bg-red-500', border: 'border-red-200', fill: 'bg-red-50', text: 'text-red-600', label: 'Nivel bajo' },
                            { bg: 'bg-orange-500', border: 'border-orange-200', fill: 'bg-orange-50', text: 'text-orange-600', label: 'Nivel básico' },
                            { bg: 'bg-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-50', text: 'text-emerald-700', label: 'Nivel funcional' },
                            { bg: 'bg-green-400', border: 'border-green-200', fill: 'bg-green-50', text: 'text-green-500', label: 'Nivel autónomo' },
                        ]
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

            {/* ===== A2: PER-SUBCATEGORY EVALUATION ===== */}
            <Card className="border-border border-2 border-primary/20">
                <CardHeader className="bg-muted/30 border-b border-border py-4">
                    <CardTitle className="text-lg flex justify-between items-center text-primary">
                        <span className="flex items-center gap-2">
                            A2. Observabilidad y Monitoreo
                            {a2SelectedTool && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs font-semibold">
                                    <Wrench className="h-3 w-3" /> {a2SelectedTool}
                                </span>
                            )}
                        </span>
                        <div className="flex items-center gap-2">
                            {!readOnly && (
                                <>
                                    <Button variant="outline" size="sm" onClick={handleRefreshA2} disabled={a2Refreshing}
                                        className="text-xs h-7 gap-1">
                                        <RefreshCw className={`h-3 w-3 ${a2Refreshing ? 'animate-spin' : ''}`} /> Actualizar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleResetA2} disabled={a2Resetting}
                                        className="text-xs h-7 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <RotateCcw className={`h-3 w-3 ${a2Resetting ? 'animate-spin' : ''}`} /> Resetear A2
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    {a2QData.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 space-y-2">
                            <p className="text-sm">⏳ Esperando respuestas del candidato para A2...</p>
                            <p className="text-xs">Usa el botón "Actualizar" cuando el candidato haya guardado sus respuestas.</p>
                        </div>
                    ) : null}

                    {A2_SUBS.map(sub => {
                        const qData = a2QData.find(q => q.subcategory === sub.id)
                        return (
                            <div key={sub.id} className="border border-border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-bold text-primary text-sm">{sub.id}</span>
                                        <span className="ml-2 font-semibold text-foreground text-sm">{sub.name}</span>
                                        <p className="text-xs text-muted-foreground">{sub.desc}</p>
                                    </div>
                                </div>

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

                                {/* Slider 0-3 with color coding */}
                                {(() => {
                                    const score = a2SubScores[sub.id]
                                    const SCORE_COLORS = [
                                        { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-300', barBg: 'bg-red-100' },
                                        { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-300', barBg: 'bg-orange-100' },
                                        { bg: 'bg-emerald-700', text: 'text-emerald-700', ring: 'ring-emerald-300', barBg: 'bg-emerald-100' },
                                        { bg: 'bg-green-400', text: 'text-green-500', ring: 'ring-green-300', barBg: 'bg-green-100' },
                                    ]
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
                                                            onClick={() => setA2SubScores(prev => ({ ...prev, [sub.id]: v }))}
                                                            className={`w-6 h-6 rounded text-center font-bold transition-all ${a2SubScores[sub.id] === v
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

                                {/* Comment */}
                                <textarea value={a2SubComments[sub.id]} disabled={readOnly}
                                    onChange={(e) => setA2SubComments(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                    placeholder="Evidencia observada..."
                                    className="w-full min-h-[45px] p-2 rounded-md border border-input bg-background text-foreground text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" />
                            </div>
                        )
                    })}

                    {/* A2 Summary */}
                    {(() => {
                        const pct = a2Total / 15
                        const level = a2Total <= 3 ? 0 : a2Total <= 7 ? 1 : a2Total <= 11 ? 2 : 3
                        const TOTAL_COLORS = [
                            { bg: 'bg-red-500', border: 'border-red-200', fill: 'bg-red-50', text: 'text-red-600', label: 'Nivel bajo' },
                            { bg: 'bg-orange-500', border: 'border-orange-200', fill: 'bg-orange-50', text: 'text-orange-600', label: 'Nivel básico' },
                            { bg: 'bg-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-50', text: 'text-emerald-700', label: 'Nivel funcional' },
                            { bg: 'bg-green-400', border: 'border-green-200', fill: 'bg-green-50', text: 'text-green-500', label: 'Nivel autónomo' },
                        ]
                        const c = TOTAL_COLORS[level]
                        return (
                            <div className={`${c.fill} border ${c.border} rounded-lg p-4 space-y-2`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-foreground">Total A2:</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold ${c.text}`}>{c.label}</span>
                                        <span className={`text-lg font-mono font-bold ${c.text}`}>{a2Total} / 15</span>
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

            {/* ===== A3: PER-SUBCATEGORY EVALUATION WITH GUIDANCE ===== */}
            <Card className="border-border border-2 border-primary/20">
                <CardHeader className="bg-muted/30 border-b border-border py-4">
                    <CardTitle className="text-lg flex justify-between items-center text-primary">
                        <span>A3. Herramientas y Automatización Básica</span>
                        <div className="flex items-center gap-2">
                            {!readOnly && (
                                <>
                                    <Button variant="outline" size="sm" onClick={handleRefreshA3} disabled={a3Refreshing}
                                        className="text-xs h-7 gap-1">
                                        <RefreshCw className={`h-3 w-3 ${a3Refreshing ? 'animate-spin' : ''}`} /> Actualizar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleResetA3} disabled={a3Resetting}
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
                                    const score = a3SubScores[sub.id]
                                    const SCORE_COLORS = [
                                        { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-300', barBg: 'bg-red-100' },
                                        { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-300', barBg: 'bg-orange-100' },
                                        { bg: 'bg-emerald-700', text: 'text-emerald-700', ring: 'ring-emerald-300', barBg: 'bg-emerald-100' },
                                        { bg: 'bg-green-400', text: 'text-green-500', ring: 'ring-green-300', barBg: 'bg-green-100' },
                                    ]
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

                                <textarea value={a3SubComments[sub.id]} disabled={readOnly}
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
                        const TOTAL_COLORS = [
                            { bg: 'bg-red-500', border: 'border-red-200', fill: 'bg-red-50', text: 'text-red-600', label: 'Nivel bajo' },
                            { bg: 'bg-orange-500', border: 'border-orange-200', fill: 'bg-orange-50', text: 'text-orange-600', label: 'Nivel básico' },
                            { bg: 'bg-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-50', text: 'text-emerald-700', label: 'Nivel funcional' },
                            { bg: 'bg-green-400', border: 'border-green-200', fill: 'bg-green-50', text: 'text-green-500', label: 'Nivel autónomo' },
                        ]
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

            {/* ===== A4: CHATBOT TROUBLESHOOTING EVALUATION ===== */}
            <Card className="border-border border-2 border-primary/20">
                <CardHeader className="bg-muted/30 border-b border-border py-4">
                    <CardTitle className="text-lg flex justify-between items-center text-primary">
                        <span className="flex items-center gap-2"><NextImage src="/icons/AIAgent.png" alt="IA" width={40} height={40} /> A4. Pensamiento Analítico (Chatbot)</span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleRefreshA4} disabled={a4Refreshing} className="h-8 px-3 text-xs">
                                {a4Refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                                Actualizar
                            </Button>
                            {!readOnly && a4Data.length > 0 && (
                                <Button variant="outline" size="sm" onClick={handleResetA4} disabled={a4Resetting}
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
                            <button onClick={() => setExpandedEvidence(expandedEvidence === 'A4' ? null : 'A4')}
                                className="w-full flex items-center justify-between text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 hover:bg-emerald-100 transition-colors">
                                <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> Ver Historial de Chat Completo</span>
                                {expandedEvidence === 'A4' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {expandedEvidence === 'A4' && (
                                <div
                                    ref={a4HistoryRef}
                                    className="bg-slate-900 rounded-lg p-4 font-mono text-xs max-h-[400px] overflow-y-auto space-y-4 border border-slate-700 shadow-inner"
                                >
                                    {a4History.split('\n').map((line, idx) => {
                                        const isUser = line.startsWith('USER:')
                                        const isAi = line.startsWith('AI:')
                                        if (!isUser && !isAi) return <div key={idx} className="text-slate-500 italic">{line}</div>
                                        return (
                                            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] p-2 rounded ${isUser ? 'bg-blue-900/40 text-blue-100 border border-blue-800' : 'bg-slate-800 text-slate-100 border border-slate-700'}`}>
                                                    <span className="font-bold opacity-50 block mb-1 uppercase text-[10px]">{line.split(':')[0]}</span>
                                                    {line.split(':').slice(1).join(':')}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Per-subcategory scoring */}
                            {A4_SUBS.map(sub => {
                                const qData = a4Data.find(q => q.subcategory === sub.id)
                                return (
                                    <div key={sub.id} className="border border-border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-bold text-primary text-sm">{sub.id}</span>
                                                <span className="ml-2 font-semibold text-foreground text-sm">{sub.name}</span>
                                                <p className="text-xs text-muted-foreground">{sub.desc}</p>
                                            </div>
                                        </div>

                                        {qData && qData.ai_score !== null && (
                                            <div className="flex items-center gap-3 p-2 rounded bg-violet-50 border border-violet-200">
                                                <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
                                                <div className="text-xs">
                                                    <span className="font-bold text-violet-700">Evaluación IA: {qData.ai_score}/3</span>
                                                    {qData.ai_justification && (
                                                        <p className="text-violet-600 mt-0.5 italic">"{qData.ai_justification}"</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Scoring 0-3 */}
                                        {(() => {
                                            const score = a4SubScores[sub.id]
                                            const SCORE_COLORS = [
                                                { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-300', barBg: 'bg-red-100' },
                                                { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-300', barBg: 'bg-orange-100' },
                                                { bg: 'bg-emerald-700', text: 'text-emerald-700', ring: 'ring-emerald-300', barBg: 'bg-emerald-100' },
                                                { bg: 'bg-green-400', text: 'text-green-500', ring: 'ring-green-300', barBg: 'bg-green-100' },
                                            ]
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

                                        <textarea value={a4SubComments[sub.id]} disabled={readOnly}
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
                                const TOTAL_COLORS = [
                                    { bg: 'bg-red-500', border: 'border-red-200', fill: 'bg-red-50', text: 'text-red-600', label: 'Nivel bajo' },
                                    { bg: 'bg-orange-500', border: 'border-orange-200', fill: 'bg-orange-50', text: 'text-orange-600', label: 'Nivel básico' },
                                    { bg: 'bg-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-50', text: 'text-emerald-700', label: 'Nivel funcional' },
                                    { bg: 'bg-green-400', border: 'border-green-200', fill: 'bg-green-50', text: 'text-green-500', label: 'Nivel autónomo' },
                                ]
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

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
                <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="gap-2 shadow-sm">
                    <ArrowUp className="w-4 h-4" /> Ir al principio
                </Button>
                {!readOnly && (
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                        {isSaving ? 'Guardando...' : 'Guardar Dimensión A'}
                    </Button>
                )}
            </div>
        </div>
    )
}
