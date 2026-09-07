'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CompanyLogo } from '@/components/CompanyLogo'
import { UserCreationSheet } from '@/components/evaluator/UserCreationSheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface EvaluatorHeaderProps {
  userEmail?: string | null
  userName?: string | null
  teams?: string[]
}

export function EvaluatorHeader({ userEmail, userName, teams }: EvaluatorHeaderProps) {
  const router = useRouter()

  return (
    <header className="border-b bg-card px-6 py-3.5 flex items-center justify-between shadow-2xs">
      {/* Brand & Project */}
      <div className="flex items-center gap-4">
        <Link href="/evaluator" className="flex items-center gap-3">
          <CompanyLogo width={90} height={32} />
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              O11y SkillFlow
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                Admin
              </Badge>
            </span>
            <span className="text-[11px] text-muted-foreground">Panel de Evaluación y Gestión</span>
          </div>
        </Link>
      </div>

      {/* Quick Actions & User Info */}
      <div className="flex items-center gap-3">
        {/* Drawer button with automatic router refresh */}
        <UserCreationSheet
          teams={teams}
          onUserCreated={() => {
            router.refresh()
          }}
        />

        <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

        {/* User profile tag */}
        <div className="hidden md:flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-muted/60 border text-xs">
          <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium text-[11px]">
            <ShieldCheck className="size-3.5" />
          </div>
          <span className="text-foreground font-medium truncate max-w-[160px]">
            {userName || userEmail || 'Evaluador'}
          </span>
        </div>

        {/* Logout form */}
        <form action="/auth/signout" method="post">
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 h-8 text-xs font-medium"
          >
            <LogOut className="size-3.5 mr-1" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </form>
      </div>
    </header>
  )
}
