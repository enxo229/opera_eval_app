'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                throw signInError
            }

            if (data.user) {
                // Redirigimos sin importar, el middleware se encargará de despacharlos al dashboard correcto
                // O podemos leer el perfil aquí para dirigir
                const { data: profileData } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
                const profile = profileData as { role: string } | null

                if (profile?.role === 'evaluator') {
                    router.push('/evaluator')
                } else if (profile?.role === 'candidate') {
                    router.push('/candidate')
                } else {
                    router.push('/')
                }
            }
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-card border-border shadow-md">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight text-primary drop-shadow-sm">OTP Login</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Ingresa tus credenciales para acceder a la plataforma.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">Correo electrónico</label>
                            <Input
                                type="email"
                                placeholder="ejemplo@seti.com.co"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background border-input text-foreground"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">Contraseña</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background border-input text-foreground"
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground drop-shadow-sm" type="submit" disabled={isLoading}>
                            {isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
