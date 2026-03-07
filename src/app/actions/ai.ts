'use server'

import { generateContentWithRetry, sanitizePII } from '@/lib/ai/gemini'

export async function generateDynamicCaseA4(): Promise<string> {
    const prompt = `Actúa como un líder técnico de observabilidad. Genera un escenario de incidente técnico de Nivel 2 (caída de servidor o alto CPU) que el candidato debe investigar en un entorno Dynatrace/Grafana. Retorna solo el caso en 2 párrafos concisos sin la solución.`
    return generateContentWithRetry(prompt)
}

export async function evaluateTicketB1(ticketText: string): Promise<string> {
    const prompt = `Actúa como un evaluador senior de SRE. Analiza el ticket: "${ticketText}". Describe brevemente estructura técnica y asertividad, y asigna un puntaje del 1 al 7.`
    return generateContentWithRetry(prompt)
}

export type AIInsightsContent = {
    fortalezas: string[]
    brechas: string[]
    recomendacion_final: string
}

export async function generateFinalInsights(scoresAndCommentsContext: string): Promise<AIInsightsContent> {
    const prompt = `Dado el contexto del candidato:\n${scoresAndCommentsContext}\nRetorna ÚNICAMENTE un JSON válido: {"fortalezas":["..."], "brechas":["..."], "recomendacion_final":"..."}`
    const rawJson = await generateContentWithRetry(prompt)
    const cleaned = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        return JSON.parse(cleaned)
    } catch {
        return {
            fortalezas: ["Error"], brechas: ["Error"], recomendacion_final: "Fallo temporal del modelo."
        }
    }
}

// NUEVO: Handler para el Chat interactivo A4 llamado desde Client Component
export async function handleCandidateChat(history: string, userInput: string): Promise<string> {
    const prompt = `Eres una simulación de consola de logs/backend (Grafana/Kibana) durante un incidente P1. Responde de forma técnica y concisa simulando el resultado que arrojarían los logs o métricas según lo que el usuario pida.\n\nHistorial:\n${history}\nUSER: ${userInput}\nSISTEMA SIMULADO:`
    return generateContentWithRetry(prompt)
}
