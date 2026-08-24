import { createClient } from '@/lib/supabase/server'
import { KpiSummaryCards, EvaluatorKpis } from '@/components/evaluator/KpiSummaryCards'
import { CandidatesDataTable, CandidateRowData } from '@/components/evaluator/CandidatesDataTable'
import { DEFAULT_SQUADS } from '@/lib/schemas/user-form'

export const dynamic = 'force-dynamic'

export default async function EvaluatorDashboard() {
  const supabase = await createClient()

  // 1. Fetch Candidate Profiles with their Evaluations
  const { data: candidates, error: candidatesError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      national_id,
      national_id_type,
      created_at,
      evaluations (
        id,
        status,
        final_score,
        classification,
        selection_process_id,
        started_at,
        completed_at,
        created_at
      )
    `)
    .eq('role', 'candidate')
    .order('created_at', { ascending: false })

  if (candidatesError) {
    console.error('Error fetching candidates:', candidatesError)
  }

  // 2. Fetch Evaluators count
  const { count: totalEvaluators } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'evaluator')

  // 3. Fetch Selection Processes to retrieve Squads and Emails
  const { data: selectionProcesses } = await supabase
    .from('selection_processes')
    .select('id, candidate_email, candidate_national_id, team, status, created_at')
    .order('created_at', { ascending: false })

  // Build a map of selection processes by id and candidate_national_id/email
  const processMap = new Map<string, any>()
  const candidateProcessMap = new Map<string, any>()

  if (selectionProcesses) {
    selectionProcesses.forEach((p) => {
      processMap.set(p.id, p)
      if (p.candidate_national_id) {
        if (!candidateProcessMap.has(p.candidate_national_id)) {
          candidateProcessMap.set(p.candidate_national_id, p)
        }
      }
    })
  }

  // Extract distinct squads
  const distinctTeams = new Set<string>(DEFAULT_SQUADS as unknown as string[])

  // 4. Map candidates data to CandidateRowData
  let activeCount = 0
  let completedCount = 0
  let readyCount = 0

  const tableData: CandidateRowData[] = (candidates || []).map((c: any) => {
    // Sort evaluations by latest
    const evals = (c.evaluations || []).sort(
      (a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
    const latestEval = evals[0] || null

    // Find linked process
    let linkedProcess = null
    if (latestEval?.selection_process_id) {
      linkedProcess = processMap.get(latestEval.selection_process_id)
    }
    if (!linkedProcess && c.national_id) {
      linkedProcess = candidateProcessMap.get(c.national_id)
    }

    const team = linkedProcess?.team || null
    if (team) distinctTeams.add(team.trim())

    const evalStatus = latestEval?.status || null
    const processStatus = linkedProcess?.status || (evalStatus ? 'active' : 'draft')
    const finalScore = latestEval?.final_score ?? null
    const classification = latestEval?.classification || null

    // Track KPI counters
    if (evalStatus === 'completed' || processStatus === 'completed') {
      completedCount++
      if (classification && classification.toLowerCase().includes('listo')) {
        readyCount++
      }
    } else {
      activeCount++
    }

    return {
      id: c.id,
      fullName: c.full_name || 'Candidato sin nombre',
      email: linkedProcess?.candidate_email || 'Sin correo asociado',
      nationalId: c.national_id || linkedProcess?.candidate_national_id || null,
      nationalIdType: c.national_id_type || 'CC',
      team: team,
      processId: linkedProcess?.id || null,
      processStatus: processStatus,
      evaluationId: latestEval?.id || null,
      evaluationStatus: evalStatus,
      finalScore: finalScore,
      classification: classification,
      createdAt: linkedProcess?.created_at || c.created_at,
    }
  })

  // 5. Build KPI metrics object
  const kpis: EvaluatorKpis = {
    totalCandidates: candidates?.length || 0,
    totalEvaluators: totalEvaluators || 0,
    activeEvaluations: activeCount,
    completedEvaluations: completedCount,
    readyCandidatesCount: readyCount,
  }

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Evaluaciones y Candidatos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Supervisa el progreso operativo, clasificaciones y métricas del programa O11y SkillFlow.
          </p>
        </div>
      </div>

      {/* Top KPI Summary Cards */}
      <KpiSummaryCards kpis={kpis} />

      {/* Candidates Data Table */}
      <CandidatesDataTable
        data={tableData}
        teams={Array.from(distinctTeams).sort()}
      />
    </div>
  )
}
