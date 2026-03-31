'use client'

import NextImage from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChatbotA4 } from '@/components/candidate/ChatbotA4'
import { TicketEditor } from '@/components/candidate/TicketEditor'
import { PromptEditorIA2 } from '@/components/candidate/PromptEditorIA2'
import { A1Tab } from '@/components/candidate/tabs/A1Tab'
import { A2Tab } from '@/components/candidate/tabs/A2Tab'
import { A3Tab } from '@/components/candidate/tabs/A3Tab'
import { Terminal, HelpCircle, GitBranch, Bot, FileText, Sparkles, User, Mail, GraduationCap } from 'lucide-react'
import { EDUCATION_LABELS } from '@/lib/constants'

// Custom Hooks
import { useCandidateContext } from '@/hooks/useCandidateContext'
import { useA1State } from '@/hooks/useA1State'
import { useA2State } from '@/hooks/useA2State'
import { useA3State } from '@/hooks/useA3State'

export default function CandidateEvaluationFlow() {
    const ctx = useCandidateContext()
    const a1 = useA1State(ctx.educationLevel, ctx.evaluationId, ctx.restoredA1)
    const a2 = useA2State(ctx.educationLevel, ctx.evaluationId, ctx.restoredA2)
    const a3 = useA3State(ctx.educationLevel, ctx.evaluationId, ctx.restoredA3)

    return (
        <div className="space-y-6">
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
                        <ChatbotA4 evaluationId={ctx.evaluationId} />
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
                        <TicketEditor evaluationId={ctx.evaluationId} />
                    </div>
                </TabsContent>

                {/* ===== Dimensión D: IA-2 Prompt ===== */}
                <TabsContent value="ia2" className="space-y-6">
                    <div className="space-y-4">
                        {ctx.evaluationId && <PromptEditorIA2 evaluationId={ctx.evaluationId} />}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
