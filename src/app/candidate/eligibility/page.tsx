'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
    GraduationCap, 
    ChevronRight, 
    Info, 
    Loader2 
} from 'lucide-react'
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCandidateContext } from '@/hooks/useCandidateContext'

const EDUCATION_LEVELS = [
    { 
        value: 'bachiller', 
        label: 'Bachiller (sin formación TI)', 
        icon: '🎓',
        description: 'Selecciona esta opción si tu máximo título obtenido es Bachiller, incluso si cuentas con experiencia previa en tecnología.'
    },
    { 
        value: 'tecnico_sena', 
        label: 'Técnico SENA (Sistemas, Redes, Infraestructura o afín)', 
        icon: '🔧',
        description: 'Aplica para estudios técnicos certificados. Si aún no te has graduado pero ya iniciaste tu etapa práctica, esta es tu elección correcta.'
    },
    { 
        value: 'tecnologo', 
        label: 'Tecnólogo (cualquier área TI)', 
        icon: '💻',
        description: 'Si ya eres graduado como tecnólogo o te encuentras a menos de 3 meses de finalizar tu ciclo, esta es la opción indicada para ti.'
    },
    { 
        value: 'profesional', 
        label: 'Profesional / Ingeniería (Sistemas, Electrónica, Telecomunicaciones o afín)', 
        icon: '🎯',
        description: 'Si eres graduado profesional, cuentas con posgrado, o si estás cursando los últimos 6 meses de tu carrera, selecciona esta opción.'
    },
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
        <TooltipProvider>
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
                <div className="w-full max-w-2xl space-y-8">
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 border border-primary/20 shadow-sm">
                            <GraduationCap className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground drop-shadow-sm uppercase font-sans">
                            Antes de Empezar
                        </h1>
                        <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                            Selecciona tu nivel de formación académica actual. Este dato es informativo y no afecta tu evaluación.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:gap-4">
                        {EDUCATION_LEVELS.map((level) => (
                            <div key={level.value} className="relative group">
                                <button
                                    onClick={() => setSelected(level.value)}
                                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                                        selected === level.value
                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary/20'
                                        : 'border-border bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:bg-card/80 hover:shadow-md'
                                    }`}
                                >
                                    {selected === level.value && (
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                                    )}
                                    <span className="text-3xl filter drop-shadow-sm shrink-0">{level.icon}</span>
                                    <div className="flex-1 pr-8">
                                        <span className={`text-base sm:text-lg font-semibold block transition-colors ${
                                            selected === level.value ? 'text-primary' : 'text-foreground'
                                        }`}>
                                            {level.label}
                                        </span>
                                    </div>
                                </button>
                                
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                                    <Tooltip>
                                        <TooltipTrigger
                                            className={`p-2 rounded-full transition-all duration-200 outline-none ${
                                                selected === level.value 
                                                ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                                                : 'text-muted-foreground hover:text-primary hover:bg-secondary'
                                            }`}
                                            aria-label="Más información"
                                        >
                                            <Info className="h-5 w-5" />
                                        </TooltipTrigger>
                                        <TooltipContent 
                                            side="right" 
                                            className="max-w-[280px] p-4 bg-popover/95 backdrop-blur-md border-primary/20 text-foreground shadow-xl rounded-xl animate-in fade-in zoom-in duration-200"
                                        >
                                            <p className="text-sm leading-relaxed font-medium">
                                                {level.description}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 flex flex-col items-center gap-4">
                        <Button
                            onClick={handleContinue}
                            disabled={!selected || saving}
                            className={`w-full h-14 text-xl font-bold transition-all duration-500 rounded-2xl shadow-xl ${
                                selected 
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground scale-[1.01] shadow-primary/20' 
                                : 'bg-muted text-muted-foreground opacity-60 border-border cursor-not-allowed'
                            }`}
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Guardando Perfil...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Continuar a la Evaluación
                                    <ChevronRight className="h-6 w-6" />
                                </span>
                            )}
                        </Button>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">
                            Paso obligatorio de validación académica
                        </p>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}
