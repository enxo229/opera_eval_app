'use client'

import { useState, useCallback, useEffect } from 'react'
import NextImage from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TerminalSandbox } from '@/components/candidate/TerminalSandbox'
import { QuestionPanel } from '@/components/candidate/QuestionPanel'
import { ChatbotA4 } from '@/components/candidate/ChatbotA4'
import { TicketEditor } from '@/components/candidate/TicketEditor'
import { PromptEditorIA2 } from '@/components/candidate/PromptEditorIA2'
import { A1Tab } from '@/components/candidate/tabs/A1Tab'
import { A2Tab } from '@/components/candidate/tabs/A2Tab'
import { A3Tab } from '@/components/candidate/tabs/A3Tab'
import { Button } from '@/components/ui/button'
import {
    generateQuestionsA1,
    generateQuestionsA2,
    generateQuestionsA3,
    A1Question,
    A2Question,
    A3Question,
} from '@/app/actions/ai'
import { saveA1QuestionsOnly, saveA1Responses, getA1Results } from '@/app/actions/candidate/a1'
import { saveA2QuestionsOnly, saveA2Responses, getA2Results } from '@/app/actions/candidate/a2'
import { saveA3QuestionsOnly, saveA3Responses, getA3Results } from '@/app/actions/candidate/a3'
import { createClient } from '@/lib/supabase/client'
import { EDUCATION_LABELS } from '@/lib/constants'
import { Terminal, HelpCircle, GitBranch, Bot, FileText, Loader2, CheckCircle2, Sparkles, User, Mail, GraduationCap } from 'lucide-react'



export default function CandidateEvaluationFlow() {
    // Context: education level + evaluation ID + identity
    const [educationLevel, setEducationLevel] = useState<string>('')
    const [evaluationId, setEvaluationId] = useState<string | null>(null)
    const [contextLoaded, setContextLoaded] = useState(false)
    const [candidateName, setCandidateName] = useState<string>('')
    const [candidateEmail, setCandidateEmail] = useState<string>('')

    // Load user context
    useEffect(() => {
        async function loadContext() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get profile info
            const { data: profile } = await supabase.from('profiles').select('education_level, full_name').eq('id', user.id).single()
            if (profile?.education_level) setEducationLevel(profile.education_level)
            if (profile?.full_name) setCandidateName(profile.full_name)
            setCandidateEmail(user.email || '')

            // Get active evaluation based on active selection process
            const { data: activeProcess } = await supabase
                .from('selection_processes')
                .select('id')
                .eq('candidate_email', user.email)
                .eq('status', 'active')
                .limit(1)
                .maybeSingle()

            let evaluation: { id: string } | undefined
            if (activeProcess) {
                const { data } = await supabase
                    .from('evaluations')
                    .select('id')
                    .eq('selection_process_id', activeProcess.id)
                    .limit(1)
                    .maybeSingle()
                if (data) evaluation = data
            }

            // Fallback for missing/legacy linkages
            if (!evaluation) {
                const { data: legacyData } = await supabase
                    .from('evaluations')
                    .select('id')
                    .eq('candidate_id', user.id)
                    .limit(1)
                    .maybeSingle()
                
                if (legacyData) {
                    evaluation = legacyData
                    // Self-heal: Link this orphaned evaluation to the active process if one exists
                    if (activeProcess) {
                        await supabase.from('evaluations').update({ selection_process_id: activeProcess.id }).eq('id', legacyData.id)
                    }
                }
            }

            if (evaluation) {
                setEvaluationId(evaluation.id)

                // Load saved A1 responses if they exist
                const savedA1 = await getA1Results(evaluation.id)
                if (savedA1 && savedA1.length > 0) {
                    // Reconstruct questions from saved data
                    const questions: A1Question[] = savedA1.map(r => ({
                        subcategory: r.subcategory,
                        label: r.subcategory === 'A1.1' ? 'Linux' :
                            r.subcategory === 'A1.2' ? 'Windows Server' :
                                r.subcategory === 'A1.3' ? 'Redes' :
                                    r.subcategory === 'A1.4' ? 'Contenedores' : 'Cloud',
                        question: r.question,
                    }))
                    setA1Questions(questions)
                    setA1QuestionsGenerated(true)

                    // Restore answers
                    const answers: Record<string, string> = {}
                    savedA1.forEach(r => { answers[r.subcategory] = r.answer })
                    setA1Answers(answers)

                    // Mark as submitted with AI results
                    const isA1Submitted = savedA1.every(r => (r.answer || '').trim().length > 0)
                    setA1Submitted(isA1Submitted)
                    const aiResults = savedA1
                        .filter(r => r.ai_score !== null)
                        .map(r => ({
                            subcategory: r.subcategory,
                            score: r.ai_score!,
                            justification: r.ai_justification || '',
                        }))
                    if (aiResults.length > 0) setA1AIResults(aiResults)
                }

                // Load saved A2 responses if they exist
                const savedA2 = await getA2Results(evaluation.id)
                if (savedA2 && savedA2.length > 0) {
                    // Restore tool
                    if (savedA2[0].tool) setA2SelectedTool(savedA2[0].tool)
                    // Reconstruct questions
                    const questions: A2Question[] = savedA2.map(r => ({
                        subcategory: r.subcategory,
                        label: r.subcategory === 'A2.1' ? 'Monitoreo vs Observabilidad' :
                            r.subcategory === 'A2.2' ? 'Tres Pilares' :
                                r.subcategory === 'A2.3' ? `Dashboards` :
                                    r.subcategory === 'A2.4' ? 'Búsqueda de Logs' : 'Interpretación de Alertas',
                        question: r.question,
                    }))
                    setA2Questions(questions)
                    setA2QuestionsGenerated(true)
                    // Restore answers
                    const answers: Record<string, string> = {}
                    savedA2.forEach(r => { answers[r.subcategory] = r.answer })
                    setA2Answers(answers)
                    
                    const isA2Submitted = savedA2.every(r => (r.answer || '').trim().length > 0)
                    setA2Submitted(isA2Submitted)
                    
                    const aiResults = savedA2
                        .filter(r => r.ai_score !== null)
                        .map(r => ({ subcategory: r.subcategory, score: r.ai_score!, justification: r.ai_justification || '' }))
                    if (aiResults.length > 0) setA2AIResults(aiResults)
                }

                // Load saved A3 responses if they exist
                const savedA3 = await getA3Results(evaluation.id)
                if (savedA3 && savedA3.length > 0) {
                    const questions: A3Question[] = savedA3.map(r => ({
                        subcategory: r.subcategory,
                        label: r.subcategory === 'A3.1' ? 'Git Básico' :
                            r.subcategory === 'A3.2' ? 'Scripting' :
                                r.subcategory === 'A3.3' ? 'Gestión ITSM' : 'Documentación',
                        question: r.question,
                    }))
                    setA3Questions(questions)
                    setA3QuestionsGenerated(true)
                    const answers: Record<string, string> = {}
                    savedA3.forEach(r => { answers[r.subcategory] = r.answer })
                    setA3Answers(answers)
                    
                    const isA3Submitted = savedA3.every(r => (r.answer || '').trim().length > 0)
                    setA3Submitted(isA3Submitted)
                    
                    const aiResults = savedA3
                        .filter(r => r.ai_score !== null)
                        .map(r => ({ subcategory: r.subcategory, score: r.ai_score!, justification: r.ai_justification || '' }))
                    if (aiResults.length > 0) setA3AIResults(aiResults)

                    // Restore A3 commands if they exist
                    const { data: terminalData } = await supabase.from('dynamic_tests').select('candidate_response')
                        .eq('evaluation_id', evaluation.id).eq('test_type', 'TERMINAL_A3').maybeSingle()
                    if (terminalData?.candidate_response) {
                        try {
                            setA3Commands(JSON.parse(terminalData.candidate_response))
                        } catch (e) {
                            console.error('Error parsing A3 terminal commands:', e)
                        }
                    }
                }
            }
            setContextLoaded(true)
        }
        loadContext()
    }, [])

    // ===== A1 STATE =====
    const [a1Commands, setA1Commands] = useState<string[]>([])
    const [a1Questions, setA1Questions] = useState<A1Question[]>([])
    const [a1Answers, setA1Answers] = useState<Record<string, string>>({})
    const [a1QuestionsLoading, setA1QuestionsLoading] = useState(false)
    const [a1QuestionsGenerated, setA1QuestionsGenerated] = useState(false)
    const [a1Submitting, setA1Submitting] = useState(false)
    const [a1Submitted, setA1Submitted] = useState(false)
    const [a1AIResults, setA1AIResults] = useState<{ subcategory: string; score: number; justification: string }[] | null>(null)

    // ===== A2 STATE =====
    const [a2SelectedTool, setA2SelectedTool] = useState<string | null>(null)
    const [a2Questions, setA2Questions] = useState<A2Question[]>([])
    const [a2Answers, setA2Answers] = useState<Record<string, string>>({})
    const [a2QuestionsLoading, setA2QuestionsLoading] = useState(false)
    const [a2QuestionsGenerated, setA2QuestionsGenerated] = useState(false)
    const [a2Submitting, setA2Submitting] = useState(false)
    const [a2Submitted, setA2Submitted] = useState(false)
    const [a2AIResults, setA2AIResults] = useState<{ subcategory: string; score: number; justification: string }[] | null>(null)

    // ===== A3 STATE =====
    const [a3Commands, setA3Commands] = useState<string[]>([])
    const [a3Questions, setA3Questions] = useState<A3Question[]>([])
    const [a3Answers, setA3Answers] = useState<Record<string, string>>({})
    const [a3QuestionsLoading, setA3QuestionsLoading] = useState(false)
    const [a3QuestionsGenerated, setA3QuestionsGenerated] = useState(false)
    const [a3Submitting, setA3Submitting] = useState(false)
    const [a3Submitted, setA3Submitted] = useState(false)
    const [a3AIResults, setA3AIResults] = useState<{ subcategory: string; score: number; justification: string }[] | null>(null)

    // Generate A1 education-adaptive questions
    const handleGenerateA1Questions = useCallback(async () => {
        setA1QuestionsLoading(true)
        setA1QuestionsGenerated(true)
        try {
            const questions = await generateQuestionsA1(educationLevel)
            setA1Questions(questions)
            // Initialize answers map
            const initialAnswers: Record<string, string> = {}
            questions.forEach(q => { initialAnswers[q.subcategory] = '' })
            setA1Answers(initialAnswers)

            if (evaluationId) {
                await saveA1QuestionsOnly(evaluationId, questions)
            }
        } catch {
            setA1Questions([])
        } finally {
            setA1QuestionsLoading(false)
        }
    }, [educationLevel, evaluationId])

    // Save A1 answers → DB → AI evaluation
    const handleSubmitA1 = useCallback(async () => {
        if (!evaluationId) return
        setA1Submitting(true)
        try {
            const qa = a1Questions.map(q => ({
                subcategory: q.subcategory,
                label: q.label,
                question: q.question,
                answer: a1Answers[q.subcategory] || '',
            }))
            const result = await saveA1Responses(evaluationId, qa)
            if (result.success) {
                setA1Submitted(true)
                if (result.evaluations) setA1AIResults(result.evaluations)
            }
        } catch (e) {
            console.error('Error submitting A1:', e)
        } finally {
            setA1Submitting(false)
        }
    }, [evaluationId, a1Questions, a1Answers])

    // Generate A2 questions based on selected tool
    const handleSelectTool = useCallback(async (tool: string) => {
        setA2SelectedTool(tool)
        setA2QuestionsLoading(true)
        try {
            const questions = await generateQuestionsA2(tool, educationLevel)
            setA2Questions(questions)
            setA2QuestionsGenerated(true)
            const initialAnswers: Record<string, string> = {}
            questions.forEach(q => { initialAnswers[q.subcategory] = '' })
            setA2Answers(initialAnswers)

            if (evaluationId) {
                await saveA2QuestionsOnly(evaluationId, tool, questions)
            }
        } catch {
            setA2Questions([])
        } finally {
            setA2QuestionsLoading(false)
        }
    }, [educationLevel, evaluationId])

    // Save A2 answers → DB → AI evaluation
    const handleSubmitA2 = useCallback(async () => {
        if (!evaluationId || !a2SelectedTool) return
        setA2Submitting(true)
        try {
            const qa = a2Questions.map(q => ({
                subcategory: q.subcategory,
                label: q.label,
                question: q.question,
                answer: a2Answers[q.subcategory] || '',
            }))
            const result = await saveA2Responses(evaluationId, a2SelectedTool, qa)
            if (result.success) {
                setA2Submitted(true)
                if (result.evaluations) setA2AIResults(result.evaluations)
            }
        } catch (e) {
            console.error('Error submitting A2:', e)
        } finally {
            setA2Submitting(false)
        }
    }, [evaluationId, a2Questions, a2Answers, a2SelectedTool])

    // Generate A3 questions
    const handleGenerateA3Questions = useCallback(async () => {
        setA3QuestionsLoading(true)
        try {
            const questions = await generateQuestionsA3(educationLevel)
            setA3Questions(questions)
            setA3QuestionsGenerated(true)
            const initialAnswers: Record<string, string> = {}
            questions.forEach(q => {
                if (q.subcategory === 'A3.3') {
                    initialAnswers[q.subcategory] = `Número de Ticket: [AUTO-SETI-2026-001]\nTítulo: \nPrioridad: \nCategoría: \nDescripción del problema: \nPasos iniciales de revisión: `
                } else {
                    initialAnswers[q.subcategory] = ''
                }
            })
            setA3Answers(initialAnswers)

            if (evaluationId) {
                await saveA3QuestionsOnly(evaluationId, questions, initialAnswers)
            }
        } catch (e) {
            console.error('Error generating A3 questions:', e)
            setA3Questions([])
            setA3QuestionsGenerated(false)
        } finally {
            setA3QuestionsLoading(false)
        }
    }, [educationLevel, evaluationId])

    // Save A3 answers → DB → AI evaluation
    const handleSubmitA3 = useCallback(async () => {
        if (!evaluationId) return
        setA3Submitting(true)
        try {
            const qa = a3Questions.map(q => ({
                subcategory: q.subcategory,
                label: q.label,
                question: q.question,
                answer: a3Answers[q.subcategory] || '',
            }))
            const result = await saveA3Responses(evaluationId, qa, a3Commands)
            if (result.success) {
                setA3Submitted(true)
                if (result.evaluations) setA3AIResults(result.evaluations)
            }
        } catch (e) {
            console.error('Error submitting A3:', e)
        } finally {
            setA3Submitting(false)
        }
    }, [evaluationId, a3Questions, a3Answers, a3Commands])

    const allA1Answered = a1Questions.length > 0 && a1Questions.every(q => (a1Answers[q.subcategory] || '').trim().length > 0)



    return (
        <div className="space-y-6">
            {/* Candidate Identity Header */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                        <NextImage src="/icons/user.png" alt="Candidato" width={48} height={48} className="object-cover" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">{candidateName || 'Candidato'}</h2>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {candidateEmail}</span>
                            {educationLevel && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-semibold text-secondary-foreground border border-border">
                                    <GraduationCap className="h-3 w-3" /> {EDUCATION_LABELS[educationLevel] || educationLevel}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary drop-shadow-sm">
                    Evaluación de Competencias Técnicas
                </h1>
                <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
                    Completa cada sección en orden. Tu evaluador puede ver tu pantalla.
                </p>
            </div>

            <Tabs defaultValue="a1" className="w-full">
                <TabsList className="grid w-full grid-cols-6 h-12 bg-muted/50 p-1 mb-6">
                    <TabsTrigger value="a1" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                        <Terminal className="h-4 w-4 hidden sm:block" /> A1: Infra
                    </TabsTrigger>
                    <TabsTrigger value="a2" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                        <HelpCircle className="h-4 w-4 hidden sm:block" /> A2: Observ.
                    </TabsTrigger>
                    <TabsTrigger value="a3" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                        <GitBranch className="h-4 w-4 hidden sm:block" /> A3: Git
                    </TabsTrigger>
                    <TabsTrigger value="a4" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                        <Bot className="h-4 w-4 hidden sm:block text-rose-600" /> A4: Caso
                    </TabsTrigger>
                    <TabsTrigger value="b1" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                        <FileText className="h-4 w-4 hidden sm:block" /> B1: Ticket
                    </TabsTrigger>
                    <TabsTrigger value="ia2" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 hidden sm:block text-indigo-500 group-data-[state=active]:text-indigo-200" /> Dim. D
                    </TabsTrigger>
                </TabsList>

                {/* ===== A1: Linux Terminal + 5 Per-Subcategory Questions ===== */}
                <TabsContent value="a1" className="space-y-6">
                    <A1Tab
                        a1QuestionsGenerated={a1QuestionsGenerated}
                        a1QuestionsLoading={a1QuestionsLoading}
                        a1Questions={a1Questions}
                        a1Answers={a1Answers}
                        setA1Answers={setA1Answers}
                        a1Submitted={a1Submitted}
                        a1Submitting={a1Submitting}
                        evaluationId={evaluationId}
                        allA1Answered={allA1Answered}
                        setA1Commands={setA1Commands}
                        handleGenerateA1Questions={handleGenerateA1Questions}
                        handleSubmitA1={handleSubmitA1}
                    />
                </TabsContent>

                {/* ===== A2: Observability Questions ===== */}
                <TabsContent value="a2" className="space-y-6">
                    <A2Tab
                        a2SelectedTool={a2SelectedTool}
                        a2Submitted={a2Submitted}
                        a2QuestionsLoading={a2QuestionsLoading}
                        a2QuestionsGenerated={a2QuestionsGenerated}
                        a2Questions={a2Questions}
                        a2Answers={a2Answers}
                        setA2Answers={setA2Answers}
                        a2Submitting={a2Submitting}
                        evaluationId={evaluationId}
                        handleSelectTool={handleSelectTool}
                        handleSubmitA2={handleSubmitA2}
                    />
                </TabsContent>

                {/* ===== A3: Herramientas y Automatización ===== */}
                <TabsContent value="a3" className="space-y-6">
                    <A3Tab
                        a3QuestionsGenerated={a3QuestionsGenerated}
                        a3QuestionsLoading={a3QuestionsLoading}
                        a3Questions={a3Questions}
                        a3Answers={a3Answers}
                        setA3Answers={setA3Answers}
                        a3Submitted={a3Submitted}
                        a3Submitting={a3Submitting}
                        evaluationId={evaluationId}
                        setA3Commands={setA3Commands}
                        handleGenerateA3Questions={handleGenerateA3Questions}
                        handleSubmitA3={handleSubmitA3}
                    />
                </TabsContent>

                {/* ===== A4: Chatbot Case ===== */}
                <TabsContent value="a4" className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <NextImage src="/icons/AIAgent.png" alt="IA" width={40} height={40} />
                            A4. Pensamiento Analítico Técnico
                        </h2>
                        <p className="text-muted-foreground text-sm mb-4">
                            Lee el caso práctico y usa la consola de investigación para buscar logs, métricas y datos que te ayuden a entender la causa raíz del incidente.
                        </p>
                        <ChatbotA4 evaluationId={evaluationId} />
                    </div>
                </TabsContent>

                {/* ===== B1: Ticket Editor ===== */}
                <TabsContent value="b1" className="space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            B1. Comunicación Técnica Escrita
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Lee el escenario del incidente con atención. Tienes entre 15 y 20 minutos para documentar el ticket como si lo fueras a ingresar en GLPI.
                        </p>
                        <TicketEditor evaluationId={evaluationId} />
                    </div>
                </TabsContent>

                {/* ===== Dimensión D: IA-2 Prompt ===== */}
                <TabsContent value="ia2" className="space-y-6">
                    <div className="space-y-4">
                        {evaluationId && <PromptEditorIA2 evaluationId={evaluationId} />}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
