'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUser } from '@/app/actions/admin'
import { ID_TYPES, DEFAULT_SQUADS } from '@/lib/schemas/user-form'
import {
  UserCog,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  User,
  Building2,
} from 'lucide-react'

export interface EditableUser {
  id: string
  email: string
  fullName: string
  role?: string
  nationalIdType?: string | null
  nationalId?: string | null
  team?: string | null
  observations?: string | null
}

interface EditUserDialogProps {
  user: EditableUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  teams?: string[]
  onSuccess?: () => void
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  teams = DEFAULT_SQUADS as unknown as string[],
  onSuccess,
}: EditUserDialogProps) {
  const [fullName, setFullName] = useState('')
  const [nationalIdType, setNationalIdType] = useState('CC')
  const [nationalId, setNationalId] = useState('')
  const [team, setTeam] = useState<string>('')
  const [observations, setObservations] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '')
      setNationalIdType(user.nationalIdType || 'CC')
      setNationalId(user.nationalId || '')
      setTeam(user.team || (teams[0] || ''))
      setObservations(user.observations || '')
      setError(null)
      setSuccess(null)
    }
  }, [user, teams])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setError(null)
      setSuccess(null)
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!user) return

    if (!fullName.trim()) {
      setError('El nombre completo es requerido.')
      return
    }

    setLoading(true)
    try {
      const res = await updateUser(
        user.id,
        fullName.trim(),
        nationalIdType,
        nationalId.trim(),
        undefined, // Don't update password here
        user.role === 'candidate' ? team : undefined,
        user.role === 'candidate' ? observations.trim() : undefined
      )

      if (res.success) {
        setSuccess('¡Perfil de usuario actualizado exitosamente!')
        setTimeout(() => {
          handleOpenChange(false)
          onSuccess?.()
        }, 1200)
      } else {
        setError(res.error || 'No se pudo actualizar el perfil.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado del servidor.')
    } finally {
      setLoading(false)
    }
  }

  const isCandidate = user?.role === 'candidate'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-foreground">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserCog className="size-4" />
            </div>
            <DialogTitle className="text-base font-semibold">Editar Datos de Usuario</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Actualiza los datos personales, documento de identidad o equipo asignado.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="bg-muted/40 rounded-lg p-3 border space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-mono">{user.email}</span>
              <Badge variant="outline" className="text-[10px] gap-1 capitalize">
                {user.role === 'evaluator' ? (
                  <>
                    <Shield className="size-3 text-primary" />
                    Evaluador
                  </>
                ) : (
                  <>
                    <User className="size-3 text-blue-500" />
                    Candidato
                  </>
                )}
              </Badge>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 py-2.5">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <AlertDescription className="text-xs font-medium">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre Completo */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-fullName" className="text-xs font-medium">
              Nombre Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-fullName"
              placeholder="Ej. Carlos Pumarejo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              className="text-xs"
            />
          </div>

          {/* Tipo y Documento de Identidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo de Documento</Label>
              <Select
                value={nationalIdType}
                onValueChange={(val) => setNationalIdType(val ?? 'CC')}
                disabled={loading}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ID_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-nationalId" className="text-xs font-medium">
                Número de Documento
              </Label>
              <Input
                id="edit-nationalId"
                placeholder="Ej. 123456789"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                disabled={loading}
                className="text-xs"
              />
            </div>
          </div>

          {/* Si es candidato: Equipo y Observaciones */}
          {isCandidate && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-muted-foreground" />
                  Equipo / Squad Asignado
                </Label>
                <Select
                  value={team}
                  onValueChange={(val) => setTeam(val ?? '')}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Selecciona un equipo" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {teams.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-observations" className="text-xs font-medium">
                  Observaciones del Proceso
                </Label>
                <Textarea
                  id="edit-observations"
                  rows={3}
                  placeholder="Notas internas del evaluador..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  disabled={loading}
                  className="text-xs resize-none"
                />
              </div>
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !fullName.trim()}
              className="text-xs gap-1.5"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
