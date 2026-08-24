'use client'

import * as React from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { searchHistoricalProcesses, reopenEvaluation, closeSelectionProcess } from '@/app/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ProcessStatusBadge } from '@/components/evaluator/ProcessStatusBadge'
import { ScoreClassificationBadge } from '@/components/evaluator/ScoreClassificationBadge'
import { ExportMenu, ExportRow } from '@/components/evaluator/ExportMenu'
import {
  Search,
  History,
  RotateCcw,
  PlayCircle,
  FileText,
  Lock,
  MoreVertical,
  Loader2,
  Calendar,
  AlertTriangle,
  Users,
  Building2,
  Mail,
  Fingerprint,
} from 'lucide-react'

type HistoricalProcess = {
  id: string
  candidate_email: string
  candidate_national_id: string | null
  team: string | null
  observations: string | null
  status: string
  created_at: string
  evaluations: {
    id: string
    candidate_id: string
    status: string
    final_score: number | null
    classification: string | null
  }[]
}

export default function HistorySearchPage() {
  const router = useRouter()
  const [searchTermCC, setSearchTermCC] = useState('')
  const [searchTermEmail, setSearchTermEmail] = useState('')
  const [searchTermTeam, setSearchTermTeam] = useState('')

  const [loading, setLoading] = useState(false)
  const [processes, setProcesses] = useState<HistoricalProcess[]>([])
  const [searched, setSearched] = useState(false)

  // Action Modals State
  const [processToClose, setProcessToClose] = useState<{ id: string; name: string } | null>(null)
  const [evalToReopen, setEvalToReopen] = useState<{ id: string; name: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      setLoading(true)
      setSearched(true)

      try {
        const data = await searchHistoricalProcesses(searchTermCC, searchTermEmail, searchTermTeam)
        setProcesses((data as any) || [])
      } catch (err) {
        console.error('Error fetching historical processes:', err)
      } finally {
        setLoading(false)
      }
    },
    [searchTermCC, searchTermEmail, searchTermTeam]
  )

  // Initial load: fetch all recent historical processes
  useEffect(() => {
    handleSearch()
  }, [])

  const handleClear = () => {
    setSearchTermCC('')
    setSearchTermEmail('')
    setSearchTermTeam('')
    setTimeout(() => {
      searchHistoricalProcesses('', '', '').then((data) => {
        setProcesses((data as any) || [])
        setSearched(false)
      })
    }, 50)
  }

  const handleCloseConfirm = async () => {
    if (!processToClose) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await closeSelectionProcess(processToClose.id)
      if (res.success) {
        setProcessToClose(null)
        handleSearch()
      } else {
        setActionError(res.error || 'Error cerrando proceso.')
      }
    } catch (e: any) {
      setActionError(e.message || 'Error inesperado.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReopenConfirm = async () => {
    if (!evalToReopen) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await reopenEvaluation(evalToReopen.id)
      if (res.success) {
        setEvalToReopen(null)
        handleSearch()
      } else {
        setActionError(res.error || 'Error reabriendo evaluación.')
      }
    } catch (e: any) {
      setActionError(e.message || 'Error inesperado.')
    } finally {
      setActionLoading(false)
    }
  }

  // Export rows formatting
  const exportRows: ExportRow[] = useMemo(() => {
    return processes.map((p) => {
      const ev = p.evaluations?.[0]
      return {
        fullName: p.candidate_email,
        email: p.candidate_email,
        nationalId: p.candidate_national_id,
        team: p.team,
        status: p.status,
        finalScore: ev?.final_score,
        classification: ev?.classification,
        createdAt: p.created_at,
      }
    })
  }, [processes])

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <History className="size-7 text-primary" />
            Búsqueda Histórica de Procesos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audita, filtra y revisa el histórico completo de evaluaciones pasadas, archivadas y activas.
          </p>
        </div>

        {processes.length > 0 && <ExportMenu data={exportRows} filename="historico_procesos_o11y" />}
      </div>

      {/* Advanced Search Form Filter Card */}
      <Card className="border shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Cédula */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Fingerprint className="size-3.5" />
                  Cédula / Identificación
                </label>
                <Input
                  placeholder="Ej. 1020304050"
                  value={searchTermCC}
                  onChange={(e) => setSearchTermCC(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  Correo del Candidato
                </label>
                <Input
                  placeholder="Ej. candidato@seti.com.co"
                  value={searchTermEmail}
                  onChange={(e) => setSearchTermEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Equipo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="size-3.5" />
                  Equipo / Squad
                </label>
                <Input
                  placeholder="Ej. Squad Alpha, SRE Core..."
                  value={searchTermTeam}
                  onChange={(e) => setSearchTermTeam(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              {(searchTermCC || searchTermEmail || searchTermTeam) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-xs gap-1 h-8 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3" />
                  Limpiar Filtros
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                Buscar en Histórico
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-semibold text-xs py-3.5">Candidato / Correo</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Cédula</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Equipo / Squad</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Estado del Proceso</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Score & Clasificación</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Fecha Creación</TableHead>
                <TableHead className="text-right font-semibold text-xs py-3.5 pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-xs">Consultando procesos históricos...</p>
                  </TableCell>
                </TableRow>
              ) : processes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No se encontraron procesos coincidentes</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      {searched
                        ? 'Verifica los criterios de búsqueda ingresados.'
                        : 'No hay procesos registrados en el histórico.'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                processes.map((proc) => {
                  const ev = proc.evaluations && proc.evaluations.length > 0 ? proc.evaluations[0] : null
                  const isCompleted = ev?.status === 'completed' || proc.status === 'completed'
                  const isClosed = proc.status === 'archived' || proc.status === 'completed'

                  return (
                    <TableRow key={proc.id} className="hover:bg-muted/30 transition-colors">
                      {/* Correo y Observaciones */}
                      <TableCell className="py-3">
                        <div className="space-y-0.5">
                          <span className="font-medium text-sm text-foreground">{proc.candidate_email}</span>
                          {proc.observations && (
                            <p className="text-xs text-muted-foreground italic truncate max-w-xs">
                              {proc.observations}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Cédula */}
                      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                        {proc.candidate_national_id || 'N/A'}
                      </TableCell>

                      {/* Equipo */}
                      <TableCell className="py-3">
                        <span className="text-xs font-medium text-foreground/90 bg-muted/60 px-2.5 py-1 rounded-md border">
                          {proc.team || 'Sin asignar'}
                        </span>
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="py-3">
                        <ProcessStatusBadge status={proc.status} />
                      </TableCell>

                      {/* Score y Clasificación */}
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {ev?.final_score !== null && ev?.final_score !== undefined ? (
                              <span className="font-mono font-bold text-sm text-foreground">
                                {ev.final_score.toFixed(1)} / 100
                              </span>
                            ) : null}
                            <ScoreClassificationBadge
                              classification={ev?.classification}
                              score={ev?.final_score}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Fecha */}
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground/70" />
                          <span>
                            {proc.created_at
                              ? new Date(proc.created_at).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="py-3 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {ev?.candidate_id && isCompleted ? (
                            <Link href={`/evaluator/report/${ev.candidate_id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                <FileText className="size-3.5" />
                                <span>Ver Informe</span>
                              </Button>
                            </Link>
                          ) : ev?.candidate_id ? (
                            <Link href={`/evaluator/evaluate/${ev.candidate_id}`}>
                              <Button
                                size="sm"
                                className="h-8 gap-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
                              >
                                <PlayCircle className="size-3.5" />
                                <span>Evaluar</span>
                              </Button>
                            </Link>
                          ) : null}

                          {/* Opciones extra */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="size-8 text-muted-foreground hover:text-foreground"
                                  aria-label="Más opciones"
                                />
                              }
                            >
                              <MoreVertical className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                              <DropdownMenuLabel>Gestión de Proceso</DropdownMenuLabel>

                              {proc.status === 'active' && (
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() =>
                                    setProcessToClose({ id: proc.id, name: proc.candidate_email })
                                  }
                                  className="gap-2 cursor-pointer"
                                >
                                  <Lock className="size-4" />
                                  <span>Cerrar Proceso</span>
                                </DropdownMenuItem>
                              )}

                              {ev?.id && isCompleted && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEvalToReopen({ id: ev.id, name: proc.candidate_email })
                                  }
                                  className="gap-2 cursor-pointer text-amber-600 hover:text-amber-700"
                                >
                                  <RotateCcw className="size-4" />
                                  <span>Reabrir Evaluación</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
          Mostrando <strong>{processes.length}</strong> procesos históricos recuperados.
        </div>
      </div>

      {/* Confirmation Modal: Cerrar Proceso */}
      <AlertDialog
        open={Boolean(processToClose)}
        onOpenChange={(open) => !open && setProcessToClose(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle>¿Cerrar proceso de selección?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Estás a punto de cerrar y archivar el proceso para{' '}
              <strong>{processToClose?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{actionError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleCloseConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Confirmar y Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Modal: Reabrir Evaluación */}
      <AlertDialog
        open={Boolean(evalToReopen)}
        onOpenChange={(open) => !open && setEvalToReopen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <RotateCcw className="size-5" />
              <AlertDialogTitle>¿Reabrir evaluación?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Estás a punto de reabrir la evaluación para <strong>{evalToReopen?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md">{actionError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              onClick={handleReopenConfirm}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {actionLoading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Confirmar y Reabrir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
