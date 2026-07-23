'use server'

import { createClient } from '@/lib/supabase/server'
import { CQuestion, generateQuestionsC, evaluateQuestionGeneric } from '@/app/actions/ai'

export async function saveCQuestionsOnly(
    evaluationId: string,
    questions: CQuestion[]
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: existing } = await supabase
        .from('dynamic_tests')
        .select('id')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_C')

    if (existing && existing.length > 0) return { success: true }

    const rows = questions.map(q => ({
        evaluation_id: evaluationId,
        test_type: 'QUESTIONS_C',
        subcategory: q.subcategory,
        prompt_context: q.question,
        ai_generated_content: q.label,
        candidate_response: null
    }))

    const { error } = await supabase.from('dynamic_tests').insert(rows)
    if (error) return { success: false, error: error.message }

    return { success: true }
}

export async function saveCResponses(
    evaluationId: string,
    answers: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: tests, error: fetchErr } = await supabase
        .from('dynamic_tests')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_C')

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
            .eq('dimension', 'C')
            .eq('category', test.subcategory)
            .maybeSingle()

        await supabase.from('dimension_scores').upsert({
            ...(existingScore ? { id: existingScore.id } : {}),
            evaluation_id: evaluationId,
            dimension: 'C',
            category: test.subcategory,
            raw_score: evalResult.score,
            evaluator_comment: `IA Sugiere (${evalResult.score}/3): ${evalResult.justification}`
        })
    }

    return { success: true }
}

export async function getCResults(evaluationId: string) {
    const supabase = await createClient()

    const { data: tests } = await supabase
        .from('dynamic_tests')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'QUESTIONS_C')
        .order('subcategory', { ascending: true })

    if (!tests || tests.length === 0) {
        return { questions: [], answers: {}, submitted: false, aiResults: null }
    }

    const questions: CQuestion[] = tests.map(t => ({
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
