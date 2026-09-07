import { getEvaluators } from '@/app/actions/admin'
import { getTeams } from '@/app/actions/teams'
import { EvaluatorsDataTable } from '@/components/evaluator/EvaluatorsDataTable'
import { UserCreationSheet } from '@/components/evaluator/UserCreationSheet'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DEFAULT_SQUADS } from '@/lib/schemas/user-form'
import { ShieldCheck, UserPlus, Users, KeyRound, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EvaluatorsManagementPage() {
  // 1. Fetch all evaluators from backend
  const evaluators = await getEvaluators()

  // 2. Fetch teams for creation drawer if needed
  const officialTeams = await getTeams()
  const teamsList =
    officialTeams.length > 0
      ? officialTeams.map((t) => t.name)
      : (DEFAULT_SQUADS as unknown as string[])

  // 3. Compute stats
  const totalEvaluators = evaluators.length
  const withDocumentCount = evaluators.filter((e) => Boolean(e.national_id)).length
  const activeProcessesCount = evaluators.reduce(
    (sum, e) => sum + (e.assigned_processes_count || 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="size-7 text-primary" />
            Evaluadores y Administradores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión centralizada de cuentas evaluadoras, asignación de contraseñas y permisos del sistema.
          </p>
        </div>

        {/* Action Button: Registrar Nuevo Evaluador */}
        <UserCreationSheet
          teams={teamsList}
          defaultRole="evaluator"
          customTrigger={
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm text-xs sm:text-sm h-9">
              <UserPlus className="size-4" />
              <span>+ Registrar Nuevo Evaluador</span>
            </Button>
          }
        />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border shadow-2xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Total Evaluadores</span>
              <p className="text-2xl font-bold tracking-tight text-foreground">{totalEvaluators}</p>
              <p className="text-[11px] text-muted-foreground">Cuentas con acceso administrativo</p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 bg-card border shadow-2xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Con Documento Registrado</span>
              <p className="text-2xl font-bold tracking-tight text-foreground">{withDocumentCount}</p>
              <p className="text-[11px] text-muted-foreground">
                {totalEvaluators > 0
                  ? `${Math.round((withDocumentCount / totalEvaluators) * 100)}% del equipo`
                  : '0%'}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 bg-card border shadow-2xs">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Seguridad y Credenciales</span>
              <p className="text-2xl font-bold tracking-tight text-emerald-600">Activo</p>
              <p className="text-[11px] text-muted-foreground">Cambio de contraseñas habilitado</p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <KeyRound className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluators Data Table */}
      <EvaluatorsDataTable data={evaluators} />
    </div>
  )
}
