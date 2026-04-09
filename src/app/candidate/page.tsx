'use client'

import NextImage from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChatbotA4 } from '@/components/candidate/ChatbotA4'
import { TicketEditor } from '@/components/candidate/TicketEditor'
import { PromptEditorIA2 } from '@/components/candidate/PromptEditorIA2'
import { A1Tab } from '@/components/candidate/tabs/A1Tab'
import { A2Tab } from '@/components/candidate/tabs/A2Tab'
import { A3Tab } from '@/components/candidate/tabs/A3Tab'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Terminal, HelpCircle, GitBranch, Bot, FileText, Sparkles, Mail, GraduationCap, Loader2, Clock, CheckCircle2 } from 'lucide-react'
import { EDUCATION_LABELS } from '@/lib/constants'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Components
import { TimeUpOverlay } from '@/components/candidate/TimeUpOverlay'
import { PauseOverlay } from '@/components/candidate/PauseOverlay'
import { startEvaluationTimer, pauseEvaluation } from '@/app/actions/candidate/evaluation'

// Custom Hooks
import { useCandidateContext } from '@/context/CandidateContext'
import { useA1State } from '@/hooks/useA1State'
import { useA2State } from '@/hooks/useA2State'
import { useA3State } from '@/hooks/useA3State'

export default function CandidateEvaluationFlow() {
    const ctx = useCandidateContext()
    const router = useRouter()
    
    // States for local "Starting" animation
    const [isStartingTimer, setIsStartingTimer] = useState(false)

    const a1 = useA1State(ctx.educationLevel, ctx.evaluationId, ctx.restoredA1)
    const a2 = useA2State(ctx.educationLevel, ctx.evaluationId, ctx.restoredA2)
    const a3 = useA3State(ctx.educationLevel, ctx.evaluationId, ctx.restoredA3)

    // Completion states for tabs that don't export them via hooks
    const [a4Submitted, setA4Submitted] = useState(false)
    const [b1Submitted, setB1Submitted] = useState(false)
    const [d2Submitted, setD2Submitted] = useState(false)
    const [b2Submitted, setB2Submitted] = useState(false)
    const [cSubmitted, setCSubmitted] = useState(false)

    // Legal Guard
    useEffect(() => {
        if (ctx.contextLoaded && !ctx.legalAccepted) {
            router.push('/candidate/onboarding')
        }
    }, [ctx.contextLoaded, ctx.legalAccepted, router])

    // Auto-Pause Logic (Network & Visibility)
    useEffect(() => {
        // Only trigger auto-pause if evaluation has started, isn't already paused, and hasn't ended
        if (!ctx.evaluationId || !ctx.startedAt || ctx.isPaused || ctx.isTimeUp) return

        const triggerAutoPause = async () => {
            if (ctx.pauseCount >= 3) return

            const res = await pauseEvaluation(ctx.evaluationId!)
            if (res.success) {
                ctx.setPausedAt(new Date().toISOString())
                ctx.setPauseCount((prev: number) => prev + 1)
            }
        }

        const handleOffline = () => triggerAutoPause()
        const handleVisibility = () => { if (document.hidden) triggerAutoPause() }

        window.addEventListener('offline', handleOffline)
        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            window.removeEventListener('offline', handleOffline)
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [ctx.evaluationId, ctx.startedAt, ctx.isPaused, ctx.isTimeUp, ctx.pauseCount, ctx.setPausedAt, ctx.setPauseCount])

    const handleStartEvaluation = async () => {
        if (!ctx.evaluationId) return
        setIsStartingTimer(true)
        const result = await startEvaluationTimer(ctx.evaluationId)
        if (result.success && result.startedAt) {
            ctx.setStartedAt(result.startedAt)
        } else {
            alert('Error al iniciar la prueba. Por favor intenta de nuevo.')
        }
        setIsStartingTimer(false)
    }

    if (!ctx.contextLoaded || !ctx.legalAccepted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // 1. Ready to Start Interstitial — shown before the candidate clicks "Begin"
    if (!ctx.startedAt) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-lg w-full"
                >
                    <Card className="border-2 border-primary/20 shadow-xl">
                        <CardHeader className="text-center space-y-3 pb-4">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Clock className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-foreground">
                                ¿Listo para comenzar?
                            </CardTitle>
                            <CardDescription className="text-base">
                                Al hacer clic en el botón, el cronómetro de <strong>{ctx.testDuration} minutos</strong> comenzará a correr.
                                No podrás detenerlo excepto con las pausas disponibles.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">⚠️ Importante:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-xs ml-1">
                                    <li>Tienes <strong>{ctx.testDuration} minutos</strong> para completar todas las secciones.</li>
                                    <li>Dispones de <strong>máximo 3 pausas</strong> durante la prueba.</li>
                                    <li>Si cambias de pestaña o pierdes conexión, se activará una pausa automática.</li>
                                    <li>Asegúrate de tener una conexión estable antes de iniciar.</li>
                                </ul>
                            </div>
                            <Button
                                onClick={handleStartEvaluation}
                                disabled={isStartingTimer}
                                className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
                            >
                                {isStartingTimer ? (
                                    <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Iniciando...</>
                                ) : (
                                    '🚀 COMENZAR EVALUACIÓN'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        )
    }

    // 2. Global UI (Timer and Overlays are now in Header/Layout)
    return (
        <div className="relative">
            {/* Time Up Blocker */}
            {ctx.isTimeUp && <TimeUpOverlay />}

            <div className={`space-y-6 transition-all duration-500 ${ctx.isPaused ? 'opacity-0 scale-95 blur-xl pointer-events-none' : 'opacity-100 scale-100 blur-0'}`}>
                {/* Candidate Identity Header */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                            <NextImage src="/icons/user.png" alt="Candidato" width={48} height={48} className="object-cover" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">{ctx.candidateName || 'Candidato'}</h2>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {ctx.candidateEmail}</span>
                                {ctx.educationLevel && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-semibold text-secondary-foreground border border-border">
                                        <GraduationCap className="h-3 w-3" /> {EDUCATION_LABELS[ctx.educationLevel] || ctx.educationLevel}
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
                    <TabsList className="grid w-full grid-cols-8 h-12 bg-muted/50 p-1 mb-6">
                        <TabsTrigger value="a1" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                            <Terminal className="h-4 w-4 hidden sm:block" /> <span className="hidden sm:inline">A1</span><span className="sm:hidden">A1</span>
                            {a1.a1Submitted && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1 shrink-0" />}
                        </TabsTrigger>
                        <TabsTrigger value="a2" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                            <HelpCircle className="h-4 w-4 hidden sm:block" /> <span className="hidden sm:inline">A2</span><span className="sm:hidden">A2</span>
                            {a2.a2Submitted && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1 shrink-0" />}
                        </TabsTrigger>
                        <TabsTrigger value="a3" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                            <GitBranch className="h-4 w-4 hidden sm:block" /> <span className="hidden sm:inline">A3</span><span className="sm:hidden">A3</span>
                            {a3.a3Submitted && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1 shrink-0" />}
                        </TabsTrigger>
                        <TabsTrigger value="a4" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                            <Bot className="h-4 w-4 hidden sm:block text-rose-600" /> <span className="hidden sm:inline">A4</span><span className="sm:hidden">A4</span>
                            {a4Submitted && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1 shrink-0" />}
                        </TabsTrigger>
                        <TabsTrigger value="b1" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                            <FileText className="h-4 w-4 hidden sm:block" /> <span className="hidden sm:inline">B1</span><span className="sm:hidden">B1</span>
                            {b1Submitted && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1 shrink-0" />}
                        </TabsTrigger>
                        <TabsTrigger value="b2" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center px-1">
                            B2-B6
                            {b2Submitted && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1 shrink-0" />}
                        </TabsTrigger>
                        <TabsTrigger value="c" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center">
                            C
                            {cSubmitted && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1 shrink-0" />}
                        </TabsTrigger>
                        <TabsTrigger value="d" className="font-semibold text-xs sm:text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-1 flex items-center justify-center px-1">
                            <Sparkles className="h-4 w-4 hidden sm:block text-indigo-500 group-data-[state=active]:text-indigo-200" /> Dim. D
                            {d2Submitted && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1 shrink-0" />}
                        </TabsTrigger>
                    </TabsList>

                    {/* ===== A1: Linux Terminal + 5 Per-Subcategory Questions ===== */}
                    <TabsContent value="a1" className="space-y-6">
                        <A1Tab
                            a1QuestionsGenerated={a1.a1QuestionsGenerated}
                            a1QuestionsLoading={a1.a1QuestionsLoading}
                            a1Questions={a1.a1Questions}
                            a1Answers={a1.a1Answers}
                            setA1Answers={a1.setA1Answers}
                            a1Submitted={a1.a1Submitted}
                            a1Submitting={a1.a1Submitting}
                            evaluationId={ctx.evaluationId}
                            allA1Answered={a1.allA1Answered}
                            setA1Commands={a1.setA1Commands}
                            handleGenerateA1Questions={a1.handleGenerateA1Questions}
                            handleSubmitA1={a1.handleSubmitA1}
                        />
                    </TabsContent>

                    {/* ===== A2: Observability Questions ===== */}
                    <TabsContent value="a2" className="space-y-6">
                        <A2Tab
                            a2SelectedTool={a2.a2SelectedTool}
                            a2Submitted={a2.a2Submitted}
                            a2QuestionsLoading={a2.a2QuestionsLoading}
                            a2QuestionsGenerated={a2.a2QuestionsGenerated}
                            a2Questions={a2.a2Questions}
                            a2Answers={a2.a2Answers}
                            setA2Answers={a2.setA2Answers}
                            a2Submitting={a2.a2Submitting}
                            evaluationId={ctx.evaluationId}
                            handleSelectTool={a2.handleSelectTool}
                            handleSubmitA2={a2.handleSubmitA2}
                        />
                    </TabsContent>

                    {/* ===== A3: Herramientas y Automatización ===== */}
                    <TabsContent value="a3" className="space-y-6">
                        <A3Tab
                            a3QuestionsGenerated={a3.a3QuestionsGenerated}
                            a3QuestionsLoading={a3.a3QuestionsLoading}
                            a3Questions={a3.a3Questions}
                            a3Answers={a3.a3Answers}
                            setA3Answers={a3.setA3Answers}
                            a3Submitted={a3.a3Submitted}
                            a3Submitting={a3.a3Submitting}
                            evaluationId={ctx.evaluationId}
                            setA3Commands={a3.setA3Commands}
                            handleGenerateA3Questions={a3.handleGenerateA3Questions}
                            handleSubmitA3={a3.handleSubmitA3}
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
                            <ChatbotA4 evaluationId={ctx.evaluationId} onStatusChange={setA4Submitted} />
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
                                Lee el escenario del incidente con atención y documenta el ticket como si lo fueras a ingresar en GLPI o JIRA.
                            </p>
                            <TicketEditor evaluationId={ctx.evaluationId} onComplete={() => setB1Submitted(true)} />
                        </div>
                    </TabsContent>

                    {/* ===== B2-B6: Habilidades Blandas Síncronas ===== */}
                    <TabsContent value="b2" className="space-y-6">
                        <Card className="border border-indigo-200 shadow-md bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:border-indigo-800/30">
                            <CardHeader className="text-center pb-4 pt-8">
                                <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 dark:bg-indigo-900/50">
                                    <HelpCircle className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">Evaluación Sincrónica (B2-B6)</CardTitle>
                                <CardDescription className="text-base mt-2 max-w-xl mx-auto dark:text-indigo-200">
                                    Esta sección mide tus habilidades blandas (adaptabilidad, autonomía, etc.). Se realiza a través de preguntas de situación ("Roleplay") mediante entrevista.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center pb-8 border-t border-indigo-100 dark:border-indigo-800/30 pt-6 mt-4">
                                <p className="font-bold text-lg text-indigo-700 dark:text-indigo-300 mb-6">
                                    ✋ ¡Alto! Por favor, indica a tu líder técnico/evaluador que has llegado a este punto para que dirija las preguntas.
                                </p>
                                <Button 
                                    onClick={() => setB2Submitted(true)}
                                    disabled={b2Submitted}
                                    className={`font-semibold transition-all ${b2Submitted ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                >
                                    {b2Submitted ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Sección B2-B6 Completada</> : 'Marcar sección como completada'}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ===== C: Cultura ===== */}
                    <TabsContent value="c" className="space-y-6">
                        <Card className="border border-teal-200 shadow-md bg-gradient-to-br from-teal-50/50 to-white dark:from-teal-950/20 dark:border-teal-800/30">
                            <CardHeader className="text-center pb-4 pt-8">
                                <div className="mx-auto w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4 dark:bg-teal-900/50">
                                    <Sparkles className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-teal-900 dark:text-teal-100">C. Evaluación Cultural</CardTitle>
                                <CardDescription className="text-base mt-2 max-w-xl mx-auto dark:text-teal-200">
                                    Queremos conocer tus motivaciones, cómo trabajas en equipo y qué te apasiona de este posible nuevo rol.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center pb-8 border-t border-teal-100 dark:border-teal-800/30 pt-6 mt-4">
                                <p className="font-bold text-lg text-teal-700 dark:text-teal-300 mb-6">
                                    ✋ ¡Alto! Esta sección es un diálogo abierto. Avísale a tu evaluador que ya puedes comenzar la charla cultural.
                                </p>
                                <Button 
                                    onClick={() => setCSubmitted(true)}
                                    disabled={cSubmitted}
                                    className={`font-semibold transition-all ${cSubmitted ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}
                                >
                                    {cSubmitted ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Sección C Completada</> : 'Marcar sección como completada'}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ===== Dimensión D: IA ===== */}
                    <TabsContent value="d" className="space-y-6">
                        {/* Indicación para D1 */}
                        <Card className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 mb-6">
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                                    <Bot className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-amber-900 dark:text-amber-100">D1: Comprensión de IA (Sincrónica)</h3>
                                    <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                                        Antes de hacer el ejercicio escrito a continuación, el evaluador te hará un par de preguntas conceptuales rápidas sobre Inteligencia Artificial. Infórmale que estás listo.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Implementación real de D2 */}
                        <div className="space-y-4">
                            {ctx.evaluationId && <PromptEditorIA2 evaluationId={ctx.evaluationId} onStatusChange={setD2Submitted} />}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
