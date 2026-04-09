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

/**
 * Resumen de lo que se evidenció en los módulos reactivos para dar contexto a la IA.
 */
function buildAIContext(evaluation: any, scores: any[], tests: any[], profile: any) {
    const finalResult = calculateFinalScoreAndClassification(
        calculateDimensionA({ 
            a1: scores.find(s => s.category === 'A1')?.raw_score || 0,
            a2: scores.find(s => s.category === 'A2')?.raw_score || 0,
            a3: scores.find(s => s.category === 'A3')?.raw_score || 0,
            a4: scores.find(s => s.category === 'A4')?.raw_score || 0
        }),
        calculateDimensionB({
            b1: scores.find(s => s.category === 'B1')?.raw_score || 0,
            b2: scores.find(s => s.category === 'B2')?.raw_score || 0,
            b3: scores.find(s => s.category === 'B3')?.raw_score || 0,
            b4: scores.find(s => s.category === 'B4')?.raw_score || 0,
            b5: scores.find(s => s.category === 'B5')?.raw_score || 0,
            b6: scores.find(s => s.category === 'B6')?.raw_score || 0
        }),
        calculateDimensionC({
            c1: scores.find(s => s.category === 'C1')?.raw_score || 0,
            c2: scores.find(s => s.category === 'C2')?.raw_score || 0,
            c3: scores.find(s => s.category === 'C3')?.raw_score || 0,
            c4: scores.find(s => s.category === 'C4')?.raw_score || 0
        })
    )

    const commentsBlock = scores
        .filter(s => s.comments)
        .map(s => `[${s.category}] Puntaje: ${s.raw_score}. Comentario: ${s.comments}`)
        .join('\n')

    const reactiveTestsBlock = tests
        .filter(t => t.test_type === 'A4_CASE' || t.test_type === 'B1_TICKET' || t.test_type === 'PROMPT_IA2')
        .map(t => {
            if (t.test_type === 'B1_TICKET') return `[B1 Ticket] Respuesta: ${t.candidate_response}\nEvaluación IA B1: ${t.ai_justification}`
            if (t.test_type === 'IA_CHAT' || t.test_type === 'A4_CASE') return `[A4 Caso/Chat] Diagnóstico: ${t.ai_justification}`
            return `[${t.test_type}] Respuesta: ${t.candidate_response}`
        })
        .join('\n\n')

    return `
CANDIDATO: ${profile?.full_name || 'Desconocido'}
EDUCACIÓN: ${profile?.education_level || 'N/A'}
SCORE GLOBAL: ${finalResult.score}/100 - ${finalResult.classification}

SUBTOTALES:
Dimension A: ${evaluation.score_a || '-'}/50
Dimension B: ${evaluation.score_b || '-'}/30
Dimension C: ${evaluation.score_c || '-'}/20
Dimension IA: ${evaluation.score_ia || '-'}/10

COMENTARIOS DEL EVALUADOR:
${commentsBlock}

EVIDENCIAS DIRECTAS:
${reactiveTestsBlock}
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
            dimension_scores (*),
            dynamic_tests (*)
        `)
        .eq('id', evaluationId)
        .single()

    if (evalErr || !evaluation) {
        throw new Error('No se pudo encontrar la evaluación o los datos asociados.')
    }

    const scores = (evaluation.dimension_scores as any[]) || []
    const tests = (evaluation.dynamic_tests as any[]) || []
    const profile = evaluation.profiles as any

    // 2. Ejecutar Cálculos de Totales
    const getRaw = (cat: string) => scores.find(s => s.category === cat)?.raw_score || 0
    const subA = await calculateDimensionA({ a1: getRaw('A1'), a2: getRaw('A2'), a3: getRaw('A3'), a4: getRaw('A4') })
    const subB = await calculateDimensionB({ b1: getRaw('B1'), b2: getRaw('B2'), b3: getRaw('B3'), b4: getRaw('B4'), b5: getRaw('B5'), b6: getRaw('B6') })
    const subC = await calculateDimensionC({ c1: getRaw('C1'), c2: getRaw('C2'), c3: getRaw('C3'), c4: getRaw('C4') })
    const subIA = await calculateDimensionIA({ ia1: getRaw('IA-1'), ia2: getRaw('IA-2') })
    const finalResult = await calculateFinalScoreAndClassification(subA, subB, subC)

    // 3. Generar Feedback IA
    const contextForIA = buildAIContext({ ...evaluation, score_a: subA, score_b: subB, score_c: subC, score_ia: subIA }, scores, tests, profile)
    const aiFeedback = await generateNarrativeFeedback(contextForIA)

    // 4. Actualizar Evaluación en DB
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

    if (updateErr) throw updateErr

    // 5. MARCAR PROCESO DE SELECCIÓN COMO COMPLETADO
    if (evaluation.selection_process_id) {
        await supabase
            .from('selection_processes')
            .update({ status: 'completed' })
            .eq('id', evaluation.selection_process_id)
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
            dimension_scores (*),
            dynamic_tests (*)
        `)
        .eq('id', evaluationId)
        .single()

    if (evalErr || !evaluation) throw new Error('Evaluación no encontrada.')

    const scores = (evaluation.dimension_scores as any[]) || []
    const tests = (evaluation.dynamic_tests as any[]) || []
    const profile = evaluation.profiles as any

    const contextForIA = buildAIContext(evaluation, scores, tests, profile)

    // Usamos el import dinámico para evitar dependencias circulares y forzar el modelo lite
    const { generateNarrativeFeedbackLite } = await import('../ai')
    
    // Llamada forzada al modelo Lite (Estrategia de respaldo)
    const aiFeedback = await generateNarrativeFeedbackLite(contextForIA)

    const { error: updateErr } = await supabase
        .from('evaluations')
        .update({ final_feedback_ai: aiFeedback })
        .eq('id', evaluationId)

    if (updateErr) throw updateErr

    return { success: true }
}
