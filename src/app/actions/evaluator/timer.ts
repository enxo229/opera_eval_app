'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Adjusts the evaluation timer by adding minutes or setting an exact duration.
 * Only evaluators should call this.
 */
export async function adjustEvaluationTime(
    evaluationId: string,
    action: 'add' | 'set',
    minutes: number
): Promise<{ success: boolean; newDuration?: number; error?: string }> {
    if (minutes <= 0 || minutes > 180) {
        return { success: false, error: 'El tiempo debe estar entre 1 y 180 minutos.' }
    }

    const supabase = await createClient()

    if (action === 'set') {
        const { data, error } = await supabase
            .from('evaluations')
            .update({ test_duration_minutes: minutes })
            .eq('id', evaluationId)
            .select('test_duration_minutes')
            .single()

        if (error) return { success: false, error: error.message }
        return { success: true, newDuration: data.test_duration_minutes }
    }

    // action === 'add'
    const { data: current, error: fetchError } = await supabase
        .from('evaluations')
        .select('test_duration_minutes')
        .eq('id', evaluationId)
        .single()

    if (fetchError) return { success: false, error: fetchError.message }

    const newDuration = (current.test_duration_minutes || 60) + minutes

    if (newDuration > 180) {
        return { success: false, error: 'El tiempo total no puede exceder 180 minutos.' }
    }

    const { data, error } = await supabase
        .from('evaluations')
        .update({ test_duration_minutes: newDuration })
        .eq('id', evaluationId)
        .select('test_duration_minutes')
        .single()

    if (error) return { success: false, error: error.message }
    return { success: true, newDuration: data.test_duration_minutes }
}
