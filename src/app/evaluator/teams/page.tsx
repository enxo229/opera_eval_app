import { createClient } from '@/lib/supabase/server'
import { getTeams } from '@/app/actions/teams'
import { CreateTeamDialog } from '@/components/evaluator/CreateTeamDialog'
import { TeamCard, TeamCardData } from '@/components/evaluator/TeamCard'
import { Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeamsManagementPage() {
  const supabase = await createClient()

  // 1. Fetch official teams catalog from DB
  const officialTeams = await getTeams()

  // 2. Fetch selection processes with evaluations
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

  // 3. Aggregate stats per squad/team
  const teamStatsMap = new Map<
    string,
    {
      id?: string
      teamName: string
      description: string | null
      totalCandidates: number
      activeProcesses: number
      completedEvaluations: number
      scores: number[]
      readyCount: number
    }
  >()

  // Initialize with official catalog from database
  officialTeams.forEach((t) => {
    teamStatsMap.set(t.name, {
      id: t.id,
      teamName: t.name,
      description: t.description,
      totalCandidates: 0,
      activeProcesses: 0,
      completedEvaluations: 0,
      scores: [],
      readyCount: 0,
    })
  })

  // Populate aggregates from actual processes
  if (processes) {
    processes.forEach((proc) => {
      const teamName = (proc.team || 'Sin asignar').trim().toUpperCase()
      if (!teamStatsMap.has(teamName)) {
        teamStatsMap.set(teamName, {
          teamName,
          description: null,
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

  // Sort teams: first by totalCandidates DESC, then alphabetically
  const teamsList: TeamCardData[] = Array.from(teamStatsMap.values())
    .sort((a, b) => {
      if (b.totalCandidates !== a.totalCandidates) {
        return b.totalCandidates - a.totalCandidates
      }
      return a.teamName.localeCompare(b.teamName)
    })
    .map((t) => ({
      id: t.id,
      teamName: t.teamName,
      description: t.description,
      totalCandidates: t.totalCandidates,
      activeProcesses: t.activeProcesses,
      completedEvaluations: t.completedEvaluations,
      avgScore:
        t.scores.length > 0
          ? (t.scores.reduce((sum, val) => sum + val, 0) / t.scores.length).toFixed(1)
          : null,
      readyCount: t.readyCount,
    }))

  return (
    <div className="space-y-6">
      {/* Header & Create Team Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Building2 className="size-7 text-primary" />
            Catálogo de Equipos y Squads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Distribución oficial de candidatos, métricas de rendimiento y cobertura técnica por célula.
          </p>
        </div>

        {/* Modal Button to create a new team */}
        <CreateTeamDialog />
      </div>

      {/* Stats Cards Grid with Tooltip Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teamsList.map((t) => (
          <TeamCard key={t.teamName} team={t} />
        ))}
      </div>
    </div>
  )
}
