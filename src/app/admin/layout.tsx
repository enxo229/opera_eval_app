import { Button } from '@/components/ui/button'
import { LogOut, Shield, History, ArrowLeft } from 'lucide-react'
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
                <div className="flex items-center gap-2">
                    <Link href="/evaluator/history">
                        <Button variant="outline" size="sm" className="border-border text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary font-semibold gap-1.5 shadow-xs transition-all">
                            <History className="w-4 h-4 text-primary shrink-0" />
                            <span>Búsqueda Global</span>
                        </Button>
                    </Link>
                    <Link href="/evaluator">
                        <Button variant="outline" size="sm" className="border-border text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary font-semibold gap-1.5 shadow-xs transition-all">
                            <ArrowLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span>Volver al Evaluador</span>
                        </Button>
                    </Link>
                    <form action="/auth/signout" method="post">
                        <Button variant="outline" size="sm" type="submit" className="border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500 font-semibold gap-1.5 shadow-xs transition-all cursor-pointer">
                            <LogOut className="w-4 h-4 shrink-0" />
                            <span>Salir</span>
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
