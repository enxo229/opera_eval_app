'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type UserWithProfile = {
    id: string
    email: string
    full_name: string | null
    role: string | null
    education_level: string | null
    national_id_type: string | null
    national_id: string | null
    created_at: string
}

export type SelectionProcessWithStatus = {
    id: string
    candidate_email: string
    candidate_national_id: string | null
    team: string | null
    observations: string | null
    status: string
    created_at: string
    evaluation_id?: string
    evaluation_status?: string
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
            national_id_type: profile?.national_id_type || null,
            national_id: profile?.national_id || null,
            created_at: u.created_at,
        }
    })
}

export async function createUser(
    email: string, 
    password: string, 
    fullName: string, 
    role: 'candidate' | 'evaluator',
    nationalIdType?: string,
    nationalId?: string,
    team?: string,
    observations?: string,
    confirmPreviousProcesses?: boolean
): Promise<{ success: boolean; error?: string; warning?: string }> {
    const admin = createAdminClient()

    if (role === 'candidate') {
        // Validate active processes
        const { data: activeProcess } = await admin
            .from('selection_processes')
            .select('id')
            .eq('candidate_email', email)
            .eq('status', 'active')
            .limit(1)
            .single()

        if (activeProcess) {
            return { success: false, error: 'Ya existe un proceso activo para este correo. Ciérralo antes de crear uno nuevo.' }
        }

        if (!confirmPreviousProcesses) {
            // Check for previous completed/archived processes
            const { data: pastProcesses } = await admin
                .from('selection_processes')
                .select('id, status')
                .eq('candidate_email', email)
                .in('status', ['completed', 'archived'])
                .limit(1)

            if (pastProcesses && pastProcesses.length > 0) {
                return { success: false, warning: 'Este candidato ya tiene evaluaciones pasadas en el sistema. ¿Deseas crear un nuevo proceso de selección?' }
            }
        }
    }

    let userId: string | null = null;
    let isNewUser = true;

    // Check if user already exists
    const { data: authData } = await admin.auth.admin.listUsers()
    const existingUser = authData?.users.find(u => u.email === email)
    if (existingUser) {
        userId = existingUser.id
        isNewUser = false
    }

    if (isNewUser) {
        // Create auth user
        const { data, error } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        })
        if (error) return { success: false, error: error.message }
        userId = data.user.id

        // Create profile
        const { error: profileError } = await admin.from('profiles').insert({
            id: userId,
            full_name: fullName,
            role,
            national_id_type: nationalIdType || null,
            national_id: nationalId || null,
        })

        if (profileError) {
            // Rollback on fail
            await admin.auth.admin.deleteUser(userId)
            return { success: false, error: profileError.message }
        }
    } else {
        // Re-using user: we update their profile info to match the inputs
        const { error: profileError } = await admin.from('profiles').update({
            full_name: fullName,
            role,
            national_id_type: nationalIdType || null,
            national_id: nationalId || null,
        }).eq('id', userId!)

        if (profileError) {
            return { success: false, error: `Error al actualizar el perfil existente: ${profileError.message}` }
        }
        
        // Also update password if provided
        if (password && password.trim().length >= 6) {
             const { error: pwdError } = await admin.auth.admin.updateUserById(userId!, {
                  password: password.trim()
             })
             if (pwdError) {
                 console.error('Failed to update password for existing user:', pwdError)
             }
        }
    }

    // Create selection process and draft evaluation if candidate
    if (role === 'candidate' && userId) {
        const { data: processData, error: processError } = await admin.from('selection_processes').insert({
            candidate_email: email,
            candidate_national_id: nationalId || null,
            team: team || null,
            observations: observations || null,
            status: 'active'
        }).select('id').single()

        if (processError) {
            console.error("Error al crear el proceso de selección:", processError)
            return { success: false, error: `Error creando proceso: ${processError.message}` }
        } else if (processData) {
            // Also create the Draft Evaluation tied to this process
            await admin.from('evaluations').insert({
                candidate_id: userId,
                selection_process_id: processData.id,
                status: 'draft'
            })
        }
    }

    return { success: true }
}

/**
 * Manually closes an active selection process.
 */
export async function closeSelectionProcess(processId: string): Promise<{ success: boolean; error?: string }> {
    const admin = createAdminClient()
    const { error } = await admin
        .from('selection_processes')
        .update({ status: 'completed' })
        .eq('id', processId)
        
    if (error) {
        console.error('Error closing selection process:', error)
        return { success: false, error: `Error cerrando proceso: ${error.message}` }
    }
    return { success: true }
}

export async function getSelectionProcessHistory(email: string): Promise<SelectionProcessWithStatus[]> {
    const admin = createAdminClient()
    const { data: processes, error } = await admin
        .from('selection_processes')
        .select(`
            *,
            evaluations (id, status)
        `)
        .eq('candidate_email', email)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching history:', error)
        return []
    }

    return (processes || []).map(p => ({
        id: p.id,
        candidate_email: p.candidate_email,
        candidate_national_id: p.candidate_national_id,
        team: p.team,
        observations: p.observations,
        status: p.status,
        created_at: p.created_at,
        evaluation_id: p.evaluations?.[0]?.id,
        evaluation_status: p.evaluations?.[0]?.status
    }))
}

/**
 * Delete a user and their profile.
 * Archives any active selection processes first to allow re-creation with the same email.
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const admin = createAdminClient()

    // 1. Get the user's email before deleting
    const { data: userData } = await admin.auth.admin.getUserById(userId)
    const userEmail = userData?.user?.email

    // 2. Archive any active selection processes for this email
    if (userEmail) {
        await admin
            .from('selection_processes')
            .update({ status: 'archived' })
            .eq('candidate_email', userEmail)
            .eq('status', 'active')
    }

    // 3. Delete auth user (profile cascades via FK, but we clean up just in case)
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return { success: false, error: error.message }

    await admin.from('profiles').delete().eq('id', userId)

    return { success: true }
}

export async function searchHistoricalProcesses(cc: string, email: string, team: string) {
    const admin = createAdminClient()
    
    let query = admin
        .from('selection_processes')
        .select(`
            id, 
            candidate_email, 
            candidate_national_id, 
            team, 
            observations, 
            status, 
            created_at,
            evaluations (id, candidate_id, status, final_score, classification)
        `)
        .order('created_at', { ascending: false })

    if (cc.trim()) {
        query = query.ilike('candidate_national_id', `%${cc.trim()}%`)
    }
    if (email.trim()) {
        query = query.ilike('candidate_email', `%${email.trim()}%`)
    }
    if (team.trim()) {
        query = query.ilike('team', `%${team.trim()}%`)
    }

    const { data, error } = await query.limit(50)

    if (error) {
        console.error('Error in searchHistoricalProcesses:', error)
        throw new Error(error.message)
    }

    return data || []
}

/**
 * Update a user's profile and, if applicable, their active selection process.
 */
export async function updateUser(
    userId: string,
    fullName: string,
    nationalIdType: string,
    nationalId: string,
    password?: string,
    team?: string,
    observations?: string
): Promise<{ success: boolean; error?: string }> {
    const admin = createAdminClient()

    // 1. Update Auth User if password provided
    if (password && password.trim().length >= 6) {
        const { error: authError } = await admin.auth.admin.updateUserById(userId, {
            password: password.trim()
        })
        if (authError) return { success: false, error: `Error actualizando contraseña: ${authError.message}` }
    }

    // 2. Update Profile
    const { error: profileError } = await admin
        .from('profiles')
        .update({
            full_name: fullName,
            national_id_type: nationalIdType,
            national_id: nationalId
        })
        .eq('id', userId)

    if (profileError) return { success: false, error: `Error actualizando perfil: ${profileError.message}` }

    // 3. Update active selection process if it's a candidate
    // We get the user's email first
    const { data: userData } = await admin.auth.admin.getUserById(userId)
    const userEmail = userData?.user?.email

    if (userEmail) {
        // Update active process
        const { error: processError } = await admin
            .from('selection_processes')
            .update({
                team: team || null,
                observations: observations || null,
                candidate_national_id: nationalId || null
            })
            .eq('candidate_email', userEmail)
            .eq('status', 'active')

        if (processError) {
            console.error('Error updating selection process:', processError)
            // We don't return error here because the profile was already updated successfully
        }
    }

    return { success: true }
}

/**
 * Reopens a completed evaluation by setting status to 'draft' and selection process back to 'active'.
 * This is an emergency tool for cases where an evaluation was finalized accidentally.
 */
export async function reopenEvaluation(evaluationId: string): Promise<{ success: boolean; error?: string }> {
    const admin = createAdminClient()

    // 1. Get the evaluation to find the selection_process_id
    const { data: evaluation, error: getError } = await admin
        .from('evaluations')
        .select('selection_process_id')
        .eq('id', evaluationId)
        .single()

    if (getError || !evaluation) {
        return { success: false, error: 'No se encontró la evaluación con ese ID.' }
    }

    // 2. Reopen Evaluation
    const { error: evalUpdateError } = await admin
        .from('evaluations')
        .update({ 
            status: 'draft',
            final_score: null,
            classification: null,
            final_feedback_ai: null
        } as any)
        .eq('id', evaluationId)

    if (evalUpdateError) return { success: false, error: `Error reabriendo evaluación: ${evalUpdateError.message}` }

    // 3. Reopen Selection Process
    if (evaluation.selection_process_id) {
        const { error: procUpdateError } = await admin
            .from('selection_processes')
            .update({ status: 'active' })
            .eq('id', evaluation.selection_process_id)
        
        if (procUpdateError) {
            console.error('Error al reabrir proceso de selección:', procUpdateError)
            // No fallamos aquí porque la evaluación ya se reabrió exitosamente
        }
    }

    return { success: true }
}
