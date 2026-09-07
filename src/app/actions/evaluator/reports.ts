'use server'

import { createClient } from '@/lib/supabase/server'
import { 
    calculateDimensionA, 
    calculateDimensionB, 
    calculateDimensionC, 
    calculateDimensionIA, 
    calculateFinalScoreAndClassification 
} from '../evaluation'
import { generateNarrativeFeedback } from '../ai'
import { log } from '@/lib/observability/logger'
import { metricsApp } from '@/lib/observability/metrics'
import { closeSelectionProcess } from '../admin'

/**
 * Resumen de lo que se evidenció en los módulos reactivos para dar contexto a la IA.
 */
async function buildAIContext(evaluation: any, scores: any[], tests: any[], profile: any, profileTrack?: string) {
    const track = profileTrack || (evaluation.selection_processes as any)?.profile_track || evaluation.profile_track || 'general'
    const isOtel = track === 'otel_expert'

    const subA = evaluation.score_a !== undefined && evaluation.score_a !== null
        ? evaluation.score_a
        : await calculateDimensionA({ 
            a1: scores.find(s => s.category === 'A1')?.raw_score || 0,
            a2: scores.find(s => s.category === 'A2')?.raw_score || 0,
            a3: scores.find(s => s.category === 'A3')?.raw_score || 0,
            a4: scores.find(s => s.category === 'A4')?.raw_score || 0
        }, track)
    
    const subB = evaluation.score_b !== undefined && evaluation.score_b !== null
        ? evaluation.score_b
        : await calculateDimensionB({
            b1: scores.find(s => s.category === 'B1')?.raw_score || 0,
            b2: scores.find(s => s.category === 'B2')?.raw_score || 0,
            b3: scores.find(s => s.category === 'B3')?.raw_score || 0,
            b4: scores.find(s => s.category === 'B4')?.raw_score || 0,
            b5: scores.find(s => s.category === 'B5')?.raw_score || 0,
            b6: scores.find(s => s.category === 'B6')?.raw_score || 0
        }, track)

    const subC = evaluation.score_c !== undefined && evaluation.score_c !== null
        ? evaluation.score_c
        : await calculateDimensionC({
            c1: scores.find(s => s.category === 'C1')?.raw_score || 0,
            c2: scores.find(s => s.category === 'C2')?.raw_score || 0,
            c3: scores.find(s => s.category === 'C3')?.raw_score || 0,
            c4: scores.find(s => s.category === 'C4')?.raw_score || 0
        }, track)

    const subIA = !isOtel
        ? (evaluation.score_ia !== undefined && evaluation.score_ia !== null
            ? evaluation.score_ia
            : await calculateDimensionIA({
                ia1: scores.find(s => (s.dimension === 'IA' || s.dimension === 'D') && s.category === 'IA-1')?.raw_score || 0,
                ia2: scores.find(s => (s.dimension === 'IA' || s.dimension === 'D') && s.category === 'IA-2')?.raw_score || 0
            }))
        : null

    const finalResult = await calculateFinalScoreAndClassification(subA, subB, subC, track)

    const commentsBlock = scores
        .filter(s => s.comments)
        .map(s => `[${s.category}] Puntaje: ${s.raw_score}. Comentario: ${s.comments}`)
        .join('\n')

    // Evidencias estructuradas por submódulo
    const b1Case = tests.find(t => t.test_type === 'B1_CASE' || (t.test_type === 'B1_TICKET' && t.subcategory === 'CASE'))
    const b1Ticket = tests.find(t => t.test_type === 'B1_TICKET' && (t.subcategory === 'RESPONSE' || t.subcategory === 'TICKET' || (!t.subcategory?.startsWith('EVAL_') && t.subcategory !== 'CASE')))
    const b1AIEvals = tests.filter(t => t.test_type === 'B1_TICKET' && t.subcategory?.startsWith('EVAL_'))

    const qA1 = tests.filter(t => t.test_type === 'QUESTIONS_A1').sort((a, b) => (a.subcategory || '').localeCompare(b.subcategory || ''))
    const qA2 = tests.filter(t => t.test_type === 'QUESTIONS_A2').sort((a, b) => (a.subcategory || '').localeCompare(b.subcategory || ''))
    const qA3 = tests.filter(t => t.test_type === 'QUESTIONS_A3').sort((a, b) => (a.subcategory || '').localeCompare(b.subcategory || ''))
    const qB2 = tests.filter(t => t.test_type === 'QUESTIONS_B2').sort((a, b) => (a.subcategory || '').localeCompare(b.subcategory || ''))
    const qC = tests.filter(t => t.test_type === 'QUESTIONS_C').sort((a, b) => (a.subcategory || '').localeCompare(b.subcategory || ''))
    const a4 = tests.find(t => t.test_type === 'A4_CASE' || t.test_type === 'IA_CHAT')
    const termA1 = tests.find(t => t.test_type === 'TERMINAL_A1')
    const bypassPaste = evaluation.bypass_paste_count || tests.filter(t => t.test_type === 'SECURITY_AUDIT').length

    const evidenceParts: string[] = []

    if (qA1.length > 0) {
        evidenceParts.push(`--- A1: ${isOtel ? 'Estándar OpenTelemetry (API vs SDK, Collector, OTLP, eBPF)' : 'Linux & Cloud'} ---\n` +
            qA1.map(q => `[${q.subcategory}] ${q.prompt_context}\nRespuesta del candidato: ${q.candidate_response}\n(Puntaje IA: ${q.ai_score}/3. Justificación: ${q.ai_justification || 'N/A'}${q.ai_likelihood !== null && q.ai_likelihood !== undefined ? `. Prob. IA: ${q.ai_likelihood}%` : ''})`).join('\n\n'))
    }

    if (termA1?.candidate_response) {
        evidenceParts.push(`--- A1: Terminal Linux Sandbox ---\nComandos ejecutados: ${termA1.candidate_response}`)
    }

    if (qA2.length > 0) {
        evidenceParts.push(`--- A2: ${isOtel ? 'Ecosistema Grafana Cloud (Alloy Flow, Mimir PromQL, Loki LogQL, Tempo/Pyroscope)' : 'Observabilidad y Dynatrace/Grafana'} ---\n` +
            qA2.map(q => `[${q.subcategory}] ${q.prompt_context}\nRespuesta del candidato: ${q.candidate_response}\n(Puntaje IA: ${q.ai_score}/3. Justificación: ${q.ai_justification || 'N/A'}${q.ai_likelihood !== null && q.ai_likelihood !== undefined ? `. Prob. IA: ${q.ai_likelihood}%` : ''})`).join('\n\n'))
    }

    if (qA3.length > 0) {
        evidenceParts.push(`--- A3: ${isOtel ? 'Sampling & Reglas OTTL (tail_sampling, transform processor)' : 'Git & Pandas'} ---\n` +
            qA3.map(q => `[${q.subcategory}] ${q.prompt_context}\nRespuesta del candidato: ${q.candidate_response}\n(Puntaje IA: ${q.ai_score}/3. Justificación: ${q.ai_justification || 'N/A'}${q.ai_likelihood !== null && q.ai_likelihood !== undefined ? `. Prob. IA: ${q.ai_likelihood}%` : ''})`).join('\n\n'))
    }

    if (a4) {
        evidenceParts.push(`--- A4: Troubleshooting de Incidentes en Vivo ---\nCaso: ${a4.prompt_context || 'N/A'}\nInvestigación: ${a4.candidate_response || 'N/A'}\nDiagnóstico IA: ${a4.ai_justification || 'N/A'}`)
    }

    if (b1Ticket || b1Case) {
        evidenceParts.push(`--- B1: Ticket de Incidente ${isOtel ? 'SRE (ITSM / P1 / SLOs)' : 'GLPI'} ---\nCaso asignado: ${b1Case?.prompt_context || b1Case?.candidate_response || 'N/A'}\nTicket redactado por el candidato:\n${b1Ticket?.candidate_response || 'No enviado'}\nProbabilidad IA del ticket: ${b1Ticket?.ai_likelihood ?? 'N/A'}%\nEvaluación detallada IA de B1:\n${b1AIEvals.map(e => `- ${e.prompt_context}: Puntaje ${e.ai_score}/4. ${e.ai_justification}`).join('\n')}`)
    }

    if (qB2.length > 0) {
        evidenceParts.push(`--- B2: Competencias Situacionales ${isOtel ? 'SRE (Mitigación vs Preservación, Colaboración Blameless)' : 'y Comunicación'} ---\n` +
            qB2.map(q => `[${q.subcategory}] Escenario: ${q.prompt_context}\nRespuesta del candidato: ${q.candidate_response}\n(Puntaje IA: ${q.ai_score}/3. ${q.ai_justification || ''}${q.ai_likelihood !== null && q.ai_likelihood !== undefined ? `. Prob. IA: ${q.ai_likelihood}%` : ''})`).join('\n\n'))
    }

    if (qC.length > 0) {
        evidenceParts.push(`--- Dimensión C: Cultura & Filosofía ${isOtel ? 'SRE (Blameless, SLOs y Error Budgets)' : 'Actitudinal (Aprendizaje, Adaptabilidad, Proyección)'} ---\n` +
            qC.map(q => `[${q.subcategory}] Pregunta: ${q.prompt_context}\nReflexión del candidato: ${q.candidate_response}\n(Puntaje IA: ${q.ai_score}/3. ${q.ai_justification || ''}${q.ai_likelihood !== null && q.ai_likelihood !== undefined ? `. Prob. IA: ${q.ai_likelihood}%` : ''})`).join('\n\n'))
    }

    if (bypassPaste > 0) {
        evidenceParts.push(`--- AUDITORÍA DE INTEGRIDAD ---\nIntentos de pegado bloqueados detectados: ${bypassPaste}`)
    }

    return `
CANDIDATO: ${profile?.full_name || 'Desconocido'}
EDUCACIÓN: ${profile?.education_level || 'N/A'}
PERFIL / TRACK: ${track} (${isOtel ? 'SRE Experto en OpenTelemetry & Grafana Cloud' : 'Analista de Observabilidad Junior'})
SCORE GLOBAL: ${finalResult.score}/100 - ${finalResult.classification}

SUBTOTALES PONDERADOS:
Dimensión A (Técnica): ${subA}/50 pts
Dimensión B (Blandas / Situacional): ${subB}/30 pts
Dimensión C (Cultura / Filosofía SRE): ${subC}/20 pts
${!isOtel ? `Dimensión IA: ${subIA || 0}/10 pts` : 'Dimensión IA: N/A (Excluida en track otel_expert; 100% concentrado en A, B y C)'}

COMENTARIOS DEL EVALUADOR:
${commentsBlock || 'Sin comentarios adicionales.'}

EVIDENCIAS Y RESPUESTAS DEL CANDIDATO:
${evidenceParts.join('\n\n')}
    `.trim()
}

/**
 * Completa la evaluación y genera el reporte narrativo con IA de forma atómica.
 */
export async function finalizeEvaluationAndGenerateReport(evaluationId: string) {
    const supabase = await createClient()

    // 1. Obtener la evaluación y los datos relacionados
    const { data: evaluation, error: evalErr } = await supabase
        .from('evaluations')
        .select(`
            *,
            profiles:candidate_id (full_name, education_level),
            selection_processes (profile_track),
            dimension_scores (*),
            dynamic_tests (*)
        `)
        .eq('id', evaluationId)
        .single()

    if (evalErr || !evaluation) {
        log.db.error('No se pudo encontrar la evaluación o los datos asociados.', evalErr, { evaluationId });
        throw new Error('No se pudo encontrar la evaluación o los datos asociados.')
    }

    const scores = (evaluation.dimension_scores as any[]) || []
    const tests = (evaluation.dynamic_tests as any[]) || []
    const profile = evaluation.profiles as any
    const profileTrack = (evaluation.selection_processes as any)?.profile_track || evaluation.profile_track || 'general'

    // 2. Ejecutar Cálculos de Totales
    const getRaw = (cat: string) => scores.find(s => s.category === cat)?.raw_score || 0
    const subA = await calculateDimensionA({ a1: getRaw('A1'), a2: getRaw('A2'), a3: getRaw('A3'), a4: getRaw('A4') }, profileTrack)
    const subB = await calculateDimensionB({ b1: getRaw('B1'), b2: getRaw('B2'), b3: getRaw('B3'), b4: getRaw('B4'), b5: getRaw('B5'), b6: getRaw('B6') }, profileTrack)
    const subC = await calculateDimensionC({ c1: getRaw('C1'), c2: getRaw('C2'), c3: getRaw('C3'), c4: getRaw('C4') }, profileTrack)
    const subIA = await calculateDimensionIA({ ia1: getRaw('IA-1'), ia2: getRaw('IA-2') })
    const finalResult = await calculateFinalScoreAndClassification(subA, subB, subC, profileTrack)

    // 3. Generar Feedback IA
    const contextForIA = await buildAIContext({ ...evaluation, score_a: subA, score_b: subB, score_c: subC, score_ia: subIA }, scores, tests, profile, profileTrack)
    
    log.info('Generando feedback narrativo con IA', { evaluationId, profileTrack });
    const aiFeedback = await generateNarrativeFeedback(contextForIA, profileTrack)
    log.info('Feedback narrativo generado exitosamente', { evaluationId });

    const startUpdate = Date.now()
    const { error: updateErr } = await supabase
        .from('evaluations')
        .update({
            score_a: subA,
            score_b: subB,
            score_c: subC,
            score_ia: subIA,
            final_score: finalResult.score,
            classification: finalResult.classification,
            status: 'completed',
            final_feedback_ai: aiFeedback
        } as any)
        .eq('id', evaluationId)

    if (updateErr) {
        metricsApp.recordDbOperation(Date.now() - startUpdate, { table: 'evaluations', operation: 'update', status: 'error' });
        log.db.error('Error actualizando evaluación a completada', updateErr, { evaluationId });
        throw updateErr
    }

    metricsApp.recordDbOperation(Date.now() - startUpdate, { table: 'evaluations', operation: 'update', status: 'success' });
    metricsApp.recordEvaluationFinalized({ status: 'completed' });

    // 5. MARCAR PROCESO DE SELECCIÓN COMO COMPLETADO
    if (evaluation.selection_process_id) {
        await closeSelectionProcess(evaluation.selection_process_id)
    }

    return { success: true, finalScore: finalResult.score }
}

/**
 * Regenera manualmente el reporte narrativo de IA usando la estrategia de respaldo (modelo Lite).
 */
export async function regenerateNarrativeFeedbackManual(evaluationId: string) {
    const supabase = await createClient()

    const { data: evaluation, error: evalErr } = await supabase
        .from('evaluations')
        .select(`
            *,
            profiles:candidate_id (full_name, education_level),
            selection_processes (profile_track),
            dimension_scores (*),
            dynamic_tests (*)
        `)
        .eq('id', evaluationId)
        .single()

    if (evalErr || !evaluation) {
        log.db.error('Evaluación no encontrada para regeneración manual.', evalErr, { evaluationId });
        throw new Error('Evaluación no encontrada.')
    }

    const scores = (evaluation.dimension_scores as any[]) || []
    const tests = (evaluation.dynamic_tests as any[]) || []
    const profile = evaluation.profiles as any
    const profileTrack = (evaluation.selection_processes as any)?.profile_track || evaluation.profile_track || 'general'

    const contextForIA = await buildAIContext(evaluation, scores, tests, profile, profileTrack)

    // Usamos el import dinámico para evitar dependencias circulares y forzar el modelo lite
    const { generateNarrativeFeedbackLite } = await import('../ai')
    
    // Llamada forzada al modelo Lite (Estrategia de respaldo)
    log.info('Regenerando feedback narrativo manualmente (Modelo Lite)', { evaluationId, profileTrack });
    const aiFeedback = await generateNarrativeFeedbackLite(contextForIA, profileTrack)
    log.info('Feedback regenerado exitosamente', { evaluationId });

    const { error: updateErr } = await supabase
        .from('evaluations')
        .update({ final_feedback_ai: aiFeedback })
        .eq('id', evaluationId)

    if (updateErr) {
        log.db.error('Error actualizando feedback regenerado', updateErr, { evaluationId });
        throw updateErr
    }

    log.info('Manual feedback regeneration complete', { evaluationId });
    return { success: true }
}
