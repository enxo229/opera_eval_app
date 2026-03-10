import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase Admin client using the Service Role Key.
 * This bypasses RLS and can manage auth users (create, delete, etc).
 * ONLY use in server actions / server components. NEVER expose to client.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Check your .env.local')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
