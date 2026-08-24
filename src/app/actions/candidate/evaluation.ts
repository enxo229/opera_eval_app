'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Starts the evaluation timer for a candidate by setting the `started_at` timestamp.
 * This should only be called once when the candidate clicks "Start Evaluation".
 */
export async function startEvaluationTimer(evaluationId: string) {
    const supabase = await createClient()

    // First check if it's already started to avoid resets
    const { data: existing } = await supabase
        .from('evaluations')
        .select('started_at')
        .eq('id', evaluationId)
        .single()

    if (existing?.started_at) {
        return { success: true, startedAt: existing.started_at }
    }

    const now = new Date().toISOString()
    const { error } = await supabase
        .from('evaluations')
        .update({
            started_at: now
        })
        .eq('id', evaluationId)

    if (error) {
        console.error('Error starting evaluation timer:', error)
        return { success: false, error: error.message }
    }

    return { success: true, startedAt: now }
}

/**
 * Gets the current timer state for an evaluation.
 * Note: Timer is strictly continuous and cannot be paused.
 */
export async function getTimerState(evaluationId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('evaluations')
        .select('started_at, test_duration_minutes, pause_count')
        .eq('id', evaluationId)
        .single()

    if (error) {
        return { 
            startedAt: null, 
            duration: 60, 
            tabSwitchCount: 0
        }
    }

    return {
        startedAt: data.started_at,
        duration: data.test_duration_minutes || 60,
        tabSwitchCount: data.pause_count || 0
    }
}

/**
 * Records a window/tab switch attempt for integrity tracking.
 * Increments pause_count (used as tab switch counter) and logs to dynamic_tests.
 * Returns the updated switch count and whether the limit of 4 was reached/exceeded.
 */
export async function recordTabSwitch(evaluationId: string): Promise<{
    success: boolean
    newCount: number
    limitReached: boolean
    error?: string
}> {
    const supabase = await createClient()
    const now = new Date().toISOString()

    // Fetch current count
    const { data: current, error: fetchError } = await supabase
        .from('evaluations')
        .select('pause_count')
        .eq('id', evaluationId)
        .single()

    if (fetchError) {
        console.error('Error fetching tab switch count:', fetchError)
        return { success: false, newCount: 0, limitReached: false, error: fetchError.message }
    }

    const newCount = (current?.pause_count || 0) + 1

    // Update count in evaluations
    const { error: updateError } = await supabase
        .from('evaluations')
        .update({ pause_count: newCount })
        .eq('id', evaluationId)

    if (updateError) {
        console.error('Error updating tab switch count:', updateError)
        return { success: false, newCount, limitReached: newCount >= 4, error: updateError.message }
    }

    // Log the event in dynamic_tests for audit telemetry
    await supabase.from('dynamic_tests').insert({
        evaluation_id: evaluationId,
        test_type: 'TAB_SWITCH_EVENT',
        subcategory: `INTENTO_${newCount}`,
        prompt_context: `Cambio de ventana/pestaña #${newCount} detectado a las ${now}`,
        candidate_response: JSON.stringify({
            attempt: newCount,
            timestamp: now,
            maxAllowed: 4,
            isExceeded: newCount > 4
        })
    })

    return {
        success: true,
        newCount,
        limitReached: newCount >= 4
    }
}

/**
 * @deprecated Use recordTabSwitch instead. Preserved for backward compatibility.
 */
export async function pauseEvaluation(evaluationId: string) {
    const res = await recordTabSwitch(evaluationId)
    return { success: res.success, error: res.error }
}

/**
 * @deprecated Preserved for backward compatibility. Timer is continuous and does not require resume.
 */
export async function resumeEvaluation(evaluationId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true }
}

/**
 * Persists security paste-bypass attempt by candidate in dynamic_tests.
 */
export async function recordBypassAttempt(evaluationId: string) {
    const supabase = await createClient()
    if (!evaluationId) return { success: false }

    const { error } = await supabase.from('dynamic_tests').insert({
        evaluation_id: evaluationId,
        test_type: 'SECURITY_AUDIT',
        subcategory: 'BYPASS_PASTE',
        candidate_response: 'Intentó pegar texto en el editor (Evento onPaste bloqueado)',
    })

    try {
        const { data } = await supabase.from('evaluations').select('bypass_paste_count').eq('id', evaluationId).single()
        if (data && data.bypass_paste_count !== undefined) {
            await supabase.from('evaluations').update({ bypass_paste_count: (data.bypass_paste_count || 0) + 1 }).eq('id', evaluationId)
        }
    } catch {
        // Ignorar si no existe columna
    }

    if (error) {
        console.error('Error recording bypass attempt:', error)
        return { success: false, error: error.message }
    }
    return { success: true }
}

/**
 * Gets total paste bypass attempts for evaluator view.
 */
export async function getBypassAttempts(evaluationId: string): Promise<number> {
    const supabase = await createClient()
    if (!evaluationId) return 0

    const { count } = await supabase
        .from('dynamic_tests')
        .select('id', { count: 'exact', head: true })
        .eq('evaluation_id', evaluationId)
        .eq('test_type', 'SECURITY_AUDIT')
        .eq('subcategory', 'BYPASS_PASTE')

    return count || 0
}
