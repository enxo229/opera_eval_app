import { Button } from '@/components/ui/button'
import { CompanyLogo } from '@/components/CompanyLogo'
import { LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const email = user?.email || 'Candidato'

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Topbar Light/Corporate Mode */}
            <header className="border-b bg-card px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <CompanyLogo width={80} height={30} />
                    <div className="h-6 w-px bg-border mx-1" />
                    <span className="font-semibold tracking-wide text-foreground">O11y SkillFlow / Focus Mode</span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        Evaluación en curso
                    </div>
                    <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full border border-border">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span className="font-mono text-xs text-foreground font-medium">{email}</span>
                    </div>
                    <form action="/auth/signout" method="post">
                        <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-red-500 hover:bg-red-50 px-2">
                            <LogOut className="w-4 h-4 mr-1" />
                            Salir
                        </Button>
                    </form>
                </div>
            </header>

            {/* Contenido amplio y responsivo */}
            <main className="flex-1 overflow-auto flex justify-center py-10 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
