export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Topbar Light/Corporate Mode */}
            <header className="border-b bg-card px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary shadow-md flex items-center justify-center font-bold text-white">
                        O
                    </div>
                    <span className="font-semibold tracking-wide text-foreground">OTP / Focus Mode</span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Evaluación en curso
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
