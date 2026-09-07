'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Building2, Award, CheckCircle2, Info } from 'lucide-react'

export interface TeamCardData {
  id?: string
  teamName: string
  description: string | null
  totalCandidates: number
  activeProcesses: number
  completedEvaluations: number
  avgScore: string | null
  readyCount: number
}

interface TeamCardProps {
  team: TeamCardData
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Card className="border shadow-xs bg-card hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Responsive Card Header with Multi-line Support for Long Team Names */}
      <CardHeader className="p-4 sm:p-5 pb-3.5 border-b bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          {/* Team Icon + Name + Info Tooltip */}
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
              <Building2 className="size-4" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <CardTitle className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-snug break-words">
                  {team.teamName}
                </CardTitle>

                {/* Info Icon with Hover Tooltip for description */}
                {team.description ? (
                  <TooltipProvider delay={100}>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            className="text-muted-foreground/60 hover:text-primary transition-colors focus:outline-none p-0.5 rounded-full hover:bg-primary/10 inline-flex items-center justify-center shrink-0"
                            aria-label={`Información sobre ${team.teamName}`}
                          />
                        }
                      >
                        <Info className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="start"
                        sideOffset={6}
                        className="max-w-xs text-xs font-normal leading-relaxed p-3 shadow-lg bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-100 border border-slate-700"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-primary-foreground">
                            <Building2 className="size-3 text-primary" />
                            <span>{team.teamName}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-normal">
                            {team.description}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
            </div>
          </div>

          {/* Candidate Count Badge: Shrink-resistant and guaranteed whole */}
          <Badge
            variant={team.totalCandidates > 0 ? 'default' : 'outline'}
            className={`text-xs font-mono font-medium shrink-0 whitespace-nowrap mt-0.5 ${
              team.totalCandidates > 0
                ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                : 'text-muted-foreground'
            }`}
          >
            {team.totalCandidates} {team.totalCandidates === 1 ? 'candidato' : 'candidatos'}
          </Badge>
        </div>
      </CardHeader>

      {/* Card Content with standard stats */}
      <CardContent className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/40 border text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">
              En Curso
            </span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
              {team.activeProcesses}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">
              Finalizados
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {team.completedEvaluations}
            </span>
          </div>
        </div>

        {/* Score and Ready stats */}
        <div className="pt-2 border-t space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Award className="size-3.5 text-primary" />
              Promedio de Score:
            </span>
            <span className="font-mono font-bold text-foreground">
              {team.avgScore ? `${team.avgScore} / 100` : 'Sin evaluaciones'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Listos para Pivotar:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {team.readyCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
