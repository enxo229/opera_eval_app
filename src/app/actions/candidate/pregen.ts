'use server'

import { createClient } from '@/lib/supabase/server'
import { generateQuestionsA1, generateQuestionsA2, generateQuestionsA3, generateDynamicCaseA4, generateQuestionsB, generateQuestionsC } from '@/app/actions/ai'
import { saveA1QuestionsOnly } from '@/app/actions/candidate/a1'
import { saveA2QuestionsOnly } from '@/app/actions/candidate/a2'
import { saveA3QuestionsOnly } from '@/app/actions/candidate/a3'
import { saveA4Case } from '@/app/actions/candidate/a4'
import { saveB2QuestionsOnly } from '@/app/actions/candidate/b2'
import { saveCQuestionsOnly } from '@/app/actions/candidate/c'
import { log } from '@/lib/observability/logger'

/**
 * Pre-generates evaluation questions for the specialized track (OTel Expert)
 * when the candidate accepts the T&C / chooses education level.
 * Prevents 10-second wait times during the active exam.
 */
export async function pregenerateTrackQuestions(evaluationId: string, educationLevel: string) {
    const supabase = await createClient()

    try {
        // 1. Fetch selection process profile track
        const { data: evaluation, error: evalErr } = await supabase
            .from('evaluations')
            .select(`
                id,
                selection_processes (profile_track)
            `)
            .eq('id', evaluationId)
            .single()

        if (evalErr || !evaluation) {
            log.error('Could not find evaluation for pre-generation', evalErr)
            return { success: false, error: 'Evaluación no encontrada' }
        }

        const profileTrack = (evaluation.selection_processes as any)?.profile_track || 'general'
        log.info(`Pregenerating questions for track: ${profileTrack}, educationLevel: ${educationLevel}`)

        if (profileTrack === 'otel_expert') {
            // A1 Questions pre-generation
            const { data: existingA1 } = await supabase
                .from('dynamic_tests')
                .select('id')
                .eq('evaluation_id', evaluationId)
                .eq('test_type', 'QUESTIONS_A1')
                .limit(1)

            if (!existingA1 || existingA1.length === 0) {
                log.info('Pre-generating A1 questions (OTel Expert)')
                const a1Questions = await generateQuestionsA1(educationLevel, 'otel_expert')
                await saveA1QuestionsOnly(evaluationId, a1Questions)
            }

            // A2 Questions pre-generation (pre-selecting Grafana)
            const { data: existingA2 } = await supabase
                .from('dynamic_tests')
                .select('id')
                .eq('evaluation_id', evaluationId)
                .eq('test_type', 'QUESTIONS_A2')
                .limit(1)

            if (!existingA2 || existingA2.length === 0) {
                log.info('Pre-generating A2 questions with tool Grafana (OTel Expert)')
                const a2Questions = await generateQuestionsA2('Grafana', educationLevel, 'otel_expert')
                await saveA2QuestionsOnly(evaluationId, 'Grafana', a2Questions)
            }

            // A3 Questions pre-generation (OTel Expert)
            const { data: existingA3 } = await supabase
                .from('dynamic_tests')
                .select('id')
                .eq('evaluation_id', evaluationId)
                .eq('test_type', 'QUESTIONS_A3')
                .limit(1)

            if (!existingA3 || existingA3.length === 0) {
                log.info('Pre-generating A3 questions (OTel Expert)')
                const a3Questions = await generateQuestionsA3(educationLevel, 'otel_expert')
                await saveA3QuestionsOnly(evaluationId, a3Questions, {})
            }

            // A4 Case pre-generation (OTel Expert)
            const { data: existingA4 } = await supabase
                .from('dynamic_tests')
                .select('id')
                .eq('evaluation_id', evaluationId)
                .eq('test_type', 'CHATBOT_A4')
                .limit(1)

            if (!existingA4 || existingA4.length === 0) {
                log.info('Pre-generating A4 case scenario (OTel Expert)')
                const a4Case = await generateDynamicCaseA4('otel_expert')
                await saveA4Case(evaluationId, a4Case)
            }
        }

        // B2-B6 Questions pre-generation (All tracks)
        const { data: existingB2 } = await supabase
            .from('dynamic_tests')
            .select('id')
            .eq('evaluation_id', evaluationId)
            .eq('test_type', 'QUESTIONS_B2')
            .limit(1)

        if (!existingB2 || existingB2.length === 0) {
            log.info('Pre-generating B2-B6 situational questions')
            const bQuestions = await generateQuestionsB(educationLevel, profileTrack)
            await saveB2QuestionsOnly(evaluationId, bQuestions)
        }

        // Section C Questions pre-generation (All tracks)
        const { data: existingC } = await supabase
            .from('dynamic_tests')
            .select('id')
            .eq('evaluation_id', evaluationId)
            .eq('test_type', 'QUESTIONS_C')
            .limit(1)

        if (!existingC || existingC.length === 0) {
            log.info('Pre-generating Section C philosophy questions')
            const cQuestions = await generateQuestionsC(educationLevel, profileTrack)
            await saveCQuestionsOnly(evaluationId, cQuestions)
        }

        return { success: true }
    } catch (err) {
        log.error('Error in pre-generating questions', err as Error)
        return { success: false, error: (err as Error).message }
    }
}
