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
 * Gets the current timer state for an evaluation, including pause information.
 */
export async function getTimerState(evaluationId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('evaluations')
        .select('started_at, test_duration_minutes, paused_at, total_paused_ms, pause_count')
        .eq('id', evaluationId)
        .single()

    if (error) {
        return { 
            startedAt: null, 
            duration: 90, 
            pausedAt: null, 
            totalPausedMs: 0,
            pauseCount: 0
        }
    }

    return {
        startedAt: data.started_at,
        duration: data.test_duration_minutes || 60,
        pausedAt: data.paused_at,
        totalPausedMs: data.total_paused_ms || 0,
        pauseCount: data.pause_count || 0
    }
}

/**
 * Pauses the evaluation timer.
 * Increments pause_count and sets paused_at.
 */
export async function pauseEvaluation(evaluationId: string) {
    const supabase = await createClient()
    const now = new Date().toISOString()
    
    // Check pause count
    const { data: current, error: fetchError } = await supabase
        .from('evaluations')
        .select('pause_count, paused_at')
        .eq('id', evaluationId)
        .single()
        
    if (fetchError) return { success: false, error: fetchError.message }
    if (current?.paused_at) return { success: true } // Already paused
    if ((current?.pause_count || 0) >= 2) return { success: false, error: 'Has alcanzado el límite máximo de 2 pausas.' }

    const { error } = await supabase
        .from('evaluations')
        .update({
            paused_at: now,
            pause_count: (current?.pause_count || 0) + 1
        })
        .eq('id', evaluationId)
    
    if (error) return { success: false, error: error.message }
    
    return { success: true }
}

/**
 * Resumes the evaluation timer.
 * Calculates elapsed pause time and adds it to total_paused_ms.
 */
export async function resumeEvaluation(evaluationId: string) {
    const supabase = await createClient()
    const now = new Date()
    
    // Get current pause state
    const { data: current, error: fetchError } = await supabase
        .from('evaluations')
        .select('paused_at, total_paused_ms')
        .eq('id', evaluationId)
        .single()
        
    if (fetchError) return { success: false, error: fetchError.message }
    if (!current?.paused_at) return { success: true } // Not paused

    const pausedAt = new Date(current.paused_at)
    const deltaMs = now.getTime() - pausedAt.getTime()
    const newTotalMs = Number(current.total_paused_ms || 0) + deltaMs

    const { error } = await supabase
        .from('evaluations')
        .update({
            paused_at: null,
            total_paused_ms: newTotalMs
        })
        .eq('id', evaluationId)
        
    if (error) return { success: false, error: error.message }
    
    return { success: true }
}
