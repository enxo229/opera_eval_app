'use client'

import { Button } from '@/components/ui/button'
import { CompanyLogo } from '@/components/CompanyLogo'
import { LogOut, User } from 'lucide-react'
import { useCandidateContext } from '@/context/CandidateContext'
import { EvaluationTimer } from './EvaluationTimer'
import { PauseOverlay } from './PauseOverlay'

interface Props {
    email: string
}

export function CandidateHeader({ email }: Props) {
    const ctx = useCandidateContext()

    return (
        <>
            <header className="sticky top-0 z-[60] border-b bg-white/80 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-sm transition-all duration-300">
                {/* Left: Logo & Title */}
                <div className="flex items-center gap-4 flex-1">
                    <CompanyLogo width={80} height={30} />
                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
                    <span className="font-bold tracking-tight text-slate-700 hidden lg:block italic text-sm">O11y SkillFlow / Focus Mode</span>
                </div>

                {/* Center: Timer (Inline Positioning) */}
                <div className="flex-1 flex justify-center">
                    {ctx.startedAt && !ctx.isTimeUp && (
                        <EvaluationTimer 
                            evaluationId={ctx.evaluationId}
                            remainingSeconds={ctx.remainingSeconds} 
                            totalDurationMinutes={ctx.testDuration}
                            pauseCount={ctx.pauseCount}
                            isPaused={ctx.isPaused}
                            onPauseTriggered={(now) => {
                                ctx.setPausedAt(now)
                                ctx.setPauseCount((prev: number) => prev + 1)
                            }}
                        />
                    )}
                </div>

                {/* Right: Status & User */}
                <div className="flex-1 flex items-center justify-end gap-5">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100/50">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">En curso</span>
                    </div>

                    <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">Candidato</span>
                            <span className="font-mono text-[11px] text-slate-600 font-bold">{email}</span>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                            <User className="w-4 h-4 text-slate-500" />
                        </div>
                    </div>

                    <form action="/auth/signout" method="post">
                        <Button variant="ghost" size="sm" type="submit" className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 px-2 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </header>

            {/* Global Pause Overlay - Integrated logic */}
            {ctx.isPaused && (
                <PauseOverlay 
                    evaluationId={ctx.evaluationId}
                    pausedAt={ctx.pausedAt}
                    onResumeTriggered={(pauseDeltaMs) => {
                        ctx.setTotalPausedMs(ctx.totalPausedMs + pauseDeltaMs)
                        ctx.setPausedAt(null)
                    }}
                />
            )}
        </>
    )
}
