'use server'

import { createClient } from '@/lib/supabase/server'
import { evaluateAnswersA3, A3EvaluationResult } from '@/app/actions/ai'

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
