import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Proteger rutas /evaluator, /candidate y /admin
    // Si no hay usuario y está en ruta protegida, redirige a login
    if (!user && (
        request.nextUrl.pathname.startsWith('/evaluator') ||
        request.nextUrl.pathname.startsWith('/candidate') ||
        request.nextUrl.pathname.startsWith('/admin')
    )) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Proteger /admin — solo evaluadores pueden acceder
    if (user && request.nextUrl.pathname.startsWith('/admin')) {
        const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const profile = profileData as { role: string } | null
        if (profile?.role !== 'evaluator') {
            const url = request.nextUrl.clone()
            url.pathname = '/candidate'
            return NextResponse.redirect(url)
        }
    }

    // Candidatos deben completar eligibility antes de acceder a /candidate
    if (user && request.nextUrl.pathname === '/candidate') {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('role, education_level')
            .eq('id', user.id)
            .single()
        const profile = profileData as { role: string; education_level: string | null } | null
        if (profile?.role === 'candidate' && !profile.education_level) {
            const url = request.nextUrl.clone()
            url.pathname = '/candidate/eligibility'
            return NextResponse.redirect(url)
        }
    }

    // Si hay usuario y está intentando ir a /login, redirigir a dashboard
    if (user && request.nextUrl.pathname === '/login') {
        // Necesitamos saber su rol para redirigir
        const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const profile = profileData as { role: string } | null

        const url = request.nextUrl.clone()
        if (profile?.role === 'evaluator') {
            url.pathname = '/evaluator'
        } else {
            url.pathname = '/candidate'
        }
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
