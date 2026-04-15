import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CompanyLogo } from '@/components/CompanyLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
    ArrowLeft, 
    Printer, 
    Download, 
    Sparkles, 
    Target, 
    ShieldAlert, 
    MessageSquareQuote,
    ClipboardCheck,
    CheckCircle2,
    Calendar,
    Mail,
    FileText
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/evaluator/CopyButton'
import { PrintReportButton } from '@/components/evaluator/PrintReportButton'
import { RegenerateAIButton } from '@/components/evaluator/RegenerateAIButton'

const ID_TYPE_LABELS: Record<string, string> = {
    'CC': 'Cédula de Ciudadanía',
    'CE': 'Cédula de Extranjería',
    'TI': 'Tarjeta de Identidad',
    'PPT': 'Permiso Protección Temporal',
    'Pasaporte': 'Pasaporte',
}

export default async function EvaluationReportPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch Evaluation with all related data
    const { data: evaluation, error } = await supabase
        .from('evaluations')
        .select(`
            *,
            profiles:candidate_id (full_name, national_id, national_id_type, education_level, created_at),
            selection_processes (team, observations),
            dimension_scores (*),
            dynamic_tests (*)
        `)
        .eq('id', id)
        .single<any>()

    if (error || !evaluation || evaluation.status !== 'completed') {
        redirect('/evaluator/history')
    }

    const profile = evaluation.profiles
    const scores = (evaluation.dimension_scores as any[]) || []
    const tests = (evaluation.dynamic_tests as any[]) || []
    const aiFeedback = evaluation.final_feedback_ai as any

    // Fetch candidate email from auth.users via RPC
    const { data: emailData } = await supabase.rpc('get_user_email', { user_id: evaluation.candidate_id })
    const candidateEmail = emailData || 'N/A'

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Actions */}
            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <Link href="/evaluator/history">
                        <Button variant="outline" size="sm" className="gap-2 border-border shadow-sm">
                            <ArrowLeft className="h-4 w-4" /> Volver al Historial
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-border mx-2" />
                    <CompanyLogo width={90} height={30} />
                </div>
                <div className="flex items-center gap-3">
                    <PrintReportButton />
                </div>
            </div>

            {/* Main Report Container */}
            <Card className="border-border shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm print:border-none print:shadow-none">
                {/* Header Decoration */}
                <div className="h-2 w-full bg-gradient-to-r from-primary via-indigo-500 to-amber-500" />
                
                <CardContent className="p-10 space-y-10">
                    {/* Title & Badge */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-primary uppercase font-sans">Informe Ejecutivo de Evaluación</h1>
                            <p className="text-muted-foreground mt-2 text-lg">SkillFlow Platform — Proceso de Selección Técnica</p>
                        </div>
                        <div className="text-right">
                            <div className="text-5xl font-black font-mono tracking-tighter" style={{ color: evaluation.final_score >= 80 ? '#10B981' : evaluation.final_score >= 60 ? '#F59E0B' : '#EF4444' }}>
                                {evaluation.final_score}
                                <span className="text-xl text-muted-foreground ml-1">/100</span>
                            </div>
                            <Badge className="mt-2 px-4 py-1.5 text-sm font-bold uppercase tracking-wider shadow-sm" style={{ backgroundColor: evaluation.final_score >= 80 ? '#10B981' : evaluation.final_score >= 60 ? '#F59E0B' : '#EF4444' }}>
                                {evaluation.classification}
                            </Badge>
                        </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* Candidate Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Candidato
                            </p>
                            <p className="font-bold text-lg">{profile?.full_name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Mail className="h-3 w-3" /> Email de Contacto
                            </p>
                            <p className="font-mono text-sm">{candidateEmail}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Identificación
                            </p>
                            <p className="font-bold">
                                {profile?.national_id_type ? (ID_TYPE_LABELS[profile.national_id_type] || profile.national_id_type) : ''} {profile?.national_id}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Fecha del Proceso
                            </p>
                            <p className="font-bold">{new Date(evaluation.completed_at || evaluation.started_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* AI ANALYTICS SECTION */}
                    <div className="space-y-6 pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-6 w-6 text-amber-500 fill-amber-500/20" />
                                <h2 className="text-2xl font-black tracking-tight text-foreground uppercase italic underline decoration-amber-500 decoration-4 underline-offset-8">Análisis de Inteligencia Artificial</h2>
                            </div>
                            <RegenerateAIButton evaluationId={id} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Strengths & Gaps */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                                        <Target className="h-4 w-4" /> Fortalezas Detectadas
                                    </h3>
                                    <ul className="space-y-3">
                                        {aiFeedback?.fortalezas?.map((f: string, i: number) => (
                                            <li key={i} className="flex gap-3 text-sm leading-relaxed p-3 rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                                <span className="text-emerald-900 font-medium">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                                        <ShieldAlert className="h-4 w-4" /> Áreas de Mejora
                                    </h3>
                                    <ul className="space-y-3">
                                        {aiFeedback?.brechas?.map((b: string, i: number) => (
                                            <li key={i} className="flex gap-3 text-sm leading-relaxed p-3 rounded-lg bg-amber-50 border border-amber-100 shadow-sm">
                                                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                                <span className="text-amber-900 font-medium">{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Narrative Feedback */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <MessageSquareQuote className="h-4 w-4" /> Relato Narrativo (Feedback)
                                    </h3>
                                    <CopyButton text={aiFeedback?.final_narrative} />
                                </div>
                                <div className="relative p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 italic text-muted-foreground leading-relaxed shadow-inner min-h-[300px]">
                                    <p className="whitespace-pre-wrap">"{aiFeedback?.final_narrative}"</p>
                                    <div className="mt-8 flex items-center gap-2 pt-6 border-t border-indigo-100/50 non-italic">
                                        <ClipboardCheck className="h-4 w-4 text-indigo-500" />
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
                                            Tip: Puedes compartir este texto directamente con el candidato para enriquecer su feedback.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SCORES TABLE */}
                    <div className="space-y-6 pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-primary fill-primary/20" />
                            <h2 className="text-2xl font-black tracking-tight text-foreground uppercase italic underline decoration-primary decoration-4 underline-offset-8">Desglose por Dimensiones</h2>
                        </div>

                        <div className="rounded-xl border border-border overflow-hidden bg-background/50">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 font-black uppercase tracking-tight text-[10px]">Dimensión / Categoría</th>
                                        <th className="px-6 py-4 font-black uppercase tracking-tight text-[10px] text-center">Puntaje</th>
                                        <th className="px-6 py-4 font-black uppercase tracking-tight text-[10px]">Observaciones del Evaluador</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {[
                                        { dim: 'A', label: 'Técnica (Infra/Obs)', score: evaluation.score_a, max: 50 },
                                        { dim: 'B', label: 'Blandas (Comunicación)', score: evaluation.score_b, max: 30 },
                                        { dim: 'C', label: 'Cultural (Ajuste/Mentalidad)', score: evaluation.score_c, max: 20 },
                                    ].map(d => (
                                        <tr key={d.dim} className="bg-muted/5 font-bold border-b border-border/80">
                                            <td className="px-6 py-4 text-primary uppercase tracking-wide">{d.label}</td>
                                            <td className="px-6 py-4 text-center font-mono">{d.score} / {d.max}</td>
                                            <td className="px-6 py-4 text-xs italic text-muted-foreground italic">Puntaje consolidado de la dimensión</td>
                                        </tr>
                                    ))}
                                    {scores.filter((s:any) => s.category.includes('.') || s.category.startsWith('IA-')).map((s:any) => (
                                        <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-8 py-3 text-muted-foreground font-medium">{s.category}</td>
                                            <td className="px-6 py-3 text-center font-mono opacity-80">{s.raw_score}</td>
                                            <td className="px-6 py-3 text-xs leading-relaxed max-w-sm">{s.comments || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-10 border-t border-border/50 text-center space-y-2 opacity-50">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Opera Eval App — Reporte Generado por SkillFlow Engine</p>
                        <p className="text-[9px] font-medium tracking-tight">SETI S.A.S — Todos los derechos reservados © {new Date().getFullYear()}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
