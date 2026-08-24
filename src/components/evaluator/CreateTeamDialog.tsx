'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createTeam } from '@/app/actions/teams'
import { Plus, Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react'

interface CreateTeamDialogProps {
  onTeamCreated?: () => void
  customTrigger?: React.ReactNode
}

export function CreateTeamDialog({ onTeamCreated, customTrigger }: CreateTeamDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setDescription('')
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const normalizedName = name.trim().toUpperCase()
    if (!normalizedName || normalizedName.length < 2) {
      setError('El nombre del equipo debe tener al menos 2 caracteres.')
      return
    }

    setLoading(true)
    try {
      const res = await createTeam(normalizedName, description.trim())
      if (res.success) {
        setSuccess(`✅ Equipo "${normalizedName}" creado correctamente en el catálogo.`)
        resetForm()
        router.refresh()
        onTeamCreated?.()
        setTimeout(() => {
          setOpen(false)
          setSuccess(null)
        }, 1200)
      } else {
        setError(res.error || 'Error al registrar el equipo.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión con el servidor.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setError(null)
          setSuccess(null)
        }
      }}
    >
      <DialogTrigger
        render={
          customTrigger ? (
            customTrigger as React.ReactElement
          ) : (
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs">
              <Plus className="size-4" />
              <span>Crear Equipo</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle>Crear Nuevo Equipo / Squad</DialogTitle>
              <DialogDescription>
                Registra un nuevo Squad en el catálogo oficial para asignación en procesos de selección.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="create-team-form" onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 py-2.5">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <AlertDescription className="text-xs">{success}</AlertDescription>
            </Alert>
          )}

          {/* Nombre del Equipo */}
          <div className="space-y-1.5">
            <Label htmlFor="team-name" className="text-xs font-semibold">
              Nombre del Equipo / Squad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="team-name"
              placeholder="Ej. SRE CORE, GRYFFINDOR..."
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              required
              disabled={loading}
              className="text-sm uppercase font-medium"
            />
            <p className="text-[11px] text-muted-foreground">
              Se registrará en mayúsculas sostenidas para mantener el estándar oficial.
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="team-desc" className="text-xs font-semibold text-muted-foreground">
              Descripción o Enfoque Técnico (Opcional)
            </Label>
            <Textarea
              id="team-desc"
              placeholder="Ej. Equipo de operación de TI con enfoque en observabilidad y monitoreo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={loading}
              className="text-xs resize-none"
            />
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => setOpen(false)}
            disabled={loading}
            size="sm"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-team-form"
            disabled={loading}
            size="sm"
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            Guardar Equipo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
