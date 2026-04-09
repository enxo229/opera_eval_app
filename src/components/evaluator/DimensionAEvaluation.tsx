'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowUp } from 'lucide-react'

// Action Modules
import { getA1Results, resetA1Responses } from '@/app/actions/candidate/a1'
import { getA2Results, resetA2Responses } from '@/app/actions/candidate/a2'
import { getA3Results, resetA3Responses } from '@/app/actions/candidate/a3'
import { getA4Results, resetA4Responses } from '@/app/actions/candidate/a4'

// Subcomponents & Constants
import { A1_SUBS, A2_SUBS, A3_SUBS, A4_SUBS } from './dimension-a/constants'
import { A1SubEvaluation } from './dimension-a/A1SubEvaluation'
import { A2SubEvaluation } from './dimension-a/A2SubEvaluation'
import { A3SubEvaluation } from './dimension-a/A3SubEvaluation'
import { A4SubEvaluation } from './dimension-a/A4SubEvaluation'

interface Props {
    evaluationId: string
    existingScores: any[]
    dynamicTests: any[]
    readOnly?: boolean
}

export function DimensionAEvaluation({ evaluationId, existingScores, dynamicTests, readOnly }: Props) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null)

    // Initial Scoring Helpers
    const getInitialSubScore = (subId: string) => {
        const found = existingScores.find(s => s.dimension === 'A' && s.category === subId)
        return found ? found.raw_score : 0
    }
    const getInitialSubComment = (subId: string) => {
        const found = existingScores.find(s => s.dimension === 'A' && s.category === subId)
        return found?.comments || ''
    }

    // A1 State
    const [a1SubScores, setA1SubScores] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        A1_SUBS.forEach(s => { initial[s.id] = getInitialSubScore(s.id) })
        return initial
    })
    const [a1SubComments, setA1SubComments] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        A1_SUBS.forEach(s => { initial[s.id] = getInitialSubComment(s.id) })
        return initial
    })
    const [a1QData, setA1QData] = useState(dynamicTests.filter(t => t.test_type === 'QUESTIONS_A1'))
    const [a1Refreshing, setA1Refreshing] = useState(false)
    const [a1Resetting, setA1Resetting] = useState(false)
    const a1Total = Object.values(a1SubScores).reduce((a, b) => a + b, 0)

    // A2 State
    const [a2SubScores, setA2SubScores] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        A2_SUBS.forEach(s => { initial[s.id] = getInitialSubScore(s.id) })
        return initial
    })
    const [a2SubComments, setA2SubComments] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        A2_SUBS.forEach(s => { initial[s.id] = getInitialSubComment(s.id) })
        return initial
    })
    const [a2QData, setA2QData] = useState(dynamicTests.filter(t => t.test_type === 'QUESTIONS_A2'))
    const [a2Refreshing, setA2Refreshing] = useState(false)
    const [a2Resetting, setA2Resetting] = useState(false)
    const a2Total = Object.values(a2SubScores).reduce((a, b) => a + b, 0)
    const a2SelectedTool = a2QData.length > 0 ? (a2QData[0].ai_generated_content || null) : null

    // A3 State
    const [a3SubScores, setA3SubScores] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        A3_SUBS.forEach(s => { initial[s.id] = getInitialSubScore(s.id) })
        return initial
    })
    const [a3SubComments, setA3SubComments] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        A3_SUBS.forEach(s => { initial[s.id] = getInitialSubComment(s.id) })
        return initial
    })
    const [a3QData, setA3QData] = useState(dynamicTests.filter(t => t.test_type === 'QUESTIONS_A3'))
    const [a3Refreshing, setA3Refreshing] = useState(false)
    const [a3Resetting, setA3Resetting] = useState(false)
    const a3Total = Object.values(a3SubScores).reduce((sum, v) => sum + v, 0)
    const a3Normalized = (Math.round((a3Total / 12) * 10 * 10) / 10).toString()

    // A4 State
    const [a4SubScores, setA4SubScores] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        A4_SUBS.forEach(s => { initial[s.id] = getInitialSubScore(s.id) })
        return initial
    })
    const [a4SubComments, setA4SubComments] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        A4_SUBS.forEach(s => { initial[s.id] = getInitialSubComment(s.id) })
        return initial
    })
    const [a4Data, setA4Data] = useState<any[]>([])
    const [a4History, setA4History] = useState<string>('')
    const [a4Refreshing, setA4Refreshing] = useState(false)
    const [a4Resetting, setA4Resetting] = useState(false)
    const a4HistoryRef = useRef<HTMLDivElement>(null)
    const a4Total = Object.values(a4SubScores).reduce((sum, v) => sum + v, 0)
    const a4Normalized = (Math.round((a4Total / 9) * 10 * 10) / 10).toString()

    // --- A1 Handlers ---
    const handleRefreshA1 = async () => {
        setA1Refreshing(true)
        try {
            const results = await getA1Results(evaluationId)
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
        if (!confirm('⚠️ ¿Estás seguro? Esto eliminará TODAS las preguntas y respuestas de A1 del candidato.')) return
        setA1Resetting(true)
        try {
            const result = await resetA1Responses(evaluationId)
            if (result.success) {
                setA1QData([])
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
    useEffect(() => {
        if (a1QData.length > 0) {
            const hasExisting = A1_SUBS.some(s => getInitialSubScore(s.id) > 0)
            if (!hasExisting) {
                const aiScores: Record<string, number> = {}
                a1QData.forEach(q => {
                    if (q.subcategory && q.ai_score !== null) aiScores[q.subcategory] = q.ai_score
                })
                if (Object.keys(aiScores).length > 0) setA1SubScores(prev => ({ ...prev, ...aiScores }))
            }
        }
    }, [a1QData])

    // --- A2 Handlers ---
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
    useEffect(() => {
        if (a2QData.length > 0) {
            const hasExisting = A2_SUBS.some(s => getInitialSubScore(s.id) > 0)
            if (!hasExisting) {
                const aiScores: Record<string, number> = {}
                a2QData.forEach(q => {
                    if (q.subcategory && q.ai_score !== null) aiScores[q.subcategory] = q.ai_score
                })
                if (Object.keys(aiScores).length > 0) setA2SubScores(prev => ({ ...prev, ...aiScores }))
            }
        }
    }, [a2QData])

    // --- A3 Handlers ---
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
    useEffect(() => {
        if (a3QData.length > 0) {
            const hasExisting = A3_SUBS.some(s => getInitialSubScore(s.id) > 0)
            if (!hasExisting) {
                const aiScores: Record<string, number> = {}
                a3QData.forEach(q => {
                    if (q.subcategory && q.ai_score !== null) aiScores[q.subcategory] = q.ai_score
                })
                if (Object.keys(aiScores).length > 0) setA3SubScores(prev => ({ ...prev, ...aiScores }))
            }
        }
    }, [a3QData])

    // --- A4 Handlers ---
    const handleRefreshA4 = async () => {
        setA4Refreshing(true)
        try {
            const results = await getA4Results(evaluationId)
            setA4Data(results)
            if (results.length > 0 && results[0].history) setA4History(results[0].history)
            
            results.forEach(r => {
                if (r.ai_score !== null) setA4SubScores(prev => ({ ...prev, [r.subcategory]: r.ai_score! }))
                if (r.ai_justification) setA4SubComments(prev => ({ ...prev, [r.subcategory]: r.ai_justification! }))
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
    useEffect(() => {
        handleRefreshA4()
    }, [])

    // Realtime Sync Listener
    useEffect(() => {
        const handleSync = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.evaluationId === evaluationId) {
                console.log('🔄 [Dimension A] Sincronización en tiempo real detectada. Recargando telemetría...');
                handleRefreshA1();
                handleRefreshA2();
                handleRefreshA3();
                handleRefreshA4();
            }
        };

        window.addEventListener('evaluator_db_updated', handleSync);
        return () => window.removeEventListener('evaluator_db_updated', handleSync);
    }, [evaluationId]);


    useEffect(() => {
        if (expandedEvidence === 'A4' && a4HistoryRef.current) {
            a4HistoryRef.current.scrollTop = a4HistoryRef.current.scrollHeight
        }
    }, [expandedEvidence, a4History])

    // --- Save Handler ---
    const handleSave = async () => {
        setIsSaving(true)
        const supabase = createClient()
        try {
            const subScoresData = [
                ...A1_SUBS.map(s => ({ category: s.id, score: a1SubScores[s.id], comment: a1SubComments[s.id] })),
                ...A2_SUBS.map(s => ({ category: s.id, score: a2SubScores[s.id], comment: a2SubComments[s.id] })),
                ...A3_SUBS.map(s => ({ category: s.id, score: a3SubScores[s.id], comment: a3SubComments[s.id] })),
                ...A4_SUBS.map(s => ({ category: s.id, score: a4SubScores[s.id], comment: a4SubComments[s.id] })),
            ]

            for (const item of subScoresData) {
                const ext = existingScores.find(s => s.dimension === 'A' && s.category === item.category)
                const { error: scoreErr } = await supabase.from('dimension_scores').upsert({
                    ...(ext ? { id: ext.id } : {}),
                    evaluation_id: evaluationId,
                    dimension: 'A',
                    category: item.category,
                    raw_score: item.score,
                    comments: item.comment
                })
                if (scoreErr) throw scoreErr
            }

            const totalScores = [
                { category: 'A1', score: a1Total },
                { category: 'A2', score: a2Total },
                { category: 'A3', score: a3Total },
                { category: 'A4', score: a4Total },
            ]

            for (const t of totalScores) {
                const ext = existingScores.find(s => s.dimension === 'A' && s.category === t.category)
                const { error: totalErr } = await supabase.from('dimension_scores').upsert({
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

            {/* Sticky Sub-navigation */}
            <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm pb-4 pt-2 -mt-2 border-b border-border/50 mb-6">
                <div className="flex flex-wrap gap-2 p-1.5 bg-muted/30 rounded-xl border border-border/40">
                    {[
                        { id: 'section-A1', label: 'A1. Sistemas' },
                        { id: 'section-A2', label: 'A2. Observabilidad' },
                        { id: 'section-A3', label: 'A3. Analítica' },
                        { id: 'section-A4', label: 'A4. Escenarios' }
                    ].map(link => (
                        <Button 
                            key={link.id} 
                            variant="secondary" 
                            size="sm" 
                            className="text-[10px] sm:text-xs font-black uppercase tracking-wider h-8 px-4 rounded-lg bg-background shadow-sm hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                            onClick={() => {
                                const el = document.getElementById(link.id);
                                if (el) {
                                    const offset = 120; // Space for the main tabs + this sub-nav
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

            <div id="section-A1" className="scroll-mt-32">
                <A1SubEvaluation
                    a1QuestionsData={a1QData}
                    a1SubScores={a1SubScores} setA1SubScores={setA1SubScores}
                    a1SubComments={a1SubComments} setA1SubComments={setA1SubComments}
                    a1Total={a1Total}
                    a1Refreshing={a1Refreshing} a1Resetting={a1Resetting}
                    onRefresh={handleRefreshA1} onReset={handleResetA1}
                    readOnly={readOnly}
                />
            </div>

            <div id="section-A2" className="scroll-mt-32">
                <A2SubEvaluation
                    a2QData={a2QData}
                    a2SelectedTool={a2SelectedTool}
                    a2SubScores={a2SubScores} setA2SubScores={setA2SubScores}
                    a2SubComments={a2SubComments} setA2SubComments={setA2SubComments}
                    a2Total={a2Total}
                    a2Refreshing={a2Refreshing} a2Resetting={a2Resetting}
                    onRefresh={handleRefreshA2} onReset={handleResetA2}
                    readOnly={readOnly}
                />
            </div>

            <div id="section-A3" className="scroll-mt-32">
                <A3SubEvaluation
                    a3QData={a3QData}
                    a3SubScores={a3SubScores} setA3SubScores={setA3SubScores}
                    a3SubComments={a3SubComments} setA3SubComments={setA3SubComments}
                    a3Total={a3Total} a3Normalized={a3Normalized}
                    a3Refreshing={a3Refreshing} a3Resetting={a3Resetting}
                    onRefresh={handleRefreshA3} onReset={handleResetA3}
                    readOnly={readOnly}
                />
            </div>

            <div id="section-A4" className="scroll-mt-32">
                <A4SubEvaluation
                    a4Data={a4Data}
                    a4History={a4History} a4HistoryRef={a4HistoryRef}
                    expandedEvidence={expandedEvidence} setExpandedEvidence={setExpandedEvidence}
                    a4SubScores={a4SubScores} setA4SubScores={setA4SubScores}
                    a4SubComments={a4SubComments} setA4SubComments={setA4SubComments}
                    a4Total={a4Total} a4Normalized={a4Normalized}
                    a4Refreshing={a4Refreshing} a4Resetting={a4Resetting}
                    onRefresh={handleRefreshA4} onReset={handleResetA4}
                    readOnly={readOnly}
                />
            </div>

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
