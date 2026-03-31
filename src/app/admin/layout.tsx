import { Button } from '@/components/ui/button'
import { LogOut, Shield, History } from 'lucide-react'
import Link from 'next/link'
import { CompanyLogo } from '@/components/CompanyLogo'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="border-b bg-card px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <CompanyLogo width={80} height={30} />
                    <div className="h-6 w-px bg-border mx-1" />
                    <span className="font-semibold tracking-wide text-foreground">O11y SkillFlow / Admin</span>
                    <Shield className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <Link href="/evaluator/history" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-all font-medium">
                        <History className="w-4 h-4" /> Búsqueda Global
                    </Link>
                    <Link href="/evaluator" className="text-muted-foreground hover:text-primary transition-colors">
                        ← Volver al Evaluador
                    </Link>
                    <form action="/auth/signout" method="post">
                        <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-red-500 hover:bg-red-50 px-2">
                            <LogOut className="w-4 h-4 mr-1" />
                            Salir
                        </Button>
                    </form>
                </div>
            </header>
            <main className="flex-1 overflow-auto flex justify-center py-10 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-5xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
