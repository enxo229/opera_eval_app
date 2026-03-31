'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ExternalLink, Info, Loader2, ChevronRight, Gavel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useCandidateContext } from '@/hooks/useCandidateContext'
import { saveLegalConsent, getLegalConsentStatus } from '@/app/actions/candidate/legal'

export default function LegalOnboardingPage() {
    const router = useRouter()
    const { evaluationId, contextLoaded, educationLevel } = useCandidateContext()
    
    const [tcAccepted, setTcAccepted] = useState(false)
    const [dataAccepted, setDataAccepted] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [checkingStatus, setCheckingStatus] = useState(true)

    const canContinue = tcAccepted && dataAccepted

    // Check if already accepted to skip
    useEffect(() => {
        async function checkStatus() {
            if (evaluationId) {
                const status = await getLegalConsentStatus(evaluationId)
                if (status.accepted) {
                    // Already accepted, redirect to eligibility or test
                    if (!educationLevel) {
                        router.push('/candidate/eligibility')
                    } else {
                        router.push('/candidate')
                    }
                }
            }
            setCheckingStatus(false)
        }
        if (contextLoaded) {
            checkStatus()
        }
    }, [contextLoaded, evaluationId, educationLevel, router])

    const handleContinue = async () => {
        if (!canContinue || !evaluationId) {
            setShowHelp(true)
            return
        }

        setSaving(true)
        try {
            const result = await saveLegalConsent(evaluationId)
            if (result.success) {
                // Proceder a escolaridad
                router.push('/candidate/eligibility')
            } else {
                alert('Error al guardar el consentimiento. Por favor intenta de nuevo.')
            }
        } catch (error) {
            console.error('Error in onboarding:', error)
        } finally {
            setSaving(false)
        }
    }

    if (!contextLoaded || checkingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Cargando condiciones legales...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-2xl px-2 sm:px-0"
            >
                <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl border-2 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                    
                    <CardHeader className="space-y-4 pb-8 text-center sm:text-left pt-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center border border-primary/20 shadow-inner">
                                <ShieldCheck className="h-8 w-8 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">Cumplimiento y Privacidad</CardTitle>
                                <CardDescription className="text-muted-foreground text-base">Revisión de términos requerida para el proceso de selección de SETI SAS.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-8 py-6 px-6 sm:px-8">
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 space-y-3 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Gavel className="h-12 w-12" />
                            </div>
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Info className="h-4 w-4" /> Importante: Ley 1581 de 2012
                            </h3>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                Para garantizar la transparencia de este proceso técnico y el cumplimiento del **Habeas Data** en Colombia, es necesario que expreses tu consentimiento previo e informado.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Checkbox 1: T&C */}
                            <div 
                                className={`flex items-start space-x-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                                    tcAccepted ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border/40 hover:border-border/80 bg-background/40'
                                }`}
                                onClick={() => setTcAccepted(!tcAccepted)}
                            >
                                <Checkbox 
                                    id="terms" 
                                    checked={tcAccepted}
                                    onCheckedChange={(checked) => setTcAccepted(checked === true)}
                                    className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label 
                                        htmlFor="terms" 
                                        className="text-sm font-semibold leading-snug cursor-pointer flex items-center gap-1.5"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Aceptación de Términos y Condiciones
                                    </Label>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        He leído y acepto los <a href="/terms" target="_blank" className="text-primary hover:underline font-bold inline-flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>Términos y Condiciones<ExternalLink className="h-3 w-3" /></a> de uso de la plataforma de evaluación técnica.
                                    </p>
                                </div>
                            </div>

                            {/* Checkbox 2: Habeas Data */}
                            <div 
                                className={`flex items-start space-x-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                                    dataAccepted ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border/40 hover:border-border/80 bg-background/40'
                                }`}
                                onClick={() => setDataAccepted(!dataAccepted)}
                            >
                                <Checkbox 
                                    id="privacy" 
                                    checked={dataAccepted}
                                    onCheckedChange={(checked) => setDataAccepted(checked === true)}
                                    className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label 
                                        htmlFor="privacy" 
                                        className="text-sm font-semibold leading-snug cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Tratamiento de Datos Personales
                                    </Label>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Autorizo de manera expresa a **SETI SAS** para el tratamiento de mis datos según la <a href="/privacy" target="_blank" className="text-primary hover:underline font-bold inline-flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>Política de Tratamiento de Datos<ExternalLink className="h-3 w-3" /></a>. Los resultados técnicos solo se compartirán con la empresa cliente del proceso.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showHelp && !canContinue && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 text-xs flex items-center gap-2"
                                >
                                    <Info className="h-3.5 w-3.5 shrink-0" />
                                    <span>Debes aceptar ambos documentos para poder continuar con tu evaluación técnica.</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>

                    <CardFooter className="bg-muted/30 px-6 sm:px-8 py-6 rounded-b-xl border-t flex flex-col gap-3">
                        <Button
                            disabled={saving}
                            onClick={handleContinue}
                            className={`w-full h-12 text-lg font-bold transition-all duration-300 shadow-lg ${
                                canContinue 
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground scale-[1.01] shadow-primary/20' 
                                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-70 border border-border'
                            }`}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    Continuar con la Evaluación
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-semibold opacity-50">
                            Plataforma de evaluación técnica / SETI SAS 2026
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
