import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { metricsApp } from '@/lib/observability/metrics'

/**
 * Supabase Client Factory
 * Proporciona un cliente de Supabase para Server Components / Server Actions.
 * 
 * TIP: Para instrumentar consultas pesadas, utiliza:
 * const start = Date.now();
 * const res = await supabase.from('...').select();
 * metricsApp.recordDbOperation(Date.now() - start, { table: '...', operation: 'select', status: res.error ? 'error' : 'success' });
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<any, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
