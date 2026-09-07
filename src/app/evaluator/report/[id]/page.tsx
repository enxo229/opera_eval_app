import { Fragment } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CompanyLogo } from '@/components/CompanyLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
    ArrowLeft, 
    Sparkles, 
    Target, 
    ShieldAlert, 
    ShieldCheck,
    AlertTriangle,
    MessageSquareQuote,
    ClipboardCheck,
    CheckCircle2,
    Calendar,
    Mail,
    FileText,
    Eye,
    Info
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/evaluator/CopyButton'
import { PrintReportButton } from '@/components/evaluator/PrintReportButton'
import { RegenerateAIButton } from '@/components/evaluator/RegenerateAIButton'

const ID_TYPE_LABELS: Record<string, string> = {
    'CC': 'Cédula de Ciudadanía',
    'CE': 'Cédula de Extranjería',
    'TI': 'Tarjeta de Identidad',
    'PPT': 'Permiso por Protección Temporal',
    'PEP': 'Permiso Especial de Permanencia (PEP)',
    'Pasaporte': 'Pasaporte',
}

// Constants for report structured breakdown (General Track)
const DIM_A_SECTIONS = [
    {
        id: 'A1',
        title: 'A1. Linux & Fundamentos Cloud',
        items: [
            { id: 'A1.1', label: 'Linux Filesystem & Permisos', max: 3 },
            { id: 'A1.2', label: 'Linux Procesos & Systemctl', max: 3 },
            { id: 'A1.3', label: 'Linux Logs & Troubleshooting', max: 3 },
            { id: 'A1.4', label: 'Fundamentos Cloud Computing', max: 3 },
            { id: 'A1.5', label: 'AWS Core Services & Seguridad', max: 3 },
        ]
    },
    {
        id: 'A2',
        title: 'A2. Observabilidad & SRE',
        items: [
            { id: 'A2.1', label: 'Pilares de Observabilidad (Métricas, Logs, Trazas)', max: 3 },
            { id: 'A2.2', label: 'SRE Fundamentals (SLI, SLO, SLA, Error Budgets)', max: 3 },
            { id: 'A2.3', label: 'Dynatrace APM & IA Davis', max: 3 },
            { id: 'A2.4', label: 'Grafana Dashboards & Paneles', max: 3 },
            { id: 'A2.5', label: 'Interpretación de Alertas & Diagnóstico', max: 3 },
        ]
    },
    {
        id: 'A3',
        title: 'A3. Automatización, Datos & Git',
        items: [
            { id: 'A3.1', label: 'Control de Versiones Git (Branches, Commits)', max: 3 },
            { id: 'A3.2', label: 'Pandas: Carga y Filtrado de Series Temporales', max: 3 },
            { id: 'A3.3', label: 'Pandas: Agregaciones & Detección de Anomalías', max: 3 },
        ]
    },
    {
        id: 'A4',
        title: 'A4. Diagnóstico y Aislamiento de Incidentes',
        items: [
            { id: 'A4.1', label: 'Identificación de Fuentes de Información', max: 3 },
            { id: 'A4.2', label: 'Lógica de Investigación y Aislamiento', max: 3 },
            { id: 'A4.3', label: 'Diagnóstico Causa Raíz y Resolución', max: 3 },
        ]
    }
]

// Constants for report structured breakdown (OTel Expert Track)
const DIM_A_SECTIONS_OTEL = [
    {
        id: 'A1',
        title: 'A1. Arquitectura OTel & Componentes',
        items: [
            { id: 'A1.1', label: 'Arquitectura OTel & Contexto', max: 3 },
            { id: 'A1.2', label: 'Collector & OTTL Pipelines', max: 3 },
            { id: 'A1.3', label: 'Protocolo OTLP & Transportes', max: 3 },
            { id: 'A1.4', label: 'Profiling & eBPF Telemetry', max: 3 },
        ]
    },
    {
        id: 'A2',
        title: 'A2. Grafana Cloud & LGTM Stack',
        items: [
            { id: 'A2.1', label: 'Grafana Alloy Flow Mode', max: 3 },
            { id: 'A2.2', label: 'Mimir & Loki (PromQL/LogQL)', max: 3 },
            { id: 'A2.3', label: 'Tempo & Pyroscope (TraceQL/Profiling)', max: 3 },
        ]
    },
    {
        id: 'A3',
        title: 'A3. Pipelines, Muestreo & OTTL',
        items: [
            { id: 'A3.1', label: 'Análisis de Pipeline & Muestreo (tail_sampling)', max: 3 },
            { id: 'A3.2', label: 'Reglas OTTL & Procesamiento (transform processor)', max: 3 },
        ]
    },
    {
        id: 'A4',
        title: 'A4. Diagnóstico e Investigación en Vivo (Observabilidad)',
        items: [
            { id: 'A4.1', label: 'Identificación de Fuentes de Información', max: 3 },
            { id: 'A4.2', label: 'Lógica de Investigación y Aislamiento', max: 3 },
            { id: 'A4.3', label: 'Diagnóstico Causa Raíz y Resolución', max: 3 },
        ]
    }
]

const DIM_B_SECTIONS = [
    {
        id: 'B1',
        title: 'B1. Comunicación Técnica Escrita (Ticket de Incidente)',
        maxScore: 16,
        normMax: 10,
        items: [
            { id: 'B1.1', label: 'Estructura del registro', max: 4 },
            { id: 'B1.2', label: 'Precisión técnica', max: 4 },
            { id: 'B1.3', label: 'Acciones documentadas', max: 4 },
            { id: 'B1.4', label: 'Impacto descrito', max: 4 },
        ]
    },
    {
        id: 'B2',
        title: 'B2. Comunicación Verbal & Manejo de Stakeholders',
        maxScore: 16,
        normMax: 10,
        items: [
            { id: 'B2.1', label: 'Claridad del lenguaje hacia negocio', max: 4 },
            { id: 'B2.2', label: 'Estructura narrativa y cronología', max: 4 },
            { id: 'B2.3', label: 'Manejo de incertidumbre y honestidad técnica', max: 4 },
            { id: 'B2.4', label: 'Transmisión y contexto del impacto', max: 4 },
        ]
    },
    {
        id: 'B3',
        title: 'B3. Colaboración, Priorización y Manejo bajo Presión',
        maxScore: 12,
        normMax: 10,
        items: [
            { id: 'B3.1', label: 'Colaboración & Trabajo en Equipo', max: 4 },
            { id: 'B3.2', label: 'Priorización de Alertas y Gestión del Tiempo', max: 4 },
            { id: 'B3.3', label: 'Documentación & Traspaso de Guardia (Handoff)', max: 4 },
        ]
    }
]

const DIM_B_SECTIONS_OTEL = [
    {
        id: 'B1',
        title: 'B1. Comunicación Técnica Escrita (Ticket ITSM)',
        maxScore: 16,
        normMax: 18,
        items: [
            { id: 'B1.1', label: 'Estructura formal del ticket', max: 4 },
            { id: 'B1.2', label: 'Precisión técnica y métricas', max: 4 },
            { id: 'B1.3', label: 'Plan de acción y mitigación', max: 4 },
            { id: 'B1.4', label: 'Impacto al negocio y escalamiento', max: 4 },
        ]
    },
    {
        id: 'B2',
        title: 'B2. Competencias Situacionales SRE',
        maxScore: 16,
        normMax: 12,
        items: [
            { id: 'B2.1', label: 'Preservación de Evidencia vs. Mitigación (Escenario 1)', max: 4 },
            { id: 'B2.2', label: 'Liderazgo Técnico y Gestión de Presión (Escenario 1)', max: 4 },
            { id: 'B2.3', label: 'Cultura Blameless & Seguridad Psicológica (Escenario 2)', max: 4 },
            { id: 'B2.4', label: 'Salvaguardas Sistémicas & Automatización (Escenario 2)', max: 4 },
        ]
    }
]

const DIM_C_ITEMS = [
    { id: 'C1', label: 'C1. Curiosidad Técnica & Autoaprendizaje', max: 7 },
    { id: 'C2', label: 'C2. Adaptabilidad al Cambio & Resiliencia', max: 7 },
    { id: 'C3', label: 'C3. Sentido de Urgencia & Orientación a Servicio', max: 6 },
]

const DIM_C_ITEMS_OTEL = [
    { id: 'C1', label: 'C1. Cultura Blameless & Post-mortems', max: 5 },
    { id: 'C2', label: 'C2. Mentalidad de SLOs & Error Budgets', max: 5 },
]

const DIM_IA_ITEMS = [
    { id: 'IA-1', label: 'IA-1. Habilidades Prácticas con Inteligencia Artificial', max: 5 },
    { id: 'IA-2', label: 'IA-2. Interacción con Agentes IA & Prompts', max: 5 },
]

export default async function EvaluationReportPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const selectQuery = `
        *,
        profiles:candidate_id (full_name, national_id, national_id_type, education_level, created_at),
        selection_processes (team, observations, candidate_email, candidate_national_id, profile_track),
        dimension_scores (*),
        dynamic_tests (*)
    `

    // 1. Try finding by evaluations.id
    let { data: evaluation } = await supabase
        .from('evaluations')
        .select(selectQuery)
        .eq('id', id)
        .maybeSingle<any>()

    // 2. Fallback: try finding by candidate_id
    if (!evaluation) {
        const { data: evalByCandidate } = await supabase
            .from('evaluations')
            .select(selectQuery)
            .eq('candidate_id', id)
            .order('completed_at', { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle<any>()
        if (evalByCandidate) evaluation = evalByCandidate
    }

    // 3. Fallback: try finding by selection_process_id
    if (!evaluation) {
        const { data: evalByProc } = await supabase
            .from('evaluations')
            .select(selectQuery)
            .eq('selection_process_id', id)
            .limit(1)
            .maybeSingle<any>()
        if (evalByProc) evaluation = evalByProc
    }

    if (!evaluation) {
        redirect('/evaluator/history')
    }

    const profile = evaluation.profiles
    const scores = (evaluation.dimension_scores as any[]) || []
    const aiFeedback = evaluation.final_feedback_ai as any
    const dynamicTests = (evaluation.dynamic_tests as any[]) || []

    const b1TicketTest = dynamicTests.find(t => t.test_type === 'B1_TICKET' && (!t.subcategory || t.subcategory === 'TICKET' || (!t.subcategory.startsWith('EVAL_') && t.subcategory !== 'CASE')))
    const b1CaseTest = dynamicTests.find(t => t.test_type === 'B1_CASE' || (t.test_type === 'B1_TICKET' && t.subcategory === 'CASE'))
    const b2Tests = dynamicTests.filter(t => t.test_type === 'QUESTIONS_B2')
    const cTests = dynamicTests.filter(t => t.test_type === 'QUESTIONS_C')

    // Helper map for fast category lookups
    const scoreMap: Record<string, { raw_score: number; comments: string | null }> = {}
    scores.forEach((s: any) => {
        scoreMap[s.category] = { raw_score: s.raw_score, comments: s.comments }
    })

    const candidateFullName = profile?.full_name || 'Candidato sin nombre'
    const candidateEmail = evaluation.selection_processes?.candidate_email || 'Sin correo asociado'
    const candidateNationalId = profile?.national_id || evaluation.selection_processes?.candidate_national_id || null
    const candidateIdType = profile?.national_id_type || 'CC'
    const processDate = evaluation.completed_at || evaluation.started_at || new Date().toISOString()

    const track = evaluation.selection_processes?.profile_track || 'general'
    const isOtel = track === 'otel_expert'

    const activeDimASections = isOtel ? DIM_A_SECTIONS_OTEL : DIM_A_SECTIONS
    const activeDimBSections = isOtel ? DIM_B_SECTIONS_OTEL : DIM_B_SECTIONS
    const activeDimCItems = isOtel ? DIM_C_ITEMS_OTEL : DIM_C_ITEMS

    // Métricas de integridad y telemetría de respuestas
    const pasteAttempts = evaluation.bypass_paste_count ?? dynamicTests.filter(t => t.test_type === 'SECURITY_AUDIT').length
    const writtenAiTests = dynamicTests.filter(t => typeof t.ai_likelihood === 'number' && t.candidate_response)
    const globalAvgAiLikelihood = writtenAiTests.length > 0
        ? Math.round(writtenAiTests.reduce((sum, t) => sum + (t.ai_likelihood || 0), 0) / writtenAiTests.length)
        : null
    const b1Likelihood = b1TicketTest?.ai_likelihood ?? null
    const b2LikelihoodTests = b2Tests.filter(t => typeof t.ai_likelihood === 'number')
    const b2AvgLikelihood = b2LikelihoodTests.length > 0
        ? Math.round(b2LikelihoodTests.reduce((sum, t) => sum + (t.ai_likelihood || 0), 0) / b2LikelihoodTests.length)
        : null
    const cLikelihoodTests = cTests.filter(t => typeof t.ai_likelihood === 'number')
    const cAvgLikelihood = cLikelihoodTests.length > 0
        ? Math.round(cLikelihoodTests.reduce((sum, t) => sum + (t.ai_likelihood || 0), 0) / cLikelihoodTests.length)
        : null

    // Clasificación ejecutiva formateada según track
    const classificationLabel = (isOtel && (!evaluation.classification || evaluation.classification === 'Continúa en su rol actual'))
        ? 'No Cumple Perfil Experto'
        : evaluation.classification

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
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
            <Card className="border-border shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm print:border-none print:shadow-none print:bg-white print:p-0">
                {/* Header Decoration */}
                <div className="h-2 w-full bg-gradient-to-r from-primary via-indigo-500 to-amber-500" />
                
                <CardContent className="p-6 sm:p-10 space-y-10 print:p-2 print:space-y-6">
                    {/* Title & Badge */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary uppercase font-sans">Informe Ejecutivo de Evaluación</h1>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-muted-foreground text-base sm:text-lg">SkillFlow Platform — Proceso de Selección Técnica</p>
                                {isOtel && (
                                    <Badge variant="outline" className="text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-200">
                                        Track OpenTelemetry & Grafana
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tighter" style={{ color: evaluation.final_score >= 80 ? '#10B981' : evaluation.final_score >= 60 ? '#F59E0B' : evaluation.final_score >= 40 ? '#F97316' : '#EF4444' }}>
                                {evaluation.final_score}
                                <span className="text-xl text-muted-foreground ml-1">/100</span>
                            </div>
                            <Badge className="mt-2 px-4 py-1.5 text-sm font-bold uppercase tracking-wider shadow-sm text-white" style={{ backgroundColor: evaluation.final_score >= 80 ? '#10B981' : evaluation.final_score >= 60 ? '#F59E0B' : evaluation.final_score >= 40 ? '#F97316' : '#EF4444' }}>
                                {classificationLabel}
                            </Badge>
                        </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* Candidate Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Candidato
                            </p>
                            <p className="font-bold text-lg leading-tight">{candidateFullName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Mail className="h-3 w-3" /> Email de Contacto
                            </p>
                            <p className="font-mono text-sm break-all">{candidateEmail}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Identificación
                            </p>
                            <p className="font-bold">
                                {candidateNationalId ? `${ID_TYPE_LABELS[candidateIdType] || candidateIdType} ${candidateNationalId}` : 'Sin ID registrado'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Fecha del Proceso
                            </p>
                            <p className="font-bold">{new Date(processDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* AI ANALYTICS SECTION */}
                    <div className="space-y-6 pt-6 print-break-inside-avoid">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-6 w-6 text-amber-500 fill-amber-500/20" />
                                <h2 className="text-2xl font-black tracking-tight text-foreground uppercase italic underline decoration-amber-500 decoration-4 underline-offset-8">Análisis de Inteligencia Artificial</h2>
                            </div>
                            <RegenerateAIButton evaluationId={evaluation.id} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Strengths & Gaps */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                                        <Target className="h-4 w-4" /> Fortalezas Detectadas
                                    </h3>
                                    {(() => {
                                        const rawFortalezas = aiFeedback?.fortalezas || []
                                        const isNoStrengths = rawFortalezas.length === 0 || 
                                            rawFortalezas.every((f: string) => 
                                                f.toLowerCase().includes('no se evidencia') || 
                                                f.toLowerCase().includes('sin fortaleza') || 
                                                f.toLowerCase().includes('falla de formato')
                                            )

                                        if (isNoStrengths) {
                                            return (
                                                <div className="p-4 rounded-lg bg-muted/40 border border-border text-muted-foreground text-xs sm:text-sm flex gap-3 items-center">
                                                    <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                                                    <span className="font-medium italic">No se evidenciaron fortalezas técnicas demostradas en este intento de evaluación.</span>
                                                </div>
                                            )
                                        }

                                        return (
                                            <ul className="space-y-3">
                                                {rawFortalezas.map((f: string, i: number) => (
                                                    <li key={i} className="flex gap-3 text-sm leading-relaxed p-3 rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm print:bg-emerald-50/50">
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span className="text-emerald-900 font-medium">{f}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )
                                    })()}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                                        <ShieldAlert className="h-4 w-4" /> Áreas de Mejora
                                    </h3>
                                    <ul className="space-y-3">
                                        {aiFeedback?.brechas?.map((b: string, i: number) => (
                                            <li key={i} className="flex gap-3 text-sm leading-relaxed p-3 rounded-lg bg-amber-50 border border-amber-100 shadow-sm print:bg-amber-50/50">
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
                                <div className="relative p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 italic text-muted-foreground leading-relaxed shadow-inner min-h-[300px] print:bg-indigo-50/30">
                                    <p className="whitespace-pre-wrap">"{aiFeedback?.final_narrative}"</p>
                                    <div className="mt-8 flex items-center gap-2 pt-6 border-t border-indigo-100/50 non-italic no-print">
                                        <ClipboardCheck className="h-4 w-4 text-indigo-500" />
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
                                            Tip: Puedes compartir este texto directamente con el candidato para enriquecer su feedback.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* INTEGRITY AUDIT & AI LIKELIHOOD METRICS (Track Experto OTel) */}
                    {isOtel && (
                        <div className="space-y-6 pt-6 print-break-inside-avoid">
                            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-400/20">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="h-6 w-6 text-indigo-600" />
                                    <h2 className="text-xl font-black tracking-tight text-foreground uppercase italic underline decoration-indigo-500 decoration-4 underline-offset-8">
                                        Auditoría de Integridad & Análisis de Generación por IA
                                    </h2>
                                </div>
                                <Badge variant="outline" className="text-xs font-mono bg-slate-50 text-slate-700 border-slate-300">
                                    Auditoría Forense Anti-Fraude
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* 1. Control de Pegado (Clipboard Protection) */}
                                <div className={`p-4 rounded-xl border ${pasteAttempts > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-emerald-50/50 border-emerald-200'} shadow-sm space-y-2`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Intentos de Pegado Bloqueados</span>
                                        <Badge className={pasteAttempts > 0 ? 'bg-amber-600 text-white font-mono' : 'bg-emerald-600 text-white font-mono'}>
                                            {pasteAttempts} detectados
                                        </Badge>
                                    </div>
                                    <div className="text-2xl font-black font-mono">
                                        {pasteAttempts === 0 ? (
                                            <span className="text-emerald-700 text-lg flex items-center gap-1.5 font-bold">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Integridad Óptima
                                            </span>
                                        ) : (
                                            <span className="text-amber-800 text-lg flex items-center gap-1.5 font-bold">
                                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /> Copiado Interceptado
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-snug">
                                        {pasteAttempts === 0
                                            ? 'El candidato redactó directamente en el editor sin intentar pegar contenido externo.'
                                            : `Se registraron y bloquearon ${pasteAttempts} intentos de pegar texto desde el portapapeles externo.`}
                                    </p>
                                </div>

                                {/* 2. Índice Promedio de Detección de IA */}
                                <div className="p-4 rounded-xl border border-border bg-muted/20 shadow-sm space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Probabilidad Global de IA</span>
                                        {globalAvgAiLikelihood !== null && (
                                            <Badge className={globalAvgAiLikelihood > 60 ? 'bg-rose-600 text-white font-mono' : globalAvgAiLikelihood > 30 ? 'bg-amber-500 text-white font-mono' : 'bg-emerald-600 text-white font-mono'}>
                                                {globalAvgAiLikelihood}% promedio
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-2xl font-black font-mono text-foreground">
                                        {globalAvgAiLikelihood !== null ? `${globalAvgAiLikelihood}%` : 'N/A'}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-snug">
                                        {globalAvgAiLikelihood === null
                                            ? 'Sin evaluaciones de probabilidad registradas.'
                                            : globalAvgAiLikelihood > 60
                                            ? 'Alta probabilidad de asistencia o generación sintética por LLM en las respuestas redactadas.'
                                            : globalAvgAiLikelihood > 30
                                            ? 'Probabilidad moderada. Estilo estructurado con patrones mixtos de redacción.'
                                            : 'Baja probabilidad. Respuestas consistentes con redacción humana y estilo auténtico.'}
                                    </p>
                                </div>

                                {/* 3. Dictamen de Autenticidad */}
                                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 shadow-sm space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Dictamen de Autenticidad</span>
                                        <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 bg-white">
                                            Telemetría OTP
                                        </Badge>
                                    </div>
                                    <div className="text-base font-bold text-indigo-950">
                                        {pasteAttempts > 0 && (globalAvgAiLikelihood ?? 0) > 50
                                            ? 'Riesgo Alto de Asistencia Externa'
                                            : pasteAttempts > 0
                                            ? 'Pegado Externo Interceptado'
                                            : (globalAvgAiLikelihood ?? 0) > 60
                                            ? 'Posible Generación por IA'
                                            : 'Prueba Confiable y Auténtica'}
                                    </div>
                                    <p className="text-xs text-indigo-900/80 leading-snug">
                                        {pasteAttempts === 0 && (globalAvgAiLikelihood ?? 0) <= 60
                                            ? 'No se observaron patrones anómalos de automatización ni bypass de seguridad.'
                                            : 'Se recomienda al evaluador revisar la formulación de las respuestas en la entrevista técnica.'}
                                    </p>
                                </div>
                            </div>

                            {/* Desglose por módulos evaluados con IA */}
                            <div className="p-4 rounded-xl border border-border bg-background/50 text-xs space-y-3">
                                <span className="font-bold text-[11px] uppercase tracking-wide text-foreground/80 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-primary" /> Desglose de Probabilidad de IA por Módulo Escrito:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-2.5 rounded-lg bg-card border border-border/60 flex items-center justify-between">
                                        <span className="text-muted-foreground font-medium">B1: Ticket SRE (ITSM)</span>
                                        <span className="font-mono font-bold text-foreground">
                                            {b1Likelihood !== null ? `${b1Likelihood}%` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-card border border-border/60 flex items-center justify-between">
                                        <span className="text-muted-foreground font-medium">B2: Situacionales SRE</span>
                                        <span className="font-mono font-bold text-foreground">
                                            {b2AvgLikelihood !== null ? `${b2AvgLikelihood}%` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-card border border-border/60 flex items-center justify-between">
                                        <span className="text-muted-foreground font-medium">Dimensión C: Cultura SRE</span>
                                        <span className="font-mono font-bold text-foreground">
                                            {cAvgLikelihood !== null ? `${cAvgLikelihood}%` : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SCORES SUMMARY OVERVIEW */}
                    <div className="space-y-8 pt-8">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-primary fill-primary/20" />
                            <h2 className="text-2xl font-black tracking-tight text-foreground uppercase italic underline decoration-primary decoration-4 underline-offset-8">Desglose por Dimensiones</h2>
                        </div>

                        {/* Summary Dimension Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { dim: 'A', label: isOtel ? 'Técnica OTel & Grafana' : 'Técnica (Infra/Obs)', score: evaluation.score_a, max: 50, color: 'border-l-primary' },
                                { dim: 'B', label: isOtel ? 'Blandas (ITSM & Presión)' : 'Blandas (Comunicación)', score: evaluation.score_b, max: 30, color: 'border-l-indigo-600' },
                                { dim: 'C', label: isOtel ? 'Cultura (Blameless & SLOs)' : 'Cultural (Ajuste/Mentalidad)', score: evaluation.score_c, max: 20, color: 'border-l-amber-600' },
                            ].map(d => (
                                <div key={d.dim} className={`p-4 rounded-xl border border-border bg-muted/20 border-l-4 ${d.color} shadow-sm flex justify-between items-center print:bg-white`}>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Dimensión {d.dim}</p>
                                        <p className="font-bold text-sm text-foreground">{d.label}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-mono text-xl font-black text-foreground">{d.score}</span>
                                        <span className="text-xs text-muted-foreground ml-1">/ {d.max}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* DETAILED BREAKDOWN BY DIMENSION */}
                        <div className="space-y-8">
                            
                            {/* --- DIMENSION A --- */}
                            <div className="space-y-4 print-break-inside-avoid">
                                <div className="flex items-center justify-between pb-2 border-b-2 border-primary/20">
                                    <h3 className="font-black text-base uppercase tracking-tight text-primary flex items-center gap-2">
                                        Dimensión A: Habilidades Técnicas {isOtel && '(Track OpenTelemetry)'}
                                    </h3>
                                    <span className="font-mono font-bold text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                                        Consolidado: {evaluation.score_a} / 50 pts
                                    </span>
                                </div>

                                <div className="rounded-xl border border-border overflow-hidden bg-background/50 print:bg-white">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/60 border-b border-border">
                                            <tr>
                                                <th className="px-5 py-3 font-black uppercase tracking-tight text-[10px] w-1/3">Criterio Técnico</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-tight text-[10px] text-center w-24">Puntaje</th>
                                                <th className="px-5 py-3 font-black uppercase tracking-tight text-[10px]">Observaciones del Evaluador</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {activeDimASections.map((sec) => (
                                                <Fragment key={sec.id}>
                                                    <tr className="bg-muted/30 font-bold">
                                                        <td colSpan={3} className="px-5 py-2.5 text-xs text-foreground/80 font-bold uppercase tracking-wide bg-muted/40">
                                                            {sec.title}
                                                        </td>
                                                    </tr>
                                                    {sec.items.map((item) => {
                                                        const s = scoreMap[item.id]
                                                        return (
                                                            <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                                                <td className="px-6 py-2.5 font-medium text-muted-foreground">
                                                                    <span className="font-mono font-bold text-foreground mr-2">{item.id}</span>
                                                                    {item.label}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-center font-mono font-semibold">
                                                                    {s ? s.raw_score : '-'} <span className="text-[10px] text-muted-foreground font-normal">/ {item.max}</span>
                                                                </td>
                                                                <td className="px-5 py-2.5 text-muted-foreground leading-relaxed">
                                                                    {s?.comments || '-'}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* --- DIMENSION B --- */}
                            <div className="space-y-6 print-break-inside-avoid">
                                <div className="flex items-center justify-between pb-2 border-b-2 border-indigo-500/20">
                                    <h3 className="font-black text-base uppercase tracking-tight text-indigo-600 flex items-center gap-2">
                                        Dimensión B: Habilidades Blandas y Comunicación
                                    </h3>
                                    <span className="font-mono font-bold text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full">
                                        Consolidado: {evaluation.score_b} / 30 pts
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    {activeDimBSections.map((sec) => {
                                        const catScore = scoreMap[sec.id]
                                        return (
                                            <div key={sec.id} className="rounded-xl border border-border overflow-hidden bg-background/50 print:bg-white shadow-sm space-y-0">
                                                {/* Section Header */}
                                                <div className="bg-indigo-50/50 border-b border-border px-5 py-3 flex justify-between items-center">
                                                    <span className="font-bold text-xs uppercase tracking-wide text-indigo-900">
                                                        {sec.title}
                                                    </span>
                                                    {catScore && (
                                                        <span className="text-xs font-mono font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded border border-indigo-200">
                                                            Puntaje: {catScore.raw_score} / {sec.maxScore}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Candidate Documented Ticket Evidence (B1) */}
                                                {sec.id === 'B1' && b1TicketTest?.candidate_response && (
                                                    <div className="p-5 bg-muted/20 border-b border-border space-y-4 print:bg-white">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                                <Eye className="w-4 h-4 text-primary" /> Evidencia del Candidato: Ticket de Incidente Simulado
                                                            </span>
                                                            {b1TicketTest.ai_likelihood !== undefined && b1TicketTest.ai_likelihood !== null && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                                                    🤖 Probabilidad IA: {b1TicketTest.ai_likelihood}%
                                                                </span>
                                                            )}
                                                        </div>

                                                        {b1CaseTest && (
                                                            <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-lg">
                                                                <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Caso presentado al candidato:</p>
                                                                <p className="text-xs text-foreground/80 leading-relaxed italic whitespace-pre-wrap">{b1CaseTest.prompt_context || b1CaseTest.candidate_response}</p>
                                                            </div>
                                                        )}

                                                        <div className="bg-card border border-border p-4 rounded-lg font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed shadow-inner print:bg-white print:border-gray-200">
                                                            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border/50 text-muted-foreground font-sans font-bold text-xs">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ticket Documentado por el Candidato:
                                                            </div>
                                                            {b1TicketTest.candidate_response}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Candidate Situational Responses (B2 - OTel) */}
                                                {sec.id === 'B2' && b2Tests.length > 0 && (
                                                    <div className="p-5 bg-muted/20 border-b border-border space-y-4 print:bg-white">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                            <Eye className="w-4 h-4 text-primary" /> Respuestas Situacionales Escritas por el Candidato ({b2Tests.length} Escenarios)
                                                        </span>
                                                        <div className="space-y-3">
                                                            {b2Tests.map((t: any, idx: number) => (
                                                                <div key={idx} className="bg-card border border-border p-3.5 rounded-lg text-xs space-y-2 print:bg-white">
                                                                    <div className="font-bold text-foreground flex items-center justify-between">
                                                                        <span>Escenario {t.subcategory || idx + 1}: {t.ai_generated_content || ''}</span>
                                                                        {t.ai_likelihood !== undefined && t.ai_likelihood !== null && (
                                                                            <span className="text-[10px] font-semibold text-muted-foreground">Probabilidad IA: {t.ai_likelihood}%</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-muted-foreground italic text-[11px]">{t.prompt_context}</p>
                                                                    <div className="p-2.5 bg-muted/30 rounded border border-border/50 font-mono text-foreground whitespace-pre-wrap">
                                                                        {t.candidate_response || 'Sin respuesta registrada.'}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Subcriteria Table */}
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-muted/40 border-b border-border text-[9px] font-black uppercase text-muted-foreground">
                                                        <tr>
                                                            <th className="px-5 py-2 w-2/3">Subcriterio</th>
                                                            <th className="px-4 py-2 text-center w-1/3">Nivel Obtenido (1-4)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/30">
                                                        {sec.items.map((sub) => {
                                                            const subScore = scoreMap[sub.id]
                                                            return (
                                                                <tr key={sub.id} className="hover:bg-muted/10 transition-colors">
                                                                    <td className="px-6 py-2 text-muted-foreground font-medium">
                                                                        <span className="font-mono font-bold text-foreground mr-2">{sub.id}</span>
                                                                        {sub.label}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-center font-mono font-bold text-foreground">
                                                                        {subScore ? subScore.raw_score : '-'} <span className="text-[10px] text-muted-foreground font-normal">/ {sub.max}</span>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>

                                                {/* Evaluator General Comments & Evidence */}
                                                <div className="p-4 bg-indigo-50/30 border-t border-border space-y-1.5">
                                                    <div className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                                                        <FileText className="h-3.5 w-3.5 text-indigo-500" /> Observaciones y Evidencias del Evaluador ({sec.id}):
                                                    </div>
                                                    <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed italic bg-white/70 p-3 rounded-lg border border-indigo-100 shadow-inner">
                                                        {catScore?.comments ? catScore.comments : 'Sin observaciones adicionales registradas.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* --- DIMENSION C --- */}
                            <div className="space-y-4 print-break-inside-avoid">
                                <div className="flex items-center justify-between pb-2 border-b-2 border-amber-500/20">
                                    <h3 className="font-black text-base uppercase tracking-tight text-amber-700 flex items-center gap-2">
                                        Dimensión C: Ajuste Cultural y Mentalidad
                                    </h3>
                                    <span className="font-mono font-bold text-sm bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                                        Consolidado: {evaluation.score_c} / 20 pts
                                    </span>
                                </div>

                                <div className="rounded-xl border border-border overflow-hidden bg-background/50 print:bg-white shadow-sm">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/60 border-b border-border">
                                            <tr>
                                                <th className="px-5 py-3 font-black uppercase tracking-tight text-[10px] w-1/3">Criterio Cultural</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-tight text-[10px] text-center w-24">Puntaje</th>
                                                <th className="px-5 py-3 font-black uppercase tracking-tight text-[10px]">Observaciones del Evaluador</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {activeDimCItems.map((item) => {
                                                const s = scoreMap[item.id]
                                                const cTest = cTests.find(t => t.subcategory === item.id)
                                                return (
                                                    <Fragment key={item.id}>
                                                        <tr className="hover:bg-muted/10 transition-colors">
                                                            <td className="px-5 py-3 font-medium text-foreground">
                                                                {item.label}
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-mono font-bold">
                                                                {s ? s.raw_score : '-'} <span className="text-[10px] text-muted-foreground font-normal">/ {item.max}</span>
                                                            </td>
                                                            <td className="px-5 py-3 text-muted-foreground leading-relaxed">
                                                                {s?.comments || '-'}
                                                            </td>
                                                        </tr>
                                                        {cTest?.candidate_response && (
                                                            <tr className="bg-amber-50/20 border-b border-border/40">
                                                                <td colSpan={3} className="px-5 py-2.5 text-xs">
                                                                    <div className="flex flex-col gap-1 p-2.5 rounded bg-background/80 border border-amber-200/50">
                                                                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
                                                                            <span>Respuesta Escrita por el Candidato ({item.id}):</span>
                                                                            {cTest.ai_likelihood !== undefined && cTest.ai_likelihood !== null && (
                                                                                <span className="text-[10px] text-muted-foreground font-semibold">Probabilidad IA: {cTest.ai_likelihood}%</span>
                                                                            )}
                                                                        </div>
                                                                        <p className="font-mono text-xs text-foreground/90 whitespace-pre-wrap">{cTest.candidate_response}</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Fragment>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* --- DIMENSION IA (IF SCORED AND NOT OTEL) --- */}
                            {!isOtel && (evaluation.score_ia !== null || scoreMap['IA-1'] || scoreMap['IA-2']) && (
                                <div className="space-y-4 print-break-inside-avoid">
                                    <div className="flex items-center justify-between pb-2 border-b-2 border-purple-500/20">
                                        <h3 className="font-black text-base uppercase tracking-tight text-purple-700 flex items-center gap-2">
                                            Dimensión IA: Habilidades con Inteligencia Artificial
                                        </h3>
                                        <span className="font-mono font-bold text-sm bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1 rounded-full">
                                            Consolidado: {evaluation.score_ia || 0} / 10 pts
                                        </span>
                                    </div>

                                    <div className="rounded-xl border border-border overflow-hidden bg-background/50 print:bg-white shadow-sm">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-muted/60 border-b border-border">
                                                <tr>
                                                    <th className="px-5 py-3 font-black uppercase tracking-tight text-[10px] w-1/3">Criterio IA</th>
                                                    <th className="px-4 py-3 font-black uppercase tracking-tight text-[10px] text-center w-24">Puntaje</th>
                                                    <th className="px-5 py-3 font-black uppercase tracking-tight text-[10px]">Observaciones del Evaluador</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/40">
                                                {DIM_IA_ITEMS.map((item) => {
                                                    const s = scoreMap[item.id]
                                                    return (
                                                        <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                                            <td className="px-5 py-3 font-medium text-foreground">
                                                                {item.label}
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-mono font-bold">
                                                                {s ? s.raw_score : '-'} <span className="text-[10px] text-muted-foreground font-normal">/ {item.max}</span>
                                                            </td>
                                                            <td className="px-5 py-3 text-muted-foreground leading-relaxed">
                                                                {s?.comments || '-'}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-10 border-t border-border/50 text-center space-y-2 opacity-50 print:opacity-100 print:pt-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Opera Eval App — Reporte Generado por SkillFlow Engine</p>
                        <p className="text-[9px] font-medium tracking-tight">SETI S.A.S — Todos los derechos reservados © {new Date().getFullYear()}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
