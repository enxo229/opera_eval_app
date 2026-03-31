'use server'

import { createClient } from '@/lib/supabase/server'
import { evaluateAnswersA2, A2EvaluationResult } from '@/app/actions/ai'

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
