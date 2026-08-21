'use client'

import { Button } from '@/components/ui/button'
import { CompanyLogo } from '@/components/CompanyLogo'
import { LogOut, User } from 'lucide-react'
import { useCandidateContext } from '@/context/CandidateContext'
import { EvaluationTimer } from './EvaluationTimer'
import { TabSwitchWarningModal } from './TabSwitchWarningModal'

interface Props {
    email: string
}

export function CandidateHeader({ email }: Props) {
    const ctx = useCandidateContext()

    return (
        <>
            <header className="sticky top-0 z-[60] border-b bg-background/80 backdrop-blur-md px-6 py-3 flex items-center justify-between shadow-sm transition-all duration-300">
                {/* Left: Logo & Title */}
                <div className="flex items-center gap-4 flex-1">
                    <CompanyLogo width={80} height={30} />
                    <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                    <span className="font-bold tracking-tight text-foreground hidden lg:block italic text-sm">O11y SkillFlow / Focus Mode</span>
                </div>

                {/* Center: Timer (Inline Positioning) */}
                <div className="flex-1 flex justify-center">
                    {ctx.startedAt && !ctx.isTimeUp && (
                        <EvaluationTimer 
                            evaluationId={ctx.evaluationId}
                            remainingSeconds={ctx.remainingSeconds} 
                            totalDurationMinutes={ctx.testDuration}
                        />
                    )}
                </div>

                {/* Right: Status & User */}
                <div className="flex-1 flex items-center justify-end gap-5">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">En curso</span>
                    </div>

                    <div className="flex items-center gap-2 pl-4 border-l border-border">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter leading-none mb-0.5">Candidato</span>
                            <span className="font-mono text-[11px] text-foreground font-bold">{email}</span>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>

                    <form action="/auth/signout" method="post">
                        <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8 px-2 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </header>

            {/* Global Tab Switch Warning Modal */}
            {ctx.showTabSwitchWarning && (
                <TabSwitchWarningModal 
                    attemptCount={ctx.tabSwitchCount}
                    maxAllowed={4}
                    onDismiss={() => ctx.setShowTabSwitchWarning(false)}
                />
            )}
        </>
    )
}
