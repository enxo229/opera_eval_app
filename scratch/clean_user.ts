import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function inspectAndClean(targetEmail: string) {
    const email = targetEmail.trim().toLowerCase()
    console.log(`=== Limpiando usuario: ${email} ===`)

    // 1. Check Auth User
    const { data: authData } = await supabase.auth.admin.listUsers()
    const user = authData?.users.find(u => u.email?.toLowerCase() === email)

    if (user) {
        console.log(`[Auth] Usuario encontrado: ID = ${user.id}`)
    } else {
        console.log(`[Auth] Usuario no encontrado para ${email}`)
    }

    // 2. Check Selection Processes
    const { data: processes } = await supabase
        .from('selection_processes')
        .select('id, candidate_email, team, status, profile_track')
        .eq('candidate_email', email)

    const processIds = (processes || []).map(p => p.id)
    console.log(`[Procesos] Encontrados (${processIds.length}):`, processIds)

    // 3. Find Evaluations
    let evalIds: string[] = []
    if (user?.id) {
        const { data: evalsByCand } = await supabase
            .from('evaluations')
            .select('id')
            .eq('candidate_id', user.id)
        if (evalsByCand) evalIds.push(...evalsByCand.map(e => e.id))
    }
    if (processIds.length > 0) {
        const { data: evalsByProc } = await supabase
            .from('evaluations')
            .select('id')
            .in('selection_process_id', processIds)
        if (evalsByProc) evalIds.push(...evalsByProc.map(e => e.id))
    }
    evalIds = Array.from(new Set(evalIds))
    console.log(`[Evaluaciones] Encontradas (${evalIds.length}):`, evalIds)

    // 4. Delete dynamic_tests & dimension_scores
    if (evalIds.length > 0) {
        console.log(`Eliminando pruebas dinámicas asociadas...`)
        const { error: dtErr } = await supabase
            .from('dynamic_tests')
            .delete()
            .in('evaluation_id', evalIds)
        if (dtErr) console.error('Error eliminando dynamic_tests:', dtErr)

        console.log(`Eliminando dimension_scores asociadas...`)
        const { error: dsErr } = await supabase
            .from('dimension_scores')
            .delete()
            .in('evaluation_id', evalIds)
        if (dsErr) console.error('Error eliminando dimension_scores:', dsErr)

        console.log(`Eliminando evaluaciones...`)
        const { error: evErr } = await supabase
            .from('evaluations')
            .delete()
            .in('id', evalIds)
        if (evErr) console.error('Error eliminando evaluations:', evErr)
    }

    // 5. Delete Selection Processes
    if (processIds.length > 0) {
        console.log(`Eliminando procesos de selección...`)
        const { error: procErr } = await supabase
            .from('selection_processes')
            .delete()
            .in('id', processIds)
        if (procErr) console.error('Error eliminando selection_processes:', procErr)
    }

    // 6. Delete Profile
    if (user?.id) {
        console.log(`Eliminando perfil de base de datos...`)
        const { error: profErr } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id)
        if (profErr) console.error('Error eliminando profile:', profErr)

        // 7. Delete Auth User
        console.log(`Eliminando usuario de Supabase Auth...`)
        const { error: delAuthErr } = await supabase.auth.admin.deleteUser(user.id)
        if (delAuthErr) {
            console.error('Error eliminando usuario de auth:', delAuthErr)
        } else {
            console.log(`Usuario Auth ${user.id} eliminado correctamente.`)
        }
    }

    console.log(`=== Limpieza de ${email} finalizada con éxito ===`)
}

const target = process.argv[2] || 'tester@seti.com.co'
inspectAndClean(target)
