'use server'

import { createClient } from '@/lib/supabase/server'
import { BQuestion, generateQuestionsB, evaluateQuestionGeneric } from '@/app/actions/ai'

export async function saveB2QuestionsOnly(
    evaluationId: string,
    questions: BQuestion[]
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: existing } = await supabase
        .from('dynamic_tests')
        .select('id')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_B2')

    if (existing && existing.length > 0) return { success: true }

    const rows = questions.map(q => ({
        evaluation_id: evaluationId,
        test_type: 'QUESTIONS_B2',
        subcategory: q.subcategory,
        prompt_context: q.question,
        ai_generated_content: q.label,
        candidate_response: null
    }))

    const { error } = await supabase.from('dynamic_tests').insert(rows)
    if (error) return { success: false, error: error.message }

    return { success: true }
}

export async function saveB2Responses(
    evaluationId: string,
    answers: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: tests, error: fetchErr } = await supabase
        .from('dynamic_tests')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_B2')

    if (fetchErr || !tests) return { success: false, error: fetchErr?.message || 'No tests found' }

    for (const test of tests) {
        const candidateResp = answers[test.subcategory] || ''
        const evalResult = await evaluateQuestionGeneric(
            test.subcategory,
            test.prompt_context || '',
            candidateResp
        )

        await supabase
            .from('dynamic_tests')
            .update({
                candidate_response: candidateResp,
                ai_score: evalResult.score,
                ai_justification: evalResult.justification,
                ai_likelihood: evalResult.aiLikelihood.percentage
            })
            .eq('id', test.id)

        // Upsert dimension score for evaluator
        const { data: existingScore } = await supabase
            .from('dimension_scores')
            .select('id')
            .eq('evaluation_id', evaluationId)
            .eq('dimension', 'B')
            .eq('category', test.subcategory)
            .maybeSingle()

        await supabase.from('dimension_scores').upsert({
            ...(existingScore ? { id: existingScore.id } : {}),
            evaluation_id: evaluationId,
            dimension: 'B',
            category: test.subcategory,
            raw_score: evalResult.score,
            evaluator_comment: `IA Sugiere (${evalResult.score}/3): ${evalResult.justification}`
        })
    }

    return { success: true }
}

export async function getB2Results(evaluationId: string) {
    const supabase = await createClient()

    const { data: tests } = await supabase
        .from('dynamic_tests')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_B2')
        .order('subcategory', { ascending: true })

    if (!tests || tests.length === 0) {
        return { questions: [], answers: {}, submitted: false, aiResults: null }
    }

    const questions: BQuestion[] = tests.map(t => ({
        subcategory: t.subcategory,
        label: t.ai_generated_content || t.subcategory,
        question: t.prompt_context
    }))

    const answers: Record<string, string> = {}
    let submitted = false
    const aiResults: { subcategory: string; score: number; justification: string; likelihood?: number }[] = []

    tests.forEach(t => {
        if (t.candidate_response !== null) {
            answers[t.subcategory] = t.candidate_response
            submitted = true
        }
        if (t.ai_score !== null) {
            aiResults.push({
                subcategory: t.subcategory,
                score: t.ai_score,
                justification: t.ai_justification || '',
                likelihood: t.ai_likelihood ?? undefined
            })
        }
    })

    return { questions, answers, submitted, aiResults: aiResults.length > 0 ? aiResults : null }
}

/**
 * Re-evalúa con IA las respuestas situacionales de B2.
 */
export async function triggerB2Evaluation(evaluationId: string): Promise<{ success: boolean; error?: string; count?: number }> {
    const supabase = await createClient()

    const { data: tests, error: fetchErr } = await supabase
        .from('dynamic_tests')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_B2')

    if (fetchErr || !tests || tests.length === 0) {
        return { success: false, error: 'No se encontraron preguntas de B2 para evaluar' }
    }

    let evaluatedCount = 0
    for (const test of tests) {
        if (!test.candidate_response) continue

        const evalResult = await evaluateQuestionGeneric(
            test.subcategory,
            test.prompt_context || '',
            test.candidate_response
        )

        await supabase
            .from('dynamic_tests')
            .update({
                ai_score: evalResult.score,
                ai_justification: evalResult.justification,
                ai_likelihood: evalResult.aiLikelihood.percentage
            })
            .eq('id', test.id)

        // Upsert dimension score for evaluator
        const { data: existingScore } = await supabase
            .from('dimension_scores')
            .select('id')
            .eq('evaluation_id', evaluationId)
            .eq('dimension', 'B')
            .eq('category', test.subcategory)
            .maybeSingle()

        await supabase.from('dimension_scores').upsert({
            ...(existingScore ? { id: existingScore.id } : {}),
            evaluation_id: evaluationId,
            dimension: 'B',
            category: test.subcategory,
            raw_score: evalResult.score,
            comments: `IA Sugiere (${evalResult.score}/3): ${evalResult.justification}`
        })
        evaluatedCount++
    }

    return { success: true, count: evaluatedCount }
}

/**
 * Resetea exclusivamente las respuestas situacionales de B2.
 */
export async function resetB2Responses(evaluationId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'evaluator') return { success: false, error: 'Solo evaluadores pueden resetear respuestas' }

    const { error: delTestsErr } = await supabase
        .from('dynamic_tests')
        .delete()
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_B2')

    if (delTestsErr) return { success: false, error: delTestsErr.message }

    await supabase
        .from('dimension_scores')
        .delete()
        .eq('evaluation_id', evaluationId)
        .eq('dimension', 'B')
        .in('category', ['B2', 'B2.1', 'B2.2', 'B2.3', 'B2.4'])

    return { success: true }
}

