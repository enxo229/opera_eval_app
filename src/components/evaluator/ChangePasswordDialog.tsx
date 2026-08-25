'use client'

import * as React from 'react'
import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { changeUserPasswordAction } from '@/app/actions/admin'
import {
  KeyRound,
  Eye,
  EyeOff,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  User,
} from 'lucide-react'

export interface PasswordTargetUser {
  id: string
  email: string
  fullName: string
  role?: string
}

interface ChangePasswordDialogProps {
  user: PasswordTargetUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ChangePasswordDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ChangePasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Reset form when dialog closes or user changes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPassword('')
      setConfirmPassword('')
      setError(null)
      setSuccess(null)
    }
    onOpenChange(isOpen)
  }

  // Generate a friendly yet strong random password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let generated = 'Seti'
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(generated)
    setConfirmPassword(generated)
    setShowPassword(true)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!user) return

    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifica.')
      return
    }

    setLoading(true)
    try {
      const res = await changeUserPasswordAction(user.id, password)
      if (res.success) {
        setSuccess('¡Contraseña actualizada exitosamente!')
        setTimeout(() => {
          handleOpenChange(false)
          onSuccess?.()
        }, 1200)
      } else {
        setError(res.error || 'No se pudo actualizar la contraseña.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado del servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-foreground">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <KeyRound className="size-4" />
            </div>
            <DialogTitle className="text-base font-semibold">Cambiar Contraseña</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Asigna una nueva credencial de acceso para este usuario de manera inmediata.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="bg-muted/40 rounded-lg p-3 border space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{user.fullName || 'Usuario'}</span>
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
            <div className="text-muted-foreground font-mono">{user.email}</div>
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-password" className="text-xs font-medium">
                Nueva Contraseña
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateStrongPassword}
                className="h-6 text-[11px] text-primary gap-1 px-1.5 hover:bg-primary/10"
              >
                <Wand2 className="size-3" />
                Generar aleatoria
              </Button>
            </div>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="pr-9 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-xs font-medium">
              Confirmar Contraseña
            </Label>
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="text-xs"
            />
          </div>

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
              disabled={loading || !password || !confirmPassword}
              className="text-xs gap-1.5"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
              Actualizar Contraseña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
