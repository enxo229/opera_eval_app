import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

// Initialize the Gemini API client
// Initialize the Gemini API client
const apiKey = process.env.APP_GEMINI_API_KEY || ''
if (!apiKey) {
    console.error('[Gemini] ERROR: GEMINI_API_KEY no encontrada en el entorno.')
} else {
    console.log(`[Gemini] API Key cargada (Primeros 10 caracteres: ${apiKey.substring(0, 10)}...)`)
}

const genAI = new GoogleGenerativeAI(apiKey)

// =============================================
// CADENAS DE MODELOS (Fallback/Cost Strategy)
// =============================================
//
// Usaremos un modelo primario y si falla por Hard Limits (429, 503)
// se saltará al siguiente modelo en la cadena de prioridad.

// Cadena de prioridad (Primary -> Fallback) para generación de contenido
const GENERATION_MODEL_CHAIN = [
    'gemma-3-27b-it',        // 1. Principal: Gratuito, mejor razonativo.
    'gemma-3-12b-it',        // 2. Fallback: Gratuito, ultra-rápido.
    'gemini-2.5-flash-lite'  // 3. Fallback Universal: Económico, muy resistente.
]

// Cadena de prioridad para evaluación (scoring estricto en JSON)
const EVALUATION_MODEL_CHAIN = [
    'gemma-3-27b-it',        // 1. Principal: Altísima capacidad analítica, gratuito.
    'gemini-2.5-flash-lite'  // 2. Fallback: Económico y resistente.
]

/**
 * Filtra la PII (Personally Identifiable Information) básica de los prompts
 * DESHABILITADO por solicitud del usuario para evitar falsos positivos con fechas/logs.
 */
export function sanitizePII(text: string): string {
    return text // No sanitization
}

/**
 * Espera un número determinado de milisegundos
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Wrapper genérico para llamar a Gemini con Exponential Backoff y Model Fallback
 */
async function callWithRetry(modelChain: string[], prompt: string, maxRetries = 3): Promise<string> {
    const finalPrompt = prompt
    let attempt = 0
    let baseDelayMs = 2000

    while (attempt < maxRetries) {
        // Seleccionamos el modelo según el intento.
        // Si attempt >= longitud de la cadena, nos quedamos con el último modelo de la cadena.
        const modelId = modelChain[Math.min(attempt, modelChain.length - 1)]
        const model = genAI.getGenerativeModel({ model: modelId })

        try {
            const result = await model.generateContent(finalPrompt)
            return result.response.text()
        } catch (error: any) {
            // Manejar errores de Límites o Indisponibilidad de Servicio
            const isRateLimitOrUnavailable =
                error?.status === 429 || error?.message?.includes('429') ||
                error?.status === 503 || error?.message?.includes('503') ||
                error?.status === 500 || error?.message?.includes('500');

            if (isRateLimitOrUnavailable) {
                attempt++
                if (attempt >= maxRetries) {
                    throw new Error(`Rate limit exceeded or service unavailable after ${maxRetries} attempts. Last model tried: ${modelId}`)
                }
                const waitTime = baseDelayMs * Math.pow(2, attempt - 1)
                console.warn(`[Gemini] Error (429/500/503) con modelo ${modelId}. Fallback/Reintento en ${waitTime}ms (Intento ${attempt} de ${maxRetries})...`)
                await delay(waitTime)
            } else {
                throw error
            }
        }
    }

    throw new Error('Failed to generate content after maximum retries.')
}

/**
 * Genera contenido (preguntas, casos, chat)
 * Usa la cadena de modelos de generación (Gemma 3 -> Gemini 2.0 Flash Lite)
 */
export async function generateContentWithRetry(prompt: string, maxRetries = 3): Promise<string> {
    return callWithRetry(GENERATION_MODEL_CHAIN, prompt, maxRetries)
}

/**
 * Evalúa/analiza contenido (scoring, rúbricas, JSON estricto)
 * Usa la cadena de modelos de evaluación (Gemini 3.1 FL -> Gemini 2.0 FL)
 */
export async function evaluateContentWithRetry(prompt: string, maxRetries = 3): Promise<string> {
    return callWithRetry(EVALUATION_MODEL_CHAIN, prompt, maxRetries)
}

/**
 * IA-2: Evalúa el prompt que el candidato formuló en su herramienta de IA.
 * Analiza el contexto, claridad y sugiere un score basado en el ejercicio de Elasticsearch.
 */
export async function evaluateIA2Prompt(prompt: string): Promise<string> {
    const systemPrompt = `Eres un evaluador experto en Ingeniería de Prompts (Prompt Engineering) evaluando candidatos para un rol de NOC.
El candidato participó en un ejercicio práctico donde se le pidió resolver este escenario: 
"Usando la herramienta de IA que prefieras, pregúntale cómo buscarías en Elasticsearch todos los logs de error del servidor srv-prod-payments-01 del día de ayer."

A continuación, te presentaré el prompt exacto que el candidato ingresó en su herramienta de IA (ChatGPT/Copilot/etc.).
Debes analizarlo rigurosamente observando:
1. Contexto provisto: ¿Incluyó "Elasticsearch", "logs de error", el nombre del servidor ("srv-prod-payments-01") y el marco de tiempo ("ayer")?
2. Claridad de la instrucción: ¿Es una orden o pregunta directa que evitará alucinaciones del modelo?

Prompt enviado por el candidato:
"""
\${prompt}
"""

Responde estricta y ÚNICAMENTE con un objeto JSON (sin delimitadores markdown \\\`\\\`\\\`json) con el siguiente formato:
{
  "context_analysis": "Análisis breve de qué elementos de contexto incluyó y cuáles omitió. Máx. 2 oraciones.",
  "clarity_analysis": "Análisis cualitativo del nivel de madurez al armar el prompt (claro, vago, ambiguo). Máx. 2 oraciones.",
  "suggested_score": 0, /* Un puntaje sugerido de 0 a 5. (5: Perfecto con roles y contexto, 4: Muy bueno, 3: Funcional pero le falta precisión, 2: Vago/incompleto, 1: Poco claro, 0: Irrelevante) */
  "feedback_to_evaluator": "Un comentario directo al humano (Evaluador) indicándole qué observar del candidato."
}`

    return evaluateContentWithRetry(systemPrompt)
}
