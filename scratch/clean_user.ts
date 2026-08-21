import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function inspectAndClean() {
    const email = 'userseti@seti.com.co'
    console.log(`=== Inspeccionando usuario: ${email} ===`)

    // 1. Check Auth User
    const { data: authData } = await supabase.auth.admin.listUsers()
    const user = authData?.users.find(u => u.email === email)

    if (user) {
        console.log(`Usuario Auth encontrado: ID = ${user.id}`)
    } else {
        console.log(`Usuario Auth no encontrado para ${email}`)
    }

    // 2. Check Selection Processes
    const { data: processes } = await supabase
        .from('selection_processes')
        .select('*, evaluations(*)')
        .eq('candidate_email', email)

    console.log(`Procesos de selección encontrados (${processes?.length || 0}):`)
    console.log(JSON.stringify(processes, null, 2))

    if (user) {
        // Delete auth user (cascades profiles and evaluations)
        console.log(`Eliminando usuario de Auth (${user.id})...`)
        const { error: delErr } = await supabase.auth.admin.deleteUser(user.id)
        if (delErr) {
            console.error('Error eliminando usuario de auth:', delErr)
        } else {
            console.log('Usuario de Auth eliminado exitosamente.')
        }

        // Delete profile if not cascaded
        await supabase.from('profiles').delete().eq('id', user.id)
    }

    // Delete all selection processes for this email
    console.log(`Eliminando procesos de selección para ${email}...`)
    const { error: procDelErr } = await supabase
        .from('selection_processes')
        .delete()
        .eq('candidate_email', email)

    if (procDelErr) {
        console.error('Error eliminando procesos:', procDelErr)
    } else {
        console.log('Procesos de selección eliminados exitosamente.')
    }

    console.log('=== Limpieza completada ===')
}

inspectAndClean()
