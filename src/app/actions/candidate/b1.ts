'use server'

import { createClient } from '@/lib/supabase/server'

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
