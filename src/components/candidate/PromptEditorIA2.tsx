'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { getIA2State, saveIA2Prompt } from '@/app/actions/candidate/ia'
import { AlertCircle, Bot, Save, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function PromptEditorIA2({ evaluationId, onStatusChange }: { evaluationId: string; onStatusChange?: (finished: boolean) => void }) {
    const [promptText, setPromptText] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isFinished, setIsFinished] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (onStatusChange) {
            onStatusChange(isFinished)
        }
    }, [isFinished, onStatusChange])

    // Cargar estado inicial
    useEffect(() => {
        const load = async () => {
            const state = await getIA2State(evaluationId)
            if (state.promptText) {
                setPromptText(state.promptText)
            }
            setIsFinished(state.isFinished)
            setIsLoading(false)
        }
        load()
    }, [evaluationId])

    const handleSavePrompt = async () => {
        if (!promptText.trim()) {
            setErrorMsg('Por favor, ingresa el prompt que utilizaste.')
            return
        }

        setErrorMsg('')
        setIsSaving(true)

        const result = await saveIA2Prompt(evaluationId, promptText)
        if (result.success) {
            setIsFinished(true)
        } else {
            setErrorMsg(result.error || 'Error al guardar el prompt.')
        }

        setIsSaving(false)
    }

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando herramienta de IA...</div>
    }

    return (
        <Card className="border-border shadow-sm max-w-4xl mx-auto">
            <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-6 rounded-t-xl">
                <div className="flex gap-4 items-start">
                    <div className="bg-indigo-500 text-white p-2.5 rounded-lg shrink-0 mt-1">
                        <NextImage src="/icons/AIAgent.png" alt="IA" width={48} height={48} />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-indigo-900 mb-2">Ejercicio Práctico: Herramientas de IA</CardTitle>
                        <CardDescription className="text-indigo-800/80 text-sm leading-relaxed max-w-2xl">
                            Esta sección evalúa cómo interactúas con herramientas de inteligencia artificial para resolver problemas cotidianos de la operación técnica.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-slate-500" /> Escenario Propuesto
                    </h3>
                    <div className="bg-white border border-slate-100 p-4 rounded-md shadow-sm">
                        <p className="text-slate-800 text-base leading-relaxed font-medium italic">
                            "Imagina que necesitas buscar en Elasticsearch todos los logs de error del servidor <code className="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded text-sm not-italic">srv-prod-payments-01</code> que ocurrieron durante el <span className="font-bold underline decoration-indigo-300 decoration-2 underline-offset-2">día de ayer</span>."
                        </p>
                    </div>
                    <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                        Abre tu herramienta de IA preferida (ChatGPT, Gemini, Copilot, etc.) y fórmula la pregunta o instrucción que utilizarías para obtener la respuesta a este problema. Luego, <strong>copia y pega ese texto exacto aquí abajo</strong>.
                    </p>
                </div>

                {errorMsg && (
                    <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{errorMsg}</AlertDescription>
                    </Alert>
                )}

                {isFinished && (
                    <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <AlertTitle className="text-emerald-800 font-bold">¡Prompt enviado con éxito!</AlertTitle>
                        <AlertDescription className="text-emerald-700">
                            Tu prompt ha sido guardado y analizado. Ya puedes cerrar esta sección.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">Tu Prompt (Ingresa la instrucción exacta que usaste)</label>
                    <textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        disabled={isFinished || isSaving}
                        rows={6}
                        placeholder={isFinished ? "Prompt enviado." : "Ingresa tu instrucción aquí..."}
                        className="w-full p-4 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed font-mono shadow-inner resize-none transition-all"
                    />
                </div>

                {!isFinished && (
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button
                            onClick={handleSavePrompt}
                            disabled={isSaving || !promptText.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md px-8 py-6 h-auto text-base gap-2"
                        >
                            {isSaving ? (
                                <>Generando Análisis de IA...</>
                            ) : (
                                <><Save className="w-5 h-5" /> Enviar Prompt Definitivo</>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
