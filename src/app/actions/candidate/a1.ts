'use server'

import { createClient } from '@/lib/supabase/server'
import { evaluateAnswersA1, A1EvaluationResult } from '@/app/actions/ai'

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
