'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type UserWithProfile = {
    id: string
    email: string
    full_name: string | null
    role: string | null
    education_level: string | null
    created_at: string
}

/**
 * List all users with their profiles
 */
export async function listUsers(): Promise<UserWithProfile[]> {
    const admin = createAdminClient()

    // Get all auth users
    const { data: authData, error: authError } = await admin.auth.admin.listUsers()
    if (authError) throw new Error(authError.message)

    // Get all profiles
    const { data: profiles } = await admin.from('profiles').select('*')

    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    return authData.users.map(u => {
        const profile = profileMap.get(u.id)
        return {
            id: u.id,
            email: u.email || '',
            full_name: profile?.full_name || null,
            role: profile?.role || null,
            education_level: profile?.education_level || null,
            created_at: u.created_at,
        }
    })
}

/**
 * Create a new user with profile
 */
export async function createUser(email: string, password: string, fullName: string, role: 'candidate' | 'evaluator'): Promise<{ success: boolean; error?: string }> {
    const admin = createAdminClient()

    // Create auth user
    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    })

    if (error) return { success: false, error: error.message }

    // Create profile
    const { error: profileError } = await admin.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        role,
    })

    if (profileError) return { success: false, error: profileError.message }

    return { success: true }
}

/**
 * Delete a user and their profile
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const admin = createAdminClient()

    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return { success: false, error: error.message }

    // Profile cascades via FK, but just in case
    await admin.from('profiles').delete().eq('id', userId)

    return { success: true }
}
