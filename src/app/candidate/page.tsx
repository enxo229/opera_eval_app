'use client'

import { useState, useCallback, useEffect } from 'react'
import NextImage from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TerminalSandbox } from '@/components/candidate/TerminalSandbox'
import { QuestionPanel } from '@/components/candidate/QuestionPanel'
import { ChatbotA4 } from '@/components/candidate/ChatbotA4'
import { TicketEditor } from '@/components/candidate/TicketEditor'
import { PromptEditorIA2 } from '@/components/candidate/PromptEditorIA2'
import { Button } from '@/components/ui/button'
import {
    generateQuestionsA1,
    generateQuestionsA2,
    generateQuestionsA3,
    A1Question,
    A2Question,
    A3Question,
} from '@/app/actions/ai'
import { saveA1Responses, getA1Results, saveA2Responses, getA2Results, saveA3Responses, getA3Results } from '@/app/actions/candidate'
import { createClient } from '@/lib/supabase/client'
import { Terminal, HelpCircle, GitBranch, Bot, FileText, Loader2, CheckCircle2, Sparkles, User, Mail, GraduationCap } from 'lucide-react'

// A2 tool options
const TOOL_OPTIONS = [
    { value: 'Grafana', label: 'Grafana' },
    { value: 'Elasticsearch/Kibana', label: 'Elasticsearch / Kibana' },
    { value: 'Zabbix', label: 'Zabbix' },
    { value: 'Dynatrace', label: 'Dynatrace' },
    { value: 'Datadog', label: 'Datadog' },
    { value: 'Otra herramienta de monitoreo', label: 'Otra' },
]

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

            // Get or create evaluation
            const { data: evaluation } = await supabase
                .from('evaluations')
                .select('id')
                .eq('candidate_id', user.id)
                .limit(1)
                .single()
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
                    setA1Submitted(true)
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
                    setA2Submitted(true)
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
                    setA3Submitted(true)
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
        } catch {
            setA1Questions([])
        } finally {
            setA1QuestionsLoading(false)
        }
    }, [educationLevel])

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
        } catch {
            setA2Questions([])
        } finally {
            setA2QuestionsLoading(false)
        }
    }, [educationLevel])

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
        } catch (e) {
            console.error('Error generating A3 questions:', e)
            setA3Questions([])
            setA3QuestionsGenerated(false)
        } finally {
            setA3QuestionsLoading(false)
        }
    }, [educationLevel])

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

    const EDUCATION_LABELS: Record<string, string> = {
        bachiller: 'Bachiller',
        tecnico_sena: 'Técnico SENA',
        tecnologo: 'Tecnólogo',
        profesional: 'Profesional / Ingeniería',
    }

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
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                            <Terminal className="h-5 w-5 text-primary" />
                            A1. Fundamentos de Infraestructura y Sistemas
                        </h2>
                        <p className="text-muted-foreground text-sm mb-4">
                            Usa la terminal para demostrar tu manejo de entornos Linux. Intenta tareas como: consultar tu usuario activo y el nombre del host, mostrar en qué ruta te encuentras, ir al directorio raíz y listar su contenido, o revisar los procesos del sistema.
                            Escribe <code className="bg-muted px-1 rounded">help</code> para ver los comandos disponibles.
                        </p>
                        <TerminalSandbox mode="A1" onCommandsChange={setA1Commands} />
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        {!a1QuestionsGenerated ? (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground mb-4">Cuando termines con la terminal, genera las preguntas para completar la sección A1.</p>
                                <Button onClick={handleGenerateA1Questions} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    Generar Preguntas A1
                                </Button>
                            </div>
                        ) : a1QuestionsLoading ? (
                            <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="font-medium">Generando preguntas adaptadas a tu perfil...</span>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" /> Preguntas — Infraestructura y Sistemas
                                    {a1Submitted && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                </h3>

                                {a1Questions.map((q, i) => (
                                    <div key={q.subcategory} className="bg-secondary/30 border border-border rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                {q.subcategory}
                                            </span>
                                            <span className="text-xs font-semibold text-muted-foreground">{q.label}</span>
                                        </div>
                                        <p className="text-sm text-foreground">{q.question}</p>
                                        <textarea
                                            value={a1Answers[q.subcategory] || ''}
                                            onChange={(e) => setA1Answers(prev => ({ ...prev, [q.subcategory]: e.target.value }))}
                                            disabled={a1Submitted}
                                            placeholder="Escribe tu respuesta aquí..."
                                            className="w-full min-h-[80px] p-3 rounded-md border border-border bg-card text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                                        />
                                    </div>
                                ))}

                                {!a1Submitted ? (
                                    <Button
                                        onClick={handleSubmitA1}
                                        disabled={!allA1Answered || a1Submitting || !evaluationId}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
                                    >
                                        {a1Submitting ? (
                                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando y evaluando...</>
                                        ) : !evaluationId ? (
                                            'No hay evaluación activa — contacta al evaluador'
                                        ) : (
                                            'Guardar Respuestas A1'
                                        )}
                                    </Button>
                                ) : (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg text-center">
                                        <p className="font-bold text-lg">✅ Respuestas A1 guardadas correctamente</p>
                                        <p className="text-sm mt-1">Tu evaluador ya puede ver tus respuestas.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* ===== A2: Observability Questions ===== */}
                <TabsContent value="a2" className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-primary" />
                            A2. Observabilidad y Monitoreo
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Selecciona la herramienta de observabilidad que mejor conozcas. Las preguntas se adaptarán a tu experiencia.
                        </p>

                        {!a2SelectedTool ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {TOOL_OPTIONS.map(tool => (
                                    <button
                                        key={tool.value}
                                        onClick={() => handleSelectTool(tool.value)}
                                        disabled={a2Submitted}
                                        className="p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-md transition-all text-center font-medium text-foreground disabled:opacity-50"
                                    >
                                        {tool.label}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-4">
                                    🔧 Herramienta seleccionada: {a2SelectedTool}
                                </div>

                                {a2QuestionsLoading ? (
                                    <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="font-medium">Generando preguntas personalizadas para {a2SelectedTool}...</span>
                                    </div>
                                ) : a2QuestionsGenerated && a2Questions.length > 0 ? (
                                    <div className="space-y-4">
                                        {a2Questions.map(q => (
                                            <div key={q.subcategory} className="space-y-2 bg-secondary/30 border border-border rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-bold">{q.subcategory}</span>
                                                    <span className="text-sm font-semibold text-foreground">{q.label}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{q.question}</p>
                                                <textarea
                                                    value={a2Answers[q.subcategory] || ''}
                                                    onChange={(e) => setA2Answers(prev => ({ ...prev, [q.subcategory]: e.target.value }))}
                                                    disabled={a2Submitted}
                                                    placeholder="Escribe tu respuesta aquí..."
                                                    className="w-full min-h-[80px] p-3 rounded-md border border-border bg-card text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                                                />
                                            </div>
                                        ))}

                                        {!a2Submitted ? (
                                            <Button
                                                onClick={handleSubmitA2}
                                                disabled={a2Submitting || !evaluationId || a2Questions.some(q => !(a2Answers[q.subcategory] || '').trim())}
                                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                            >
                                                {a2Submitting ? (
                                                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando y evaluando...</>
                                                ) : (
                                                    'Guardar Respuestas A2'
                                                )}
                                            </Button>
                                        ) : (
                                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg text-center">
                                                <p className="font-bold text-lg">✅ Respuestas A2 guardadas correctamente</p>
                                                <p className="text-sm mt-1">Tu evaluador ya puede ver tus respuestas.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                </TabsContent>

                {/* ===== A3: Herramientas y Automatización ===== */}
                <TabsContent value="a3" className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-primary" />
                            A3. Herramientas y Automatización Básica
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Responde las preguntas sobre Git, scripting, gestión de tickets y documentación.
                        </p>

                        {!a3QuestionsGenerated ? (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground mb-4">Genera las preguntas para la sección A3.</p>
                                <Button onClick={handleGenerateA3Questions} disabled={a3QuestionsLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    {a3QuestionsLoading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generando preguntas...</>
                                    ) : (
                                        <><Sparkles className="h-4 w-4 mr-2" /> Generar Preguntas A3</>
                                    )}
                                </Button>
                            </div>
                        ) : a3QuestionsLoading ? (
                            <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="font-medium">Generando preguntas...</span>
                            </div>
                        ) : a3Questions.length > 0 ? (
                            <div className="space-y-6">
                                <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                                    <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                                        <Terminal className="h-4 w-4" /> Live Demo: Sandbox Git & CLI
                                    </h3>
                                    <TerminalSandbox mode="A3" onCommandsChange={setA3Commands} />
                                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                                        * Usa esta terminal si tu evaluador solicita una demostración práctica de comandos.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {a3Questions.map(q => (
                                        <div key={q.subcategory} className="space-y-2 bg-secondary/30 border border-border rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-bold">{q.subcategory}</span>
                                                <span className="text-sm font-semibold text-foreground">{q.label}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{q.question}</p>
                                            <textarea
                                                value={a3Answers[q.subcategory] || ''}
                                                onChange={(e) => setA3Answers(prev => ({ ...prev, [q.subcategory]: e.target.value }))}
                                                disabled={a3Submitted}
                                                placeholder="Escribe tu respuesta aquí..."
                                                className="w-full min-h-[80px] p-3 rounded-md border border-border bg-card text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                                            />
                                        </div>
                                    ))}

                                    {!a3Submitted ? (
                                        <Button
                                            onClick={handleSubmitA3}
                                            disabled={a3Submitting || !evaluationId || a3Questions.some(q => !(a3Answers[q.subcategory] || '').trim())}
                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                        >
                                            {a3Submitting ? (
                                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando y evaluando...</>
                                            ) : (
                                                'Guardar Respuestas A3'
                                            )}
                                        </Button>
                                    ) : (
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg text-center">
                                            <p className="font-bold text-lg">✅ Respuestas A3 guardadas correctamente</p>
                                            <p className="text-sm mt-1">Tu evaluador ya puede ver tus respuestas.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
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
