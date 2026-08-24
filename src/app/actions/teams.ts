'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface TeamRecord {
  id: string
  name: string
  description: string | null
  created_at: string
}

/**
 * Fetch all official teams sorted alphabetically.
 */
export async function getTeams(): Promise<TeamRecord[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, description, created_at')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching teams, falling back to admin client:', error)
      const adminClient = createAdminClient()
      const { data: adminData, error: adminError } = await adminClient
        .from('teams')
        .select('id, name, description, created_at')
        .order('name', { ascending: true })

      if (adminError) {
        console.error('Error fetching teams with admin client:', adminError)
        return []
      }
      return (adminData as TeamRecord[]) || []
    }

    return (data as TeamRecord[]) || []
  } catch (err) {
    console.error('Unexpected error in getTeams:', err)
    return []
  }
}

/**
 * Create a new team in the catalog. Name will be converted to uppercase.
 */
export async function createTeam(
  name: string,
  description?: string
): Promise<{ success: boolean; error?: string; team?: TeamRecord }> {
  try {
    const normalizedName = name.trim().toUpperCase()
    if (!normalizedName || normalizedName.length < 2) {
      return { success: false, error: 'El nombre del equipo debe tener al menos 2 caracteres.' }
    }

    const adminClient = createAdminClient()

    // Check if team already exists
    const { data: existing } = await adminClient
      .from('teams')
      .select('id, name')
      .ilike('name', normalizedName)
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        error: `El equipo "${normalizedName}" ya existe en el catálogo.`,
      }
    }

    const { data: newTeam, error } = await adminClient
      .from('teams')
      .insert({
        name: normalizedName,
        description: description?.trim() || null,
      })
      .select('id, name, description, created_at')
      .single()

    if (error) {
      console.error('Error creating team:', error)
      return { success: false, error: 'No se pudo registrar el equipo en la base de datos.' }
    }

    revalidatePath('/evaluator/teams')
    revalidatePath('/evaluator')
    return { success: true, team: newTeam as TeamRecord }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al crear el equipo.'
    return { success: false, error: msg }
  }
}

/**
 * Update an existing team's name and description.
 */
export async function updateTeam(
  id: string,
  name: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedName = name.trim().toUpperCase()
    if (!normalizedName || normalizedName.length < 2) {
      return { success: false, error: 'El nombre del equipo es obligatorio.' }
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('teams')
      .update({
        name: normalizedName,
        description: description?.trim() || null,
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating team:', error)
      return { success: false, error: 'Error al actualizar el equipo.' }
    }

    revalidatePath('/evaluator/teams')
    revalidatePath('/evaluator')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado.'
    return { success: false, error: msg }
  }
}
