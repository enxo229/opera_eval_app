import { createClient } from '@/lib/supabase/server'
import { CompanyLogo } from '@/components/CompanyLogo'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NextImage from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Mail, Calendar, CheckCircle2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DimensionAEvaluation } from '@/components/evaluator/DimensionAEvaluation'
import { DimensionBEvaluation } from '@/components/evaluator/DimensionBEvaluation'
import { DimensionCEvaluation } from '@/components/evaluator/DimensionCEvaluation'
import { DimensionDEvaluation } from '@/components/evaluator/DimensionDEvaluation'
import { FinalScoreCard } from '@/components/evaluator/FinalScoreCard'
import { TimerAdjuster } from '@/components/evaluator/TimerAdjuster'
import { ScrollToTopButton } from '@/components/evaluator/ScrollToTopButton'
export default async function EvaluateCandidatePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // 1. Fetch Candidate Profile
    const { data: candidate, error: candidateError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'candidate')
        .single<any>()

    if (candidateError || !candidate) {
        redirect('/evaluator') // Redirect back if invalid candidate
    }

    // Fetch candidate email from auth.users via RPC
    const { data: emailData } = await supabase.rpc('get_user_email', { user_id: id })
    const candidateEmail = emailData || candidate.id

    // 2. Fetch Active Evaluation for this candidate
    let evaluation: any = null

    // Try finding via active process first
    const { data: activeProcess } = await supabase
        .from('selection_processes')
        .select('id, evaluations(*)')
        .eq('candidate_email', candidateEmail)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()

    if (activeProcess?.evaluations && activeProcess.evaluations.length > 0) {
        evaluation = activeProcess.evaluations[0]
    } else {
        // Fallback: look up by candidate_id in case it's a legacy record without process
        const { data: legacyEval } = await supabase
            .from('evaluations')
            .select('*')
            .eq('candidate_id', candidate.id)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle()
        evaluation = legacyEval
    }

    if (!evaluation) {
        const { data: authCtx, error: authErr } = await supabase.auth.getUser()
        if (!authErr && authCtx.user) {
            // Automatically start an active process for them
            const { data: newProc } = await supabase
                .from('selection_processes')
                .insert({
                    candidate_email: candidateEmail,
                    candidate_national_id: candidate.national_id,
                    evaluator_id: authCtx.user.id,
                    status: 'active'
                })
                .select('id')
                .single()

            const { data: newEval } = await supabase
                .from('evaluations')
                .insert({
                    candidate_id: candidate.id,
                    evaluator_id: authCtx.user.id,
                    selection_process_id: newProc?.id,
                    status: 'draft'
                })
                .select('*')
                .single<any>()
            evaluation = newEval
        }
    }

    if (!evaluation) {
        return <div className="p-8 text-center text-red-500 font-bold">Error inicializando la evaluación. Asegúrate de tener procesos activos para el candidato.</div>
    }

    // 3. Fetch candidate's dynamic tests (A4 chat, B1 ticket)
    const { data: dynamicTestsResult } = await supabase
        .from('dynamic_tests')
        .select('*')
        .eq('evaluation_id', evaluation.id)

    // 4. Fetch existing dimension scores
    const { data: existingScoresResult } = await supabase
        .from('dimension_scores')
        .select('*')
        .eq('evaluation_id', evaluation.id)

    const dynamicTests = (dynamicTestsResult as any[]) || []
    const existingScores = (existingScoresResult as any[]) || []

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/evaluator">
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 border-border bg-card">
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </Link>
                    <div className="h-10 w-px bg-border mx-2" />
                    <CompanyLogo width={100} height={35} />
                    <div className="h-10 w-px bg-border mx-2" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-sm flex items-center gap-3">
                            Evaluar Candidato
                            {evaluation.status === 'completed' && (
                                <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-sans uppercase font-bold shadow-sm">Completado</span>
                            )}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg font-sans">
                            Revisa la telemetría del candidato (Tests Dinámicos) y asigna puntajes por dimensión.
                        </p>
                    </div>
                </div>
            </div>

            {/* Candidate Header Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center border-4 border-background shadow-md overflow-hidden">
                        <NextImage src="/icons/user.png" alt="Candidato" width={64} height={64} className="object-cover" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-foreground font-sans">{candidate.full_name || 'Candidato Sin Nombre'}</h2>
                        <div className="flex flex-wrap gap-4 text-sm font-mono text-muted-foreground">
                            <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {candidateEmail}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Registrado: {new Date(candidate.created_at).toLocaleDateString()}</span>
                            {candidate.education_level && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-semibold text-secondary-foreground border border-border">
                                    🎓 {candidate.education_level === 'bachiller' ? 'Bachiller' : candidate.education_level === 'tecnico_sena' ? 'Técnico SENA' : candidate.education_level === 'tecnologo' ? 'Tecnólogo' : 'Profesional/Ingeniería'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Score Widget */}
                {evaluation.status === 'completed' && (
                    <div className="text-right">
                        <div className="text-4xl font-black font-mono drop-shadow-sm" style={{ color: evaluation.final_score >= 80 ? '#10B981' : evaluation.final_score >= 60 ? '#F59E0B' : evaluation.final_score >= 40 ? '#F97316' : '#EF4444' }}>{evaluation.final_score} <span className="text-lg text-muted-foreground font-sans font-normal">/ 100</span></div>
                        <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mt-1">{evaluation.classification}</div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="overview" className="w-full">
                        {(() => {
                            const hasA = existingScores.some(s => s.dimension === 'A')
                            const hasB = existingScores.some(s => s.dimension === 'B')
                            const hasC = existingScores.some(s => s.dimension === 'C')
                            const hasD = existingScores.some(s => s.dimension === 'D')

                            return (
                                <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 p-1 mb-8">
                                    <TabsTrigger value="overview" className="font-semibold text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">Resumen</TabsTrigger>
                                    <TabsTrigger value="dimA" className="font-semibold text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all flex items-center justify-center gap-2">
                                        Dim. A (Técnica) {hasA && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                    </TabsTrigger>
                                    <TabsTrigger value="dimB" className="font-semibold text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all flex items-center justify-center gap-2">
                                        Dim. B (Blandas) {hasB && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                    </TabsTrigger>
                                    <TabsTrigger value="dimC" className="font-semibold text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all flex items-center justify-center gap-2">
                                        Dim. C (Cultural) {hasC && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                    </TabsTrigger>
                                    <TabsTrigger value="dimD" className="font-semibold text-sm h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all flex items-center justify-center gap-2">
                                        Dim. D (Uso IA) {hasD && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                    </TabsTrigger>
                                </TabsList>
                            )
                        })()}

                        <TabsContent value="overview" className="bg-card border border-border shadow-sm rounded-xl p-6 min-h-[400px]">
                            <h3 className="text-xl font-bold text-foreground mb-4">Instrucciones del Evaluador</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                Esta pantalla te permite registrar la calificación de los tres perfiles (Técnico, Entrevistador Blando, Entrevistador Cultural).
                                Asegúrate de haber completado las pruebas dinámicas antes interactuar con las dimensiones A y B, donde podrás encontrar las respuestas almacenadas del candidato.
                            </p>
                        </TabsContent>

                        <TabsContent value="dimA" className="m-0">
                            <div className="bg-card border border-border shadow-sm rounded-xl p-6 min-h-[400px]">
                                <DimensionAEvaluation evaluationId={evaluation.id} existingScores={existingScores} dynamicTests={dynamicTests} readOnly={evaluation.status === 'completed'} />
                            </div>
                        </TabsContent>

                        <TabsContent value="dimB" className="m-0">
                            <div className="bg-card border border-border shadow-sm rounded-xl p-6 min-h-[400px]">
                                <DimensionBEvaluation evaluationId={evaluation.id} existingScores={existingScores} dynamicTests={dynamicTests} readOnly={evaluation.status === 'completed'} />
                            </div>
                        </TabsContent>

                        <TabsContent value="dimC" className="m-0">
                            <div className="bg-card border border-border shadow-sm rounded-xl p-6 min-h-[400px]">
                                <DimensionCEvaluation evaluationId={evaluation.id} existingScores={existingScores} readOnly={evaluation.status === 'completed'} />
                            </div>
                        </TabsContent>

                        <TabsContent value="dimD" className="m-0">
                            <div className="bg-card border border-border shadow-sm rounded-xl p-6 min-h-[400px]">
                                <DimensionDEvaluation evaluationId={evaluation.id} existingScores={existingScores} readOnly={evaluation.status === 'completed'} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="lg:col-span-1 border-l border-border pl-8 space-y-8 sticky top-8">
                    <FinalScoreCard evaluation={evaluation} />
                    <TimerAdjuster 
                        evaluationId={evaluation.id} 
                        initialDuration={evaluation.test_duration_minutes || 60}
                        isStarted={!!evaluation.started_at}
                    />
                </div>
            </div>

            <ScrollToTopButton />
        </div>
    )
}
