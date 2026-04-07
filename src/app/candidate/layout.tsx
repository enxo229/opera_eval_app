import { CandidateProvider } from '@/context/CandidateContext'
import { CandidateHeader } from '@/components/candidate/CandidateHeader'
import { createClient } from '@/lib/supabase/server'

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const email = user?.email || 'Candidato'

    return (
        <CandidateProvider>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <CandidateHeader email={email} />

                {/* Contenido amplio y responsivo */}
                <main className="flex-1 overflow-auto flex justify-center py-10 px-4 sm:px-6 lg:px-8">
                    <div className="w-full max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </CandidateProvider>
    )
}
