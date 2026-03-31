'use server'

import { createClient } from '@/lib/supabase/server'

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
