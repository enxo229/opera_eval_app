export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0B0E14] text-[#E5E7EB] flex flex-col">
            {/* Topbar Minimalista */}
            <header className="border-b border-[#1F2937] bg-[#11151F] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#00A3FF] flex items-center justify-center font-bold text-white">
                        O
                    </div>
                    <span className="font-semibold tracking-wide">OTP / Focus Mode</span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Evaluación en curso
                </div>
            </header>

            {/* Contenido sin distracciones */}
            <main className="flex-1 overflow-auto flex justify-center py-10 px-4">
                <div className="w-full max-w-4xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
