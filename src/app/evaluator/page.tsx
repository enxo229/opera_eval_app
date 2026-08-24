import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { KpiSummaryCards, EvaluatorKpis } from '@/components/evaluator/KpiSummaryCards'
import { CandidatesDataTable, CandidateRowData } from '@/components/evaluator/CandidatesDataTable'
import { DEFAULT_SQUADS } from '@/lib/schemas/user-form'

export const dynamic = 'force-dynamic'

export default async function EvaluatorDashboard() {
  const supabase = await createClient()
  const admin = createAdminClient()

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
      evaluations!evaluations_candidate_id_fkey (
        id,
        status,
        final_score,
        classification,
        selection_process_id,
        started_at,
        completed_at
      )
    `)
    .eq('role', 'candidate')
    .order('created_at', { ascending: false })

  if (candidatesError) {
    console.error('Error fetching candidates:', candidatesError)
  }

  // 2. Fetch auth users to get exact emails
  const { data: authData } = await admin.auth.admin.listUsers()
  const authEmailMap = new Map((authData?.users || []).map((u) => [u.id, u.email || '']))

  // 3. Fetch Evaluators count
  const { count: totalEvaluators } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'evaluator')

  // 4. Fetch Selection Processes to retrieve Squads and Processes
  const { data: selectionProcesses } = await supabase
    .from('selection_processes')
    .select('id, candidate_email, candidate_national_id, team, status, created_at')
    .order('created_at', { ascending: false })

  // Build indexes for selection processes
  const processMap = new Map<string, any>()
  const procByEmail = new Map<string, any>()
  const procByNatId = new Map<string, any>()

  if (selectionProcesses) {
    selectionProcesses.forEach((p) => {
      processMap.set(p.id, p)
      if (p.candidate_email) {
        procByEmail.set(p.candidate_email.trim().toLowerCase(), p)
      }
      if (p.candidate_national_id) {
        if (!procByNatId.has(p.candidate_national_id.trim())) {
          procByNatId.set(p.candidate_national_id.trim(), p)
        }
      }
    })
  }

  // Extract distinct squads
  const distinctTeams = new Set<string>(DEFAULT_SQUADS as unknown as string[])

  // 5. Map candidates data to CandidateRowData
  let activeCount = 0
  let completedCount = 0
  let readyCount = 0

  const tableData: CandidateRowData[] = (candidates || []).map((c: any) => {
    const userEmail = authEmailMap.get(c.id) || ''
    const evals = c.evaluations || []
    const latestEval = evals[0] || null

    // Match linked selection process
    let linkedProcess = null
    if (latestEval?.selection_process_id) {
      linkedProcess = processMap.get(latestEval.selection_process_id)
    }
    if (!linkedProcess && userEmail) {
      linkedProcess = procByEmail.get(userEmail.toLowerCase())
    }
    if (!linkedProcess && c.national_id) {
      linkedProcess = procByNatId.get(c.national_id.trim())
    }

    const team = linkedProcess?.team || null
    if (team) distinctTeams.add(team.trim())

    const evalStatus = latestEval?.status || null
    const processStatus = linkedProcess?.status || (evalStatus === 'completed' ? 'completed' : 'active')
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
      email: userEmail || linkedProcess?.candidate_email || 'Sin correo asociado',
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

  // 6. Build KPI metrics object
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
