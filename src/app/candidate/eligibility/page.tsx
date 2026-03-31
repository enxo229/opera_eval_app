'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Terminal, HelpCircle, GitBranch, Bot, FileText, Sparkles, User, Mail, GraduationCap, Loader2, ChevronRight } from 'lucide-react'
import { useCandidateContext } from '@/hooks/useCandidateContext'

const EDUCATION_LEVELS = [
    { value: 'bachiller', label: 'Bachiller (sin formación TI)', icon: '🎓' },
    { value: 'tecnico_sena', label: 'Técnico SENA (Sistemas, Redes, Infraestructura o afín)', icon: '🔧' },
    { value: 'tecnologo', label: 'Tecnólogo (cualquier área TI)', icon: '💻' },
    { value: 'profesional', label: 'Profesional / Ingeniería (Sistemas, Electrónica, Telecomunicaciones o afín)', icon: '🎯' },
]

export default function EligibilityPage() {
    const { evaluationId, contextLoaded, legalAccepted } = useCandidateContext()
    const [selected, setSelected] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const router = useRouter()

    // Legal Guard
    useEffect(() => {
        if (contextLoaded && !legalAccepted) {
            router.push('/candidate/onboarding')
        }
    }, [contextLoaded, legalAccepted, router])

    if (!contextLoaded || !legalAccepted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const handleContinue = async () => {
        if (!selected) return
        setSaving(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from('profiles').update({ education_level: selected }).eq('id', user.id)
        }
        router.push('/candidate')
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-primary drop-shadow-sm">Antes de Empezar</h1>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto">
                        Selecciona tu nivel de formación académica actual. Este dato es informativo y no afecta tu evaluación.
                    </p>
                </div>

                <div className="space-y-3">
                    {EDUCATION_LEVELS.map((level) => (
                        <button
                            key={level.value}
                            onClick={() => setSelected(level.value)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selected === level.value
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm'
                                }`}
                        >
                            <span className="text-2xl">{level.icon}</span>
                            <span className={`font-medium ${selected === level.value ? 'text-primary' : 'text-foreground'}`}>
                                {level.label}
                            </span>
                        </button>
                    ))}
                </div>

                <Button
                    onClick={handleContinue}
                    disabled={!selected || saving}
                    className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                    {saving ? 'Guardando...' : 'Continuar a la Evaluación'}
                    {!saving && <ChevronRight className="ml-2 h-5 w-5" />}
                </Button>
            </div>
        </div>
    )
}
