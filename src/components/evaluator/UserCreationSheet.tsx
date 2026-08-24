'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createUser } from '@/app/actions/admin'
import { ID_TYPES, DEFAULT_TRACKS, DEFAULT_SQUADS } from '@/lib/schemas/user-form'
import { UserPlus, Loader2, AlertCircle, CheckCircle2, Shield, User } from 'lucide-react'

interface UserCreationSheetProps {
  onUserCreated?: () => void
  customTrigger?: React.ReactNode
  teams?: string[]
}

export function UserCreationSheet({
  onUserCreated,
  customTrigger,
  teams = DEFAULT_SQUADS as unknown as string[],
}: UserCreationSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<'candidate' | 'evaluator'>('candidate')
  const [loading, setLoading] = useState(false)

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nationalIdType, setNationalIdType] = useState('CC')
  const [nationalId, setNationalId] = useState('')
  const [team, setTeam] = useState<string>(teams[0] || 'INTELISETISIMOS')
  const [trackId, setTrackId] = useState<string>(DEFAULT_TRACKS[0].id)
  const [observations, setObservations] = useState('')

  // Sync team if teams prop updates
  useEffect(() => {
    if (teams && teams.length > 0 && !teams.includes(team)) {
      setTeam(teams[0])
    }
  }, [teams, team])

  // Status feedback
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setNationalIdType('CC')
    setNationalId('')
    setTeam(teams[0] || 'INTELISETISIMOS')
    setTrackId(DEFAULT_TRACKS[0].id)
    setObservations('')
    setError(null)
    setWarning(null)
    setSuccess(null)
  }

  const handleSubmit = async (e?: React.FormEvent, forceConfirm = false) => {
    if (e) e.preventDefault()
    setError(null)
    setWarning(null)
    setSuccess(null)

    // Basic validation
    if (!fullName.trim()) {
      setError('El nombre completo es requerido')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresa un correo electrónico válido')
      return
    }
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (role === 'candidate' && !nationalId.trim()) {
      setError('El número de identificación es requerido para candidatos')
      return
    }

    if (role === 'candidate' && !team) {
      setError('Debes seleccionar un equipo para el candidato')
      return
    }

    setLoading(true)
    try {
      const result = await createUser(
        email.trim().toLowerCase(),
        password,
        fullName.trim(),
        role,
        nationalIdType,
        nationalId.trim(),
        role === 'candidate' ? team : undefined,
        role === 'candidate' ? observations.trim() : undefined,
        forceConfirm
      )

      if (result.success) {
        setSuccess(
          `✅ ${role === 'candidate' ? 'Candidato' : 'Evaluador'} ${email} creado correctamente.`
        )
        resetForm()
        router.refresh()
        onUserCreated?.()
        setTimeout(() => {
          setOpen(false)
          setSuccess(null)
          router.refresh()
        }, 1000)
      } else if (result.warning) {
        setWarning(result.warning)
      } else {
        setError(result.error || 'Ocurrió un error inesperado al registrar el usuario')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión con el servidor'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setError(null)
          setWarning(null)
          setSuccess(null)
        }
      }}
    >
      <SheetTrigger
        render={
          customTrigger ? (
            customTrigger as React.ReactElement
          ) : (
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all duration-150">
              <UserPlus className="size-4" />
              <span>Nuevo Usuario</span>
            </Button>
          )
        }
      />

      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 overflow-hidden">
        {/* Drawer Header */}
        <SheetHeader className="p-6 pb-4 bg-muted/20 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </div>
            <div>
              <SheetTitle>Crear Usuario / Proceso</SheetTitle>
              <SheetDescription>
                Registra un nuevo candidato con su evaluación o añade un evaluador al sistema.
              </SheetDescription>
            </div>
          </div>

          {/* Role selector Tabs */}
          <div className="pt-2">
            <Tabs
              value={role}
              onValueChange={(val) => {
                setRole(val as 'candidate' | 'evaluator')
                setError(null)
                setWarning(null)
              }}
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="candidate" className="gap-1.5">
                  <User className="size-3.5" />
                  Candidato
                </TabsTrigger>
                <TabsTrigger value="evaluator" className="gap-1.5">
                  <Shield className="size-3.5" />
                  Evaluador
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </SheetHeader>

        {/* Drawer Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {warning && (
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 py-3">
              <AlertCircle className="size-4 text-amber-600" />
              <div className="space-y-2">
                <AlertDescription className="text-xs leading-relaxed">
                  {warning}
                </AlertDescription>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => handleSubmit(undefined, true)}
                  disabled={loading}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs h-7"
                >
                  {loading ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                  Confirmar y Crear Nuevo Proceso
                </Button>
              </div>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 py-2.5">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <AlertDescription className="text-xs">{success}</AlertDescription>
            </Alert>
          )}

          <form id="user-creation-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre Completo */}
            <div className="space-y-1.5">
              <Label htmlFor="sheet-fullName" className="text-xs font-medium">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sheet-fullName"
                placeholder="Ej. Andrés Camilo Morales"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Email y Contraseña en 2 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sheet-email" className="text-xs font-medium">
                  Correo Electrónico <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sheet-email"
                  type="email"
                  placeholder="usuario@seti.com.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sheet-password" className="text-xs font-medium">
                  Contraseña Temporal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sheet-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Documento de Identidad */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1.5">
                <Label className="text-xs font-medium">Tipo Doc.</Label>
                <Select
                  value={nationalIdType}
                  onValueChange={(val) => setNationalIdType(val as string)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ID_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="sheet-idNumber" className="text-xs font-medium">
                  Número de Identificación {role === 'candidate' && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="sheet-idNumber"
                  placeholder="Ej. 1020304050"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  required={role === 'candidate'}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campos condicionales para CANDIDATOS */}
            {role === 'candidate' && (
              <div className="space-y-4 pt-2 border-t">
                {/* Track Evaluativo */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Perfil Evaluativo / Track <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={trackId}
                    onValueChange={(val) => setTrackId(val as string)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un track" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_TRACKS.map((trk) => (
                        <SelectItem key={trk.id} value={trk.id}>
                          {trk.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Equipo / Squad */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Equipo / Squad Destino <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={team}
                    onValueChange={(val) => setTeam(val as string)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un equipo del catálogo" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((sq) => (
                        <SelectItem key={sq} value={sq}>
                          {sq}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Los equipos disponibles provienen del catálogo oficial.
                  </p>
                </div>

                {/* Observaciones */}
                <div className="space-y-1.5">
                  <Label htmlFor="sheet-obs" className="text-xs font-medium text-muted-foreground">
                    Observaciones iniciales del proceso (Opcional)
                  </Label>
                  <Textarea
                    id="sheet-obs"
                    placeholder="Notas sobre el proceso de selección o seniority..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={2}
                    disabled={loading}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Drawer Footer */}
        <SheetFooter className="p-4 sm:p-6 border-t bg-muted/20">
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
            form="user-creation-form"
            disabled={loading}
            size="sm"
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {role === 'candidate' ? 'Crear e Iniciar Proceso' : 'Crear Evaluador'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
