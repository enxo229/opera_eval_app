'use server'

import { createClient } from '@/lib/supabase/server'
import { evaluateA4Chat, A4EvaluationResult } from '@/app/actions/ai'

/**
 * Guarda la sesión de chat completa y dispara la evaluación IA.
 */
export async function saveA4ChatSession(
    evaluationId: string,
    history: string,
    caseContext: string
): Promise<{ success: boolean; evaluations?: A4EvaluationResult[]; error?: string }> {
    const supabase = await createClient()

    // 1. Guardar el historial completo como una sola entrada de telemetría IA_CHAT
    const { error: insertErr } = await supabase.from('dynamic_tests').insert({
        evaluation_id: evaluationId,
        test_type: 'IA_CHAT',
        prompt_context: caseContext,
        candidate_response: history,
    })

    if (insertErr) {
        console.error('Error saving A4 history:', insertErr)
        return { success: false, error: 'No se pudo guardar el historial del chat: ' + insertErr.message }
    }

    // 2. Disparar evaluación IA
    let aiResults: A4EvaluationResult[]
    try {
        aiResults = await evaluateA4Chat(history, caseContext)
    } catch (e: any) {
        console.error('AI evaluation error A4:', e)
        return { success: true, evaluations: undefined, error: 'Chat guardado, pero la evaluación técnica de la IA falló.' }
    }

    // 3. Crear registros detallados para cada subcategoría A4 en dynamic_tests
    for (const result of aiResults) {
        const { error: subScoreErr } = await supabase.from('dynamic_tests').insert({
            evaluation_id: evaluationId,
            test_type: 'QUESTIONS_A4',
            subcategory: result.subcategory,
            prompt_context: result.label,
            candidate_response: '(Evaluación de Chatbot)',
            ai_score: result.score,
            ai_justification: result.justification,
        })

        if (subScoreErr) {
            console.error(`Error saving sub-score ${result.subcategory}:`, subScoreErr)
            // No retornamos inmediatamente para intentar guardar los otros, pero registramos el fallo
            return { success: false, error: `Error al guardar el detalle ${result.subcategory}: ${subScoreErr.message}` }
        }
    }

    return { success: true, evaluations: aiResults }
}

/**
 * Obtiene los resultados A4 para el evaluador.
 */
export async function getA4Results(evaluationId: string): Promise<{
    subcategory: string
    label: string
    ai_score: number | null
    ai_justification: string | null
    history?: string
}[]> {
    const supabase = await createClient()

    const { data: scores } = await supabase
        .from('dynamic_tests')
        .select('subcategory, prompt_context, ai_score, ai_justification')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A4')
        .order('subcategory')

    const { data: historyData } = await supabase
        .from('dynamic_tests')
        .select('candidate_response')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'IA_CHAT')
        .maybeSingle()

    const results = (scores || []).map(s => ({
        subcategory: s.subcategory || '',
        label: s.prompt_context || '',
        ai_score: s.ai_score,
        ai_justification: s.ai_justification,
    }))

    // Si no hay scores pero hay historial, devolvemos al menos un placeholder con el historial
    if (results.length === 0 && historyData) {
        return [{
            subcategory: 'HISTORY_ONLY',
            label: 'Historial de Chat',
            ai_score: null,
            ai_justification: 'Pendiente de evaluación detallada.',
            history: historyData.candidate_response
        }]
    }

    if (results.length > 0 && historyData) {
        // @ts-ignore
        results[0].history = historyData.candidate_response
    }

    return results
}

/**
 * Resetea A4.
 */
export async function resetA4Responses(evaluationId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { error } = await supabase
        .from('dynamic_tests')
        .delete()
        .eq('evaluation_id', evaluationId)
        .in('test_type', ['IA_CHAT', 'QUESTIONS_A4', 'TERMINAL_A4', 'A4_CASE'])

    if (error) return { success: false, error: error.message }
    return { success: true }
}

/**
 * Guarda el texto del caso generado inicialmente para A4.
 */
export async function saveA4Case(evaluationId: string, caseText: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { error } = await supabase.from('dynamic_tests').insert({
        evaluation_id: evaluationId,
        test_type: 'A4_CASE',
        prompt_context: 'Escenario Generado',
        candidate_response: caseText,
    })

    if (error) {
        console.error('Error saving A4 case:', error)
        return { success: false, error: error.message }
    }
    return { success: true }
}

/**
 * Recupera el estado completo de A4: caso, mensajes (historial) y si ya está evaluado.
 */
export async function getA4State(evaluationId: string): Promise<{
    caseText: string | null
    history: string | null
    isFinished: boolean
}> {
    const supabase = await createClient()

    // 1. Obtener el caso
    const { data: caseDoc } = await supabase
        .from('dynamic_tests')
        .select('candidate_response')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'A4_CASE')
        .maybeSingle()

    // 2. Obtener el historial (si existe)
    const { data: historyDoc } = await supabase
        .from('dynamic_tests')
        .select('candidate_response')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'IA_CHAT')
        .maybeSingle()

    // 3. Verificar si ya hay evaluaciones (significa que terminó)
    const { count } = await supabase
        .from('dynamic_tests')
        .select('*', { count: 'exact', head: true })
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A4')

    return {
        caseText: caseDoc?.candidate_response || null,
        history: historyDoc?.candidate_response || null,
        isFinished: (count || 0) > 0
    }
}
