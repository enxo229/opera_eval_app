'use client'

import { useState, useEffect } from 'react'
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



// Evaluator question guides per category (B2-B6)
const EVALUATOR_GUIDES: Record<string, { description: string; questions: string[]; indicators: { score: number; what: string }[] }> = {
    B2: {
        description: 'Usando el mismo escenario del incidente de B1, pídele al candidato que lo explique verbalmente como si fueras el gerente de cuenta del cliente (no técnico). Máximo 5 minutos.',
        questions: [
            '"Imagina que soy el gerente de cuenta del cliente. Son las 9 a.m. y quiero saber qué pasó anoche con el servicio de pagos. Explícamelo."',
        ],
        indicators: [
            { score: 4, what: 'Lenguaje claro, empático, orientado al impacto. Narrativa fluida con inicio, nudo y resolución.' },
            { score: 3, what: 'Explica sin tecnicismos manteniendo hechos. Hay un hilo con inicio, nudo, resolución.' },
            { score: 2, what: 'Intenta simplificar pero pierde precisión. Hay saltos o confusión en el relato.' },
            { score: 1, what: 'Usa jerga técnica sin traducirla. Relata sin orden cronológico.' },
        ],
    },
    B3: {
        description: 'Evalúa la orientación al cliente y gestión de prioridades interpersonales.',
        questions: [
            '"Cuando alguien de otro equipo te pide algo urgente mientras gestionas otra alerta, ¿cómo manejas esa situación?"',
            '"¿Recuerdas algún caso en que alguien quedó insatisfecho con tu atención? ¿Qué pasó?"',
            '"¿Cómo sabes cuando alguien realmente entendió lo que le explicaste?"',
        ],
        indicators: [
            { score: 4, what: 'Prioriza activamente la experiencia del otro. Reconoce fallos y corrige. Verifica comprensión.' },
            { score: 3, what: 'Conciencia del impacto en otros. Ejemplos sin mucha profundidad de reflexión.' },
            { score: 2, what: 'Cumple de forma transaccional. No reflexiona sobre la experiencia del otro.' },
            { score: 1, what: 'Centrado exclusivamente en proceso o herramienta. El otro no aparece.' },
        ],
    },
    B4: {
        description: 'Comportamiento dentro del equipo de Ópera en situaciones de presión.',
        questions: [
            '"Cuéntame de una situación en que apoyaste a un compañero con algo que no era tu responsabilidad."',
            '"¿Hay algo que el equipo podría hacer mejor? ¿Lo has mencionado?"',
            '"Cuando hay muchas alertas simultáneas, ¿cómo se organiza el equipo?"',
        ],
        indicators: [
            { score: 4, what: 'Ve al equipo como sistema. Actúa proactivamente. Toma iniciativa de coordinación en caos.' },
            { score: 3, what: 'Colabora cuando se le pide. Buena relación. Participa sin liderar.' },
            { score: 2, what: 'Cumple su turno. Colaboración puntual, no habitual.' },
            { score: 1, what: 'Individualista. Sin conciencia del equipo más allá de su tarea.' },
        ],
    },
    B5: {
        description: 'Gestión del tiempo y criterio de priorización ante múltiples alertas.',
        questions: [
            '"Describe un turno con muchas alertas. ¿Cómo decidiste cuál atender primero?"',
            '"¿Alguna vez se te fue algo de las manos por atender otra cosa? ¿Qué aprendiste?"',
            '"¿Tienes algún método para no perder el hilo con varios incidentes?"',
        ],
        indicators: [
            { score: 4, what: 'Criterio claro (impacto/urgencia). Consistente. Aprendió de errores pasados. Usa método de apoyo.' },
            { score: 3, what: 'Prioriza básicamente (lo más urgente primero). Reconoce cuándo pedir apoyo.' },
            { score: 2, what: 'Prioriza por orden de llegada. Sin criterio estructurado.' },
            { score: 1, what: 'Sin criterio claro. Reporta sensación de caos sin mecanismos de respuesta.' },
        ],
    },
    B6: {
        description: 'Revisa tickets reales en GLPI antes de la entrevista. Profundiza en sus hábitos de orden.',
        questions: [
            '"¿Cómo decides qué nivel de detalle poner en un ticket? ¿Hay diferencia entre noche y día?"',
            '"¿Alguna vez te pidieron completar un registro? ¿Qué pasó?"',
            '"Si dejas un incidente abierto, ¿qué tan fácil es para un compañero retomarlo?"',
        ],
        indicators: [
            { score: 4, what: 'Documenta pensando en quien viene después. Tickets autoexplicativos. Criterio propio.' },
            { score: 3, what: 'Documenta consistentemente. Acepta e incorpora retroalimentación.' },
            { score: 2, what: 'Documenta lo mínimo. Requiere recordatorio. Solo entendible con contexto.' },
            { score: 1, what: 'Documentación incompleta o ausente de forma habitual.' },
        ],
    },
}

const CATEGORIES = [
    { id: 'B1', name: 'Comunicación Técnica Escrita', max: 16, sub: 'B1.x' },
    { id: 'B2', name: 'Comunicación Verbal Técnica', max: 16, sub: 'B2.1' },
    { id: 'B3', name: 'Orientación al Cliente', max: 12, sub: 'B3.1' },
    { id: 'B4', name: 'Trabajo en Equipo', max: 12, sub: 'B4.1' },
    { id: 'B5', name: 'Gestión del Tiempo', max: 12, sub: 'B5.1' },
    { id: 'B6', name: 'Documentación y Orden', max: 12, sub: 'B6.1' }
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
    { id: 'B3.1', label: 'Escucha activa', levels: ['No escucha', 'Escucha pero interrumpe', 'Escucha y valida', 'Demuestra empatía profunda'] },
    { id: 'B3.2', label: 'Control emocional', levels: ['Pierde control', 'Se frustra visiblemente', 'Mantiene la calma', 'Transmite seguridad en crisis'] },
    { id: 'B3.3', label: 'Enfoque en solución', levels: ['Se centra en excusas', 'Resuelve pero lentamente', 'Solución funcional', 'Solución preventiva/integral'] }
]

const B4_SUBS = [
    { id: 'B4.1', label: 'Traducción técnica-negocio', levels: ['Todo técnico', 'Intenta traducir pero falla', 'Traducción aceptable', 'Perfecta adaptación al nivel'] },
    { id: 'B4.2', label: 'Ajuste de vocabulario', levels: ['Inadecuado', 'Mejorable', 'Adecuado', 'Excelente y profesional'] },
    { id: 'B4.3', label: 'Validación de entendimiento', levels: ['Asume entendimiento', 'Pregunta si se entendió', 'Pide parafrasear (básico)', 'Asegura comprensión total'] }
]

const B5_SUBS = [
    { id: 'B5.1', label: 'Justificación de prioridad', levels: ['Sin justificación', 'Justificación débil', 'Justificación lógica', 'Basada en impacto de negocio'] },
    { id: 'B5.2', label: 'Manejo de expectativas', levels: ['No las maneja', 'Da tiempos irreales', 'Tiempos realistas', 'Proactivo en actualizaciones'] },
    { id: 'B5.3', label: 'Propuestas alternativas', levels: ['Ninguna', 'Solución única', 'Varias opciones (solo funcionales)', 'Opciones costo-beneficio'] }
]

const B6_SUBS = [
    { id: 'B6.1', label: 'Handoff / Traspaso', levels: ['Sin información', 'Requiere muchas preguntas', 'Contexto suficiente', 'Excelente resumen de estado'] },
    { id: 'B6.2', label: 'Claridad en bloqueos', levels: ['No menciona bloqueos', 'Bloqueo vago', 'Define qué falta/quién responde', 'Detalla causa y alternativas'] },
    { id: 'B6.3', label: 'Seguimiento de acuerdos', levels: ['Sin próximos pasos', 'Próximos pasos vagos', 'Pasos claros y responsable', 'Detallado con tiempos esperados'] }
]

export function DimensionBEvaluation({ evaluationId, existingScores, dynamicTests, readOnly }: Props) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [expandedGuide, setExpandedGuide] = useState<string | null>(null)
    const [expandedEvidence, setExpandedEvidence] = useState<string | null>('B1')

    // B1 data
    const testB1 = dynamicTests.find(t => t.test_type === 'B1_TICKET' && t.subcategory === 'RESPONSE')
    const testB1Case = dynamicTests.find(t => t.test_type === 'B1_TICKET' && t.subcategory === 'CASE')
    const aiB1Data = dynamicTests.filter(t => t.test_type === 'B1_TICKET' && t.subcategory?.startsWith('EVAL_')).sort((a, b) => a.subcategory.localeCompare(b.subcategory))

    const isB1Finished = !!testB1

    // Initial Sub-scores helper
    const getInitialSubScore = (subId: string) => {
        const found = existingScores.find(s => s.dimension === 'B' && s.category === subId)
        return found ? found.raw_score : 1 // Defaults to 1 (rojo) on a 1-4 scale
    }

    // Initial category score helper
    const getInitialScore = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'B' && s.category === categoryId)
        return found ? found.raw_score : 0
    }
    const getInitialComment = (categoryId: string) => {
        const found = existingScores.find(s => s.dimension === 'B' && s.category === categoryId)
        return found?.comments || ''
    }

    // Granular sub-scores state
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
    const [b4SubScores, setB4SubScores] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {}
        B4_SUBS.forEach(s => init[s.id] = getInitialSubScore(s.id))
        return init
    })
    const [b5SubScores, setB5SubScores] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {}
        B5_SUBS.forEach(s => init[s.id] = getInitialSubScore(s.id))
        return init
    })
    const [b6SubScores, setB6SubScores] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {}
        B6_SUBS.forEach(s => init[s.id] = getInitialSubScore(s.id))
        return init
    })

    // Total category scores and comments
    const [scores, setScores] = useState<Record<string, number>>({
        B1: getInitialScore('B1'), B2: getInitialScore('B2'), B3: getInitialScore('B3'),
        B4: getInitialScore('B4'), B5: getInitialScore('B5'), B6: getInitialScore('B6')
    })
    const [comments, setComments] = useState<Record<string, string>>({
        B1: getInitialComment('B1'), B2: getInitialComment('B2'), B3: getInitialComment('B3'),
        B4: getInitialComment('B4'), B5: getInitialComment('B5'), B6: getInitialComment('B6')
    })

    const handleSave = async () => {
        setIsSaving(true)
        const supabase = createClient()

        try {
            // Save granular sub-scores
            const subScoresData = [
                ...B1_SUBS.map(s => ({ category: s.id, score: b1SubScores[s.id], dimension: 'B' })),
                ...B2_SUBS.map(s => ({ category: s.id, score: b2SubScores[s.id], dimension: 'B' })),
                ...B3_SUBS.map(s => ({ category: s.id, score: b3SubScores[s.id], dimension: 'B' })),
                ...B4_SUBS.map(s => ({ category: s.id, score: b4SubScores[s.id], dimension: 'B' })),
                ...B5_SUBS.map(s => ({ category: s.id, score: b5SubScores[s.id], dimension: 'B' })),
                ...B6_SUBS.map(s => ({ category: s.id, score: b6SubScores[s.id], dimension: 'B' })),
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

            // Calculate parent category totals purely raw (Normalization happens in final evaluation Calculation)
            const b1TotalRaw = Object.values(b1SubScores).reduce((a, b) => a + b, 0)
            const b2TotalRaw = Object.values(b2SubScores).reduce((a, b) => a + b, 0)
            const b3TotalRaw = Object.values(b3SubScores).reduce((a, b) => a + b, 0)
            const b4TotalRaw = Object.values(b4SubScores).reduce((a, b) => a + b, 0)
            const b5TotalRaw = Object.values(b5SubScores).reduce((a, b) => a + b, 0)
            const b6TotalRaw = Object.values(b6SubScores).reduce((a, b) => a + b, 0)

            const totalScores = [
                { category: 'B1', score: b1TotalRaw, comment: comments['B1'] },
                { category: 'B2', score: b2TotalRaw, comment: comments['B2'] },
                { category: 'B3', score: b3TotalRaw, comment: comments['B3'] },
                { category: 'B4', score: b4TotalRaw, comment: comments['B4'] },
                { category: 'B5', score: b5TotalRaw, comment: comments['B5'] },
                { category: 'B6', score: b6TotalRaw, comment: comments['B6'] },
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

            // Update local scores state
            setScores({
                B1: b1TotalRaw,
                B2: b2TotalRaw,
                B3: b3TotalRaw,
                B4: b4TotalRaw,
                B5: b5TotalRaw,
                B6: b6TotalRaw
            })

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
        if (!confirm('¿Estás seguro de resetear toda la Dimensión B? Esto borrará el ticket del candidato y las evaluaciones de IA.')) return
        setIsResetting(true)
        try {
            const res = await resetBResponses(evaluationId)
            if (res.success) {
                setScores({ B1: 0, B2: 0, B3: 0, B4: 0, B5: 0, B6: 0 })
                router.refresh()
            } else {
                alert('Error al resetear: ' + res.error)
            }
        } finally {
            setIsResetting(false)
        }
    }

    const handleTriggerAI = async () => {
        if (!testB1?.candidate_response) {
            alert('No hay ticket del candidato para evaluar.')
            return
        }
        setIsEvaluating(true)
        try {
            const res = await triggerB1Evaluation(evaluationId)
            if (res.success) {
                router.refresh()
            } else {
                alert('Error al solicitar evaluación de IA: ' + res.error)
            }
        } finally {
            setIsEvaluating(false)
        }
    }

    // Helper for slider color
    const getSliderColor = (score: number, max: number) => {
        const ratio = score / max
        if (ratio === 0) return '#64748b' // Slate
        if (ratio <= 0.33) return '#EF4444' // Red
        if (ratio <= 0.66) return '#F97316' // Orange
        return '#84CC16' // Bright Green (flourescente)
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-4 items-start shadow-sm">
                <div className="bg-blue-500 text-white p-2 rounded-lg">
                    <Info className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900 flex items-center gap-2">Guía de Evaluación: Dimensión B</h4>
                    <p className="text-sm text-blue-800 leading-relaxed mt-1">
                        Sigue este flujo secuencial: <br />
                        <strong>1. Revisión de Comunicación Escrita (B1):</strong> Evalúa el ticket redactado por el candidato. Usa la sugerencia de la IA como guía técnica. <br />
                        <strong>2. Entrevista Verbal (B2-B6):</strong> Basándote en el ticket de B1, pide al candidato que te explique lo sucedido (B2) y continúa con las preguntas de orientación, equipo y gestión.
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Escala 1 - 4</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">Habilidades Blandas (Peso: 30%)</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.refresh()} className="text-muted-foreground border-border hover:bg-muted gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Recargar
                    </Button>
                    {!readOnly && (
                        <Button variant="outline" size="sm" onClick={handleResetB} disabled={isResetting} className="text-red-600 border-red-200 hover:bg-red-50 gap-2">
                            <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                            Resetear B
                        </Button>
                    )}
                    {!readOnly && (
                        <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    )}
                </div>
            </div>

            {CATEGORIES.map(cat => {
                const guide = EVALUATOR_GUIDES[cat.id]
                const isGuideOpen = expandedGuide === cat.id
                const isEvidenceOpen = expandedEvidence === cat.id

                return (
                    <Card key={cat.id} className="border-border shadow-sm overflow-hidden group">
                        <CardHeader className="bg-muted/20 border-b border-border py-4 transition-colors group-hover:bg-muted/40">
                            <CardTitle className="text-lg flex justify-between items-center">
                                <span className="text-foreground font-bold">{cat.id}. {cat.name}</span>
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            {/* B1 Special: IA suggest and Rubrics */}
                            {cat.id === 'B1' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                        {/* Incident Scenario Display */}
                                        <div className="space-y-3">
                                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <AlertTriangle className="h-3 w-3" /> Escenario del Incidente B1
                                            </h5>
                                            <div className="p-4 bg-muted/30 border border-border rounded-lg text-sm h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">
                                                {testB1Case?.candidate_response || <span className="opacity-50 italic">El escenario aún no se ha generado o cargado.</span>}
                                            </div>
                                        </div>
                                        {/* Evidence and IA Suggestion */}
                                        <div className="space-y-3">
                                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Eye className="h-3 w-3" /> Respuesta y Guía IA
                                            </h5>

                                            {testB1 ? (
                                                <div className="space-y-4">
                                                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-lg h-[200px] overflow-y-auto border border-slate-700">
                                                        <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-1 text-[10px] text-slate-400">
                                                            <span>TICKET_CANDIDATO.TXT</span>
                                                            <MailCheck className="h-3 w-3" />
                                                        </div>
                                                        {testB1.candidate_response}
                                                    </div>

                                                    <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 p-4 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <NextImage src="/icons/AIAgent.png" alt="IA" width={48} height={48} className="shrink-0" />
                                                            <div>
                                                                <h4 className="text-sm font-bold text-amber-800">Evaluación Sincrónica por IA (B1 y B6)</h4>
                                                                <p className="text-xs text-amber-700/80 mt-0.5">
                                                                    Los insights sobre Estructura del Ticket (B1) y Habilidades de Documentación (B6) están ubicados exactamente debajo de cada competencia en los contenedores de evaluación.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleTriggerAI}
                                                            disabled={isEvaluating}
                                                            className="border-amber-500/30 hover:bg-amber-500/10 text-amber-700 font-bold gap-2 shrink-0 bg-white shadow-sm"
                                                        >
                                                            {isEvaluating ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                    Evaluando...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <RotateCcw className="h-4 w-4" />
                                                                    Re-evaluar con IA
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm italic">
                                                    El candidato aún no ha enviado el ticket.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* B2-B6 Guides (Now deprecated in favor of integrated labels, keeping only the Description) */}
                            {cat.id !== 'B1' && guide && (
                                <div className="space-y-4">
                                    <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/10">
                                        <p className="text-sm font-medium text-purple-900 flex items-start gap-2">
                                            <MessageCircleQuestion className="h-4 w-4 mt-0.5" />
                                            {guide.description}
                                        </p>
                                        <div className="mt-3">
                                            <p className="text-xs font-bold text-purple-800 uppercase mb-1">Preguntas Sugeridas:</p>
                                            <ul className="list-disc list-inside text-xs text-purple-900/80 space-y-1">
                                                {guide.questions.map((q, i) => (
                                                    <li key={i}>{q}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Granular Control Area (Style: Dimension A matching) */}
                            <div className="pt-4 space-y-4">
                                {(() => {
                                    const subs = cat.id === 'B1' ? B1_SUBS : cat.id === 'B2' ? B2_SUBS : cat.id === 'B3' ? B3_SUBS : cat.id === 'B4' ? B4_SUBS : cat.id === 'B5' ? B5_SUBS : B6_SUBS
                                    const subScores = cat.id === 'B1' ? b1SubScores : cat.id === 'B2' ? b2SubScores : cat.id === 'B3' ? b3SubScores : cat.id === 'B4' ? b4SubScores : cat.id === 'B5' ? b5SubScores : b6SubScores
                                    const setSubScores = (cat.id === 'B1' ? setB1SubScores : cat.id === 'B2' ? setB2SubScores : cat.id === 'B3' ? setB3SubScores : cat.id === 'B4' ? setB4SubScores : cat.id === 'B5' ? setB5SubScores : setB6SubScores) as React.Dispatch<React.SetStateAction<Record<string, number>>>

                                    return subs.map((subItem) => {
                                        // Buscar sugerencia de IA para B1 y B6
                                        let aiHint = null
                                        if (cat.id === 'B1' || cat.id === 'B6') {
                                            const aiMatch = aiB1Data.find(t => t.subcategory === `EVAL_${subItem.id}`)
                                            if (aiMatch && aiMatch.ai_score !== null) {
                                                aiHint = { score: aiMatch.ai_score as number, justification: aiMatch.ai_justification }
                                            }
                                        }

                                        const currentScore = subScores[subItem.id] || 1
                                        const SCORE_COLORS = {
                                            1: { bg: 'bg-red-500', text: 'text-red-700', ring: 'ring-red-300', barBg: 'bg-red-100', border: 'border-red-500' },
                                            2: { bg: 'bg-orange-500', text: 'text-orange-700', ring: 'ring-orange-300', barBg: 'bg-orange-100', border: 'border-orange-500' },
                                            3: { bg: 'bg-emerald-600', text: 'text-emerald-700', ring: 'ring-emerald-300', barBg: 'bg-emerald-100', border: 'border-emerald-600' },
                                            4: { bg: 'bg-green-400', text: 'text-green-600', ring: 'ring-green-300', barBg: 'bg-green-100', border: 'border-green-400' },
                                        } as Record<number, any>
                                        const color = SCORE_COLORS[currentScore]

                                        return (
                                            <div key={subItem.id} className="border border-border rounded-lg p-5 space-y-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <span className="font-bold text-primary text-sm bg-primary/10 px-2 py-1 rounded inline-flex items-center gap-2">
                                                            {subItem.id} <span className="text-foreground">{subItem.label}</span>
                                                        </span>
                                                    </div>

                                                    {/* AI Hint Integration (Dimension A style) */}
                                                    {aiHint && (
                                                        <div className="flex items-start gap-2 max-w-sm bg-amber-50 rounded-md border border-amber-200 p-2 text-xs">
                                                            <div className="flex flex-col items-center gap-1 shrink-0 bg-amber-100 p-1.5 rounded">
                                                                <NextImage src="/icons/AIAgent.png" alt="IA" width={28} height={28} />
                                                                <span className="font-bold text-amber-800">{aiHint.score}/4</span>
                                                            </div>
                                                            <p className="text-amber-800/90 leading-tight">
                                                                {aiHint.justification || 'Evaluación sugerida por IA.'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Textual Feedback based on level */}
                                                <p className={`text-sm font-medium ${color.text} min-h-[1.5rem] italic`}>
                                                    "{subItem.levels[currentScore - 1]}"
                                                </p>

                                                {/* Interactive Slider Bar */}
                                                <div className="flex items-center gap-4 pt-2">
                                                    <span className="text-xs text-muted-foreground font-bold shrink-0">Tu calificación:</span>

                                                    {/* Visual Bar */}
                                                    <div className={`flex-1 h-3 rounded-full ${color.barBg} overflow-hidden flex`}>
                                                        <div className={`h-full rounded-full ${color.bg} transition-all duration-300 ease-out`}
                                                            style={{ width: `${(currentScore / 4) * 100}%` }} />
                                                    </div>

                                                    {/* Buttons 1-4 */}
                                                    <div className="flex gap-1.5 shrink-0">
                                                        {[1, 2, 3, 4].map(v => (
                                                            <button key={v} disabled={readOnly}
                                                                onClick={() => setSubScores(prev => ({ ...prev, [subItem.id]: v }))}
                                                                className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm transition-all shadow-sm
                                                                    ${currentScore === v
                                                                        ? `${SCORE_COLORS[v].bg} text-white ring-2 ${SCORE_COLORS[v].ring} scale-110` // Active state
                                                                        : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80' // Inactive state
                                                                    }`}>
                                                                {v}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                })()}

                                {/* Total Category Summary Bar (Dimension A style) */}
                                {(() => {
                                    const subScores = cat.id === 'B1' ? b1SubScores : cat.id === 'B2' ? b2SubScores : cat.id === 'B3' ? b3SubScores : cat.id === 'B4' ? b4SubScores : cat.id === 'B5' ? b5SubScores : b6SubScores
                                    const totalRaw = Object.values(subScores).reduce((a, b) => a + (b || 1), 0)
                                    const maxRaw = (cat.id === 'B1' || cat.id === 'B2') ? 16 : 12
                                    const ratio = totalRaw / maxRaw
                                    const color = ratio < 0.4 ? 'text-red-700 bg-red-500/10 border border-red-200' : ratio < 0.7 ? 'text-orange-700 bg-orange-500/10 border border-orange-200' : 'text-emerald-700 bg-emerald-500/10 border border-emerald-200'
                                    const barColor = ratio < 0.4 ? 'bg-red-500' : ratio < 0.7 ? 'bg-orange-500' : 'bg-emerald-600'

                                    let labelText = ''
                                    if (ratio < 0.4) labelText = 'Requiere Nivelación'
                                    else if (ratio < 0.7) labelText = 'Nivel Básico'
                                    else if (ratio < 0.9) labelText = 'Nivel Funcional'
                                    else labelText = 'Nivel Avanzado / Autonómo'

                                    return (
                                        <div className={`mt-6 p-4 rounded-lg flex flex-col gap-3 ${color}`}>
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <span>Total {cat.id}:</span>
                                                <div className="flex gap-4 items-center">
                                                    <span>{labelText}</span>
                                                    <span className="text-lg font-black font-mono">
                                                        {totalRaw} <span className="text-sm font-semibold opacity-70">/ {maxRaw}</span>
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
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                            Evidencia y Notas del Evaluador ({cat.id})
                                            {comments[cat.id] && <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">Registrado</span>}
                                        </label>
                                        <textarea
                                            value={comments[cat.id]}
                                            disabled={readOnly}
                                            onChange={(e) => setComments(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                            placeholder={`Explica la nota que otorgaste para esta competencia...`}
                                            className="w-full min-h-[100px] p-4 rounded-lg border border-border bg-background text-foreground text-sm focus-visible:ring-2 focus-visible:ring-primary/20 transition-all resize-none shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border pb-10">
                <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="gap-2 shadow-sm">
                    <ArrowUp className="w-4 h-4" /> Ir al principio
                </Button>
                {!readOnly && (
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 h-12 rounded-xl shadow-xl hover:shadow-primary/20 transition-all active:scale-95 text-lg">
                        {isSaving ? (
                            <>
                                <NextImage src="/icons/AIAgent.png" alt="IA" width={40} height={40} className="mr-2 animate-bounce" />
                                Guardando Dimensión B...
                            </>
                        ) : 'Consolidar Dimensión B'}
                    </Button>
                )}
            </div>
        </div>
    )
}
