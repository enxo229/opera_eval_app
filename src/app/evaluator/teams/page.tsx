import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DEFAULT_SQUADS } from '@/lib/schemas/user-form'
import { Building2, Users, CheckCircle2, Award, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeamsManagementPage() {
  const supabase = await createClient()

  // 1. Fetch selection processes with team info and evaluations
  const { data: processes } = await supabase
    .from('selection_processes')
    .select(`
      id,
      candidate_email,
      team,
      status,
      created_at,
      evaluations (
        id,
        status,
        final_score,
        classification
      )
    `)

  // 2. Aggregate stats per squad/team
  const teamStatsMap = new Map<
    string,
    {
      teamName: string
      totalCandidates: number
      activeProcesses: number
      completedEvaluations: number
      scores: number[]
      readyCount: number
    }
  >()

  // Initialize with default squads
  DEFAULT_SQUADS.forEach((sq) => {
    teamStatsMap.set(sq, {
      teamName: sq,
      totalCandidates: 0,
      activeProcesses: 0,
      completedEvaluations: 0,
      scores: [],
      readyCount: 0,
    })
  })

  // Populate aggregates
  if (processes) {
    processes.forEach((proc) => {
      const teamName = (proc.team || 'Sin asignar').trim()
      if (!teamStatsMap.has(teamName)) {
        teamStatsMap.set(teamName, {
          teamName,
          totalCandidates: 0,
          activeProcesses: 0,
          completedEvaluations: 0,
          scores: [],
          readyCount: 0,
        })
      }

      const entry = teamStatsMap.get(teamName)!
      entry.totalCandidates++

      const ev = proc.evaluations?.[0]
      if (proc.status === 'completed' || ev?.status === 'completed') {
        entry.completedEvaluations++
        if (ev?.final_score !== null && ev?.final_score !== undefined) {
          entry.scores.push(Number(ev.final_score))
        }
        if (ev?.classification && ev.classification.toLowerCase().includes('listo')) {
          entry.readyCount++
        }
      } else {
        entry.activeProcesses++
      }
    })
  }

  const teamsList = Array.from(teamStatsMap.values()).sort((a, b) => b.totalCandidates - a.totalCandidates)

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Building2 className="size-7 text-primary" />
          Equipos y Squads
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Distribución de candidatos, métricas de rendimiento y progreso por Squad del programa.
        </p>
      </div>

      {/* Squad Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teamsList.map((t) => {
          const avgScore =
            t.scores.length > 0
              ? (t.scores.reduce((sum, val) => sum + val, 0) / t.scores.length).toFixed(1)
              : null

          return (
            <Card
              key={t.teamName}
              className="border shadow-xs bg-card hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
            >
              <CardHeader className="p-5 pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-4" />
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {t.teamName}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono font-medium">
                    {t.totalCandidates} {t.totalCandidates === 1 ? 'candidato' : 'candidatos'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40 border text-center">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">
                      En Curso
                    </span>
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                      {t.activeProcesses}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border text-center">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">
                      Finalizados
                    </span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {t.completedEvaluations}
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
                      {avgScore ? `${avgScore} / 100` : 'Sin datos'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      Listos para Pivotar:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {t.readyCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
