'use server'

import { createClient } from '@/lib/supabase/server'
import { evaluateAnswersA1, A1EvaluationResult, evaluateAnswersA2, A2EvaluationResult, evaluateAnswersA3, A3EvaluationResult, evaluateA4Chat, A4EvaluationResult } from '@/app/actions/ai'

/**
 * Persists A1 questions right after generation so they survive reloads.
 */
export async function saveA1QuestionsOnly(
    evaluationId: string,
    questions: {
        subcategory: string
        label: string
        question: string
    }[]
) {
    const supabase = await createClient()

    await supabase.from('dynamic_tests').delete()
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A1')

    for (const q of questions) {
        await supabase.from('dynamic_tests').insert({
            evaluation_id: evaluationId,
            test_type: 'QUESTIONS_A1',
            subcategory: q.subcategory,
            prompt_context: q.question,
            candidate_response: '',
        })
    }
    return { success: true }
}

/**
 * Persists A1 question responses and triggers AI evaluation.
 * Each question/answer becomes a record in dynamic_tests with subcategory.
 */
export async function saveA1Responses(
    evaluationId: string,
    questionsAndAnswers: {
        subcategory: string
        label: string
        question: string
        answer: string
    }[]
): Promise<{ success: boolean; evaluations?: A1EvaluationResult[]; error?: string }> {
    const supabase = await createClient()

    // 1. Clean existing records and save each Q&A to dynamic_tests
    await supabase.from('dynamic_tests').delete()
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A1')

    for (const qa of questionsAndAnswers) {
        const { error } = await supabase.from('dynamic_tests').insert({
            evaluation_id: evaluationId,
            test_type: 'QUESTIONS_A1',
            subcategory: qa.subcategory,
            prompt_context: qa.question,
            candidate_response: qa.answer,
        })
        if (error) {
            console.error('Error saving A1 response:', error)
            return { success: false, error: error.message }
        }
    }

    // 2. Run AI evaluation
    let aiResults: A1EvaluationResult[]
    try {
        aiResults = await evaluateAnswersA1(questionsAndAnswers)
    } catch (e: any) {
        console.error('AI evaluation error:', e)
        return { success: true, evaluations: undefined, error: 'Las respuestas se guardaron pero la evaluación IA falló.' }
    }

    // 3. Update each dynamic_test with the AI score
    for (const result of aiResults) {
        await supabase
            .from('dynamic_tests')
            .update({
                ai_score: result.score,
                ai_justification: result.justification,
            })
            .eq('evaluation_id', evaluationId)
            .eq('test_type', 'QUESTIONS_A1')
            .eq('subcategory', result.subcategory)
    }

    return { success: true, evaluations: aiResults }
}

/**
 * Get A1 evaluation results for the evaluator view
 */
export async function getA1Results(evaluationId: string): Promise<{
    subcategory: string
    question: string
    answer: string
    ai_score: number | null
    ai_justification: string | null
}[]> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('dynamic_tests')
        .select('subcategory, prompt_context, candidate_response, ai_score, ai_justification')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A1')
        .order('subcategory')

    return (data || []).map(d => ({
        subcategory: d.subcategory || '',
        question: d.prompt_context || '',
        answer: d.candidate_response || '',
        ai_score: d.ai_score,
        ai_justification: d.ai_justification,
    }))
}

/**
 * Reset A1 responses — evaluator only.
 */
export async function resetA1Responses(evaluationId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'evaluator') return { success: false, error: 'Solo evaluadores pueden resetear respuestas' }

    const { error } = await supabase
        .from('dynamic_tests')
        .delete()
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A1')

    if (error) {
        console.error('Error resetting A1:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// =====================
// A2 Server Actions
// =====================

/**
 * Persists A2 questions right after generation so they survive reloads
 * before the candidate actually submits their answers.
 */
export async function saveA2QuestionsOnly(
    evaluationId: string,
    tool: string,
    questions: {
        subcategory: string
        label: string
        question: string
    }[]
) {
    const supabase = await createClient()

    // Clean any existing A2 test data just in case
    await supabase.from('dynamic_tests').delete()
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A2')

    for (const q of questions) {
        await supabase.from('dynamic_tests').insert({
            evaluation_id: evaluationId,
            test_type: 'QUESTIONS_A2',
            subcategory: q.subcategory,
            prompt_context: q.question,
            candidate_response: '', // Empty initially
            ai_generated_content: tool,
        })
    }
    return { success: true }
}

/**
 * Persists A2 question responses and triggers AI evaluation.
 * Stores the selected tool in ai_generated_content for reference.
 */
export async function saveA2Responses(
    evaluationId: string,
    tool: string,
    questionsAndAnswers: {
        subcategory: string
        label: string
        question: string
        answer: string
    }[]
): Promise<{ success: boolean; evaluations?: A2EvaluationResult[]; error?: string }> {
    const supabase = await createClient()

    // Clean any existing A2 test data to avoid duplicates from saveA2QuestionsOnly
    await supabase.from('dynamic_tests').delete()
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A2')

    for (const qa of questionsAndAnswers) {
        const { error } = await supabase.from('dynamic_tests').insert({
            evaluation_id: evaluationId,
            test_type: 'QUESTIONS_A2',
            subcategory: qa.subcategory,
            prompt_context: qa.question,
            candidate_response: qa.answer,
            ai_generated_content: tool,
        })
        if (error) {
            console.error('Error saving A2 response:', error)
            return { success: false, error: error.message }
        }
    }

    let aiResults: A2EvaluationResult[]
    try {
        aiResults = await evaluateAnswersA2(questionsAndAnswers)
    } catch (e: any) {
        console.error('AI evaluation error:', e)
        return { success: true, evaluations: undefined, error: 'Las respuestas se guardaron pero la evaluación IA falló.' }
    }

    for (const result of aiResults) {
        await supabase
            .from('dynamic_tests')
            .update({
                ai_score: result.score,
                ai_justification: result.justification,
            })
            .eq('evaluation_id', evaluationId)
            .eq('test_type', 'QUESTIONS_A2')
            .eq('subcategory', result.subcategory)
    }

    return { success: true, evaluations: aiResults }
}

/**
 * Get A2 evaluation results for the evaluator view
 */
export async function getA2Results(evaluationId: string): Promise<{
    subcategory: string
    question: string
    answer: string
    ai_score: number | null
    ai_justification: string | null
    tool: string | null
}[]> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('dynamic_tests')
        .select('subcategory, prompt_context, candidate_response, ai_score, ai_justification, ai_generated_content')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A2')
        .order('subcategory')

    return (data || []).map(d => ({
        subcategory: d.subcategory || '',
        question: d.prompt_context || '',
        answer: d.candidate_response || '',
        ai_score: d.ai_score,
        ai_justification: d.ai_justification,
        tool: d.ai_generated_content || null,
    }))
}

/**
 * Reset A2 responses — evaluator only.
 */
export async function resetA2Responses(evaluationId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'evaluator') return { success: false, error: 'Solo evaluadores pueden resetear respuestas' }

    const { error } = await supabase
        .from('dynamic_tests')
        .delete()
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A2')

    if (error) {
        console.error('Error resetting A2:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// =====================
// A3 Server Actions
// =====================

/**
 * Persists A3 questions right after generation so they survive reloads.
 */
export async function saveA3QuestionsOnly(
    evaluationId: string,
    questions: {
        subcategory: string
        label: string
        question: string
    }[],
    initialAnswers: Record<string, string>
) {
    const supabase = await createClient()

    await supabase.from('dynamic_tests').delete()
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A3')

    for (const q of questions) {
        await supabase.from('dynamic_tests').insert({
            evaluation_id: evaluationId,
            test_type: 'QUESTIONS_A3',
            subcategory: q.subcategory,
            prompt_context: q.question,
            candidate_response: initialAnswers[q.subcategory] || '',
        })
    }
    return { success: true }
}

/**
 * Persists A3 question responses and triggers AI evaluation.
 */
export async function saveA3Responses(
    evaluationId: string,
    questionsAndAnswers: {
        subcategory: string
        label: string
        question: string
        answer: string
    }[],
    terminalCommands: string[] = []
): Promise<{ success: boolean; evaluations?: A3EvaluationResult[]; error?: string }> {
    const supabase = await createClient()

    // Save terminal commands if any
    if (terminalCommands.length > 0) {
        await supabase.from('dynamic_tests').insert({
            evaluation_id: evaluationId,
            test_type: 'TERMINAL_A3',
            prompt_context: 'Terminal Commands Execution',
            candidate_response: JSON.stringify(terminalCommands),
        })
    }

    // Clean any existing A3 test data to avoid duplicates from saveA3QuestionsOnly
    await supabase.from('dynamic_tests').delete()
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A3')

    for (const qa of questionsAndAnswers) {
        const { error } = await supabase.from('dynamic_tests').insert({
            evaluation_id: evaluationId,
            test_type: 'QUESTIONS_A3',
            subcategory: qa.subcategory,
            prompt_context: qa.question,
            candidate_response: qa.answer,
        })
        if (error) {
            console.error('Error saving A3 response:', error)
            return { success: false, error: error.message }
        }
    }

    let aiResults: A3EvaluationResult[]
    try {
        aiResults = await evaluateAnswersA3(questionsAndAnswers)
    } catch (e: any) {
        console.error('AI evaluation error:', e)
        return { success: true, evaluations: undefined, error: 'Las respuestas se guardaron pero la evaluación IA falló.' }
    }

    for (const result of aiResults) {
        await supabase
            .from('dynamic_tests')
            .update({
                ai_score: result.score,
                ai_justification: result.justification,
            })
            .eq('evaluation_id', evaluationId)
            .eq('test_type', 'QUESTIONS_A3')
            .eq('subcategory', result.subcategory)
    }

    return { success: true, evaluations: aiResults }
}

/**
 * Get A3 evaluation results for the evaluator view
 */
export async function getA3Results(evaluationId: string): Promise<{
    subcategory: string
    question: string
    answer: string
    ai_score: number | null
    ai_justification: string | null
}[]> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('dynamic_tests')
        .select('subcategory, prompt_context, candidate_response, ai_score, ai_justification')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A3')
        .order('subcategory')

    return (data || []).map(d => ({
        subcategory: d.subcategory || '',
        question: d.prompt_context || '',
        answer: d.candidate_response || '',
        ai_score: d.ai_score,
        ai_justification: d.ai_justification,
    }))
}

/**
 * Reset A3 responses — evaluator only.
 */
export async function resetA3Responses(evaluationId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'evaluator') return { success: false, error: 'Solo evaluadores pueden resetear respuestas' }

    const { error } = await supabase
        .from('dynamic_tests')
        .delete()
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_A3')

    if (error) {
        console.error('Error resetting A3:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// =====================
// A4 Server Actions
// =====================

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

/**
 * Resetea Dimensión B.
 */
export async function resetBResponses(evaluationId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'evaluator') return { success: false, error: 'Solo evaluadores pueden resetear respuestas' }

    const { error } = await supabase
        .from('dynamic_tests')
        .delete()
        .eq('evaluation_id', evaluationId)
        .in('test_type', ['B1_CASE', 'B1_TICKET', 'QUESTIONS_B1', 'QUESTIONS_B2', 'QUESTIONS_B3', 'QUESTIONS_B4', 'QUESTIONS_B5', 'QUESTIONS_B6'])

    if (error) return { success: false, error: error.message }
    return { success: true }
}

/**
 * Guarda el escenario del incidente generado para B1.
 * Evita duplicados verificando si ya existe.
 */
export async function saveB1Case(
    evaluationId: string,
    caseText: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Verificar si ya existe
    const { data: existing } = await supabase
        .from('dynamic_tests')
        .select('id')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'B1_TICKET')
        .eq('subcategory', 'CASE')
        .maybeSingle()

    if (existing) return { success: true }

    const { error } = await supabase.from('dynamic_tests').insert({
        evaluation_id: evaluationId,
        test_type: 'B1_TICKET',
        subcategory: 'CASE',
        candidate_response: caseText,
    })

    if (error) {
        console.error('SERVER ACTION ERROR: saveB1Case failed:', error.message)
        return { success: false, error: `DB Error: ${error.message}.` }
    }
    return { success: true }
}

/**
 * Guarda el ticket de B1 y dispara evaluación IA.
 */
export async function saveB1Response(
    evaluationId: string,
    ticketText: string,
    caseContext: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // 1. Guardar el ticket
    const { error: insertErr } = await supabase.from('dynamic_tests').insert({
        evaluation_id: evaluationId,
        test_type: 'B1_TICKET',
        subcategory: 'RESPONSE',
        prompt_context: caseContext,
        candidate_response: ticketText,
    })

    if (insertErr) {
        console.error('Error saving B1 response:', insertErr)
        return { success: false, error: insertErr.message }
    }

    // 2. Disparar evaluación IA
    try {
        const { evaluateTicketB1Detailed, evaluateTicketB6Detailed } = await import('@/app/actions/ai')

        // Ejecutar ambas evaluaciones en paralelo
        const [aiResults, aiB6Results] = await Promise.all([
            evaluateTicketB1Detailed(ticketText, caseContext),
            evaluateTicketB6Detailed(ticketText)
        ])

        // 3. Guardar resultados de IA (usando prefijo EVAL_)
        const mapping = [
            // B1
            { sub: 'EVAL_B1.1', label: 'Estructura del registro', data: aiResults.estructura },
            { sub: 'EVAL_B1.2', label: 'Precisión técnica', data: aiResults.precision_tecnica },
            { sub: 'EVAL_B1.3', label: 'Acciones documentadas', data: aiResults.acciones_documentadas },
            { sub: 'EVAL_B1.4', label: 'Impacto descrito', data: aiResults.impacto },
            // B6
            { sub: 'EVAL_B6.1', label: 'Handoff / Traspaso', data: aiB6Results.handoff },
            { sub: 'EVAL_B6.2', label: 'Claridad en bloqueos', data: aiB6Results.claridad_bloqueos },
            { sub: 'EVAL_B6.3', label: 'Seguimiento de acuerdos', data: aiB6Results.seguimiento_acuerdos },
        ]


        for (const item of mapping) {
            const { error: aiErr } = await supabase.from('dynamic_tests').insert({
                evaluation_id: evaluationId,
                test_type: 'B1_TICKET',
                subcategory: item.sub,
                prompt_context: item.label,
                candidate_response: '(Evaluación de Ticket B1)',
                ai_score: item.data.puntaje,
                ai_justification: item.data.comentario,
            })
            if (aiErr) console.error(`Error saving AI result for ${item.sub}:`, aiErr)
        }
    } catch (e) {
        console.error('AI evaluation error B1:', e)
    }

    return { success: true }
}

/**
 * Recupera el estado de B1.
 */
export async function getB1State(evaluationId: string): Promise<{
    ticketText: string | null
    caseText: string | null
    isFinished: boolean
}> {
    const supabase = await createClient()

    // 1. Buscar el ticket (usamos .select().limit(1) por si acaso hay duplicados orfandos)
    const { data: ticketData } = await supabase
        .from('dynamic_tests')
        .select('candidate_response')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'B1_TICKET')
        .eq('subcategory', 'RESPONSE')
        .limit(1)
        .maybeSingle()

    // 2. Buscar el caso
    const { data: caseData } = await supabase
        .from('dynamic_tests')
        .select('candidate_response')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'B1_TICKET')
        .eq('subcategory', 'CASE')
        .limit(1)
        .maybeSingle()

    return {
        ticketText: ticketData?.candidate_response || null,
        caseText: caseData?.candidate_response || null,
        isFinished: !!ticketData
    }
}

/**
 * Dispara manualmente la evaluación de un ticket B1 existente.
 */
export async function triggerB1Evaluation(evaluationId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // 1. Obtener el ticket y el caso
    const state = await getB1State(evaluationId)
    if (!state.ticketText || !state.caseText) return { success: false, error: 'No hay ticket o caso para evaluar' }

    // 2. Limpiar evaluaciones previas de B1 (si existen)
    await supabase.from('dynamic_tests').delete().eq('evaluation_id', evaluationId).eq('test_type', 'B1_TICKET').like('subcategory', 'EVAL_%')

    // 3. Evaluar
    try {
        const { evaluateTicketB1Detailed, evaluateTicketB6Detailed } = await import('@/app/actions/ai')

        const [aiResults, aiB6Results] = await Promise.all([
            evaluateTicketB1Detailed(state.ticketText, state.caseText),
            evaluateTicketB6Detailed(state.ticketText)
        ])

        const mapping = [
            // B1
            { sub: 'EVAL_B1.1', label: 'Estructura del registro', data: aiResults.estructura },
            { sub: 'EVAL_B1.2', label: 'Precisión técnica', data: aiResults.precision_tecnica },
            { sub: 'EVAL_B1.3', label: 'Acciones documentadas', data: aiResults.acciones_documentadas },
            { sub: 'EVAL_B1.4', label: 'Impacto descrito', data: aiResults.impacto },
            // B6
            { sub: 'EVAL_B6.1', label: 'Handoff / Traspaso', data: aiB6Results.handoff },
            { sub: 'EVAL_B6.2', label: 'Claridad en bloqueos', data: aiB6Results.claridad_bloqueos },
            { sub: 'EVAL_B6.3', label: 'Seguimiento de acuerdos', data: aiB6Results.seguimiento_acuerdos },
        ]

        for (const item of mapping) {
            const { error: aiErr } = await supabase.from('dynamic_tests').insert({
                evaluation_id: evaluationId,
                test_type: 'B1_TICKET',
                subcategory: item.sub,
                prompt_context: item.label,
                candidate_response: '(Evaluación de Ticket B1)',
                ai_score: item.data.puntaje,
                ai_justification: item.data.comentario,
            })
            if (aiErr) return { success: false, error: `Error DB: ${aiErr.message}` }
        }
    } catch (e: any) {
        return { success: false, error: e.message }
    }

    return { success: true }
}

// =====================
// IA-2 Server Actions
// =====================

/**
 * Guarda el prompt formulado por el candidato para IA-2 y dispara la evaluación de Gemini.
 */
export async function saveIA2Prompt(evaluationId: string, promptText: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    try {
        const { evaluateIA2Prompt } = await import('@/lib/ai/gemini')

        // 1. Evaluar con Gemini
        const aiResponse = await evaluateIA2Prompt(promptText)
        let parsedResult: any = {}
        try {
            const cleaned = aiResponse.replace(/```json/ig, '').replace(/```/g, '').trim()
            parsedResult = JSON.parse(cleaned)
        } catch (e) {
            console.error('Failed to parse Gemini JSON for IA-2:', aiResponse)
            return { success: false, error: 'Respuesta inválida de IA.' }
        }

        // 2. Guardar en dynamic_tests
        const { error: dbErr } = await supabase.from('dynamic_tests').insert({
            evaluation_id: evaluationId,
            test_type: 'PROMPT_IA2',
            subcategory: 'PROMPT',
            candidate_response: promptText,
            ai_generated_content: JSON.stringify(parsedResult),
            ai_score: parsedResult.suggested_score,
            ai_justification: `Contexto: ${parsedResult.context_analysis} | Claridad: ${parsedResult.clarity_analysis} | Feedback al evaluador: ${parsedResult.feedback_to_evaluator}`,
        })

        if (dbErr) throw dbErr

        return { success: true }
    } catch (error: any) {
        console.error('Error in saveIA2Prompt:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Recupera el estado actual del prompt IA-2 del candidato.
 */
export async function getIA2State(evaluationId: string): Promise<{
    promptText: string | null
    aiAnalysis: any | null
    isFinished: boolean
}> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('dynamic_tests')
        .select('candidate_response, ai_generated_content')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'PROMPT_IA2')
        .eq('subcategory', 'PROMPT')
        .limit(1)
        .maybeSingle()

    let aiAnalysis = null
    if (data?.ai_generated_content) {
        try {
            aiAnalysis = JSON.parse(data.ai_generated_content)
        } catch (e) {
            // ignore JSON parse error
        }
    }

    return {
        promptText: data?.candidate_response || null,
        aiAnalysis,
        isFinished: !!data
    }
}

/**
 * Reset de las pruebas IA-2 (Solo Evaluador).
 */
export async function resetIAResponses(evaluationId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'evaluator') return { success: false, error: 'Solo evaluadores pueden resetear respuestas' }

    const { error } = await supabase
        .from('dynamic_tests')
        .delete()
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'PROMPT_IA2')

    if (error) {
        console.error('Error resetting IA-2:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

