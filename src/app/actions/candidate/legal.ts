'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Saves the legal consent for a specific evaluation.
 * Complies with Law 1581 (Habeas Data) by recording express consent.
 */
export async function saveLegalConsent(evaluationId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('evaluations')
        .update({
            legal_consent_tc: true,
            legal_consent_data: true,
            legal_accepted_at: new Date().toISOString(),
        })
        .eq('id', evaluationId)

    if (error) {
        console.error(' Error saving legal consent:', error)
        return { success: false, error: error.message }
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/candidate', 'layout')

    return { success: true }
}

/**
 * Checks if the legal consent has already been given for this evaluation.
 */
export async function getLegalConsentStatus(evaluationId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('evaluations')
        .select('legal_consent_tc, legal_consent_data')
        .eq('id', evaluationId)
        .single()

    if (error) {
        console.error(' Error fetching legal consent status:', error)
        return { accepted: false }
    }

    return {
        accepted: !!(data?.legal_consent_tc && data?.legal_consent_data)
    }
}
