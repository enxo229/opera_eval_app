import { GoogleGenerativeAI } from '@google/generative-ai'
import { trace, SpanStatusCode } from '@opentelemetry/api'
import { log } from '@/lib/observability/logger'
import { metricsApp } from '@/lib/observability/metrics'

// Initialize the OTel tracer for this module
const tracer = trace.getTracer('ai.gemini')

// Initialize the Gemini API client
const apiKey = process.env.APP_GEMINI_API_KEY || ''
if (!apiKey) {
    console.error('[Gemini] ERROR: APP_GEMINI_API_KEY no encontrada en el entorno.')
} else if (process.env.NODE_ENV === 'development') {
    console.log(`[Gemini] API Key cargada (${apiKey.length} caracteres)`)
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
    'gemma-3-12b-it',        // 2. Fallback: Gratuito, rápido, buen análisis.
    'gemini-2.5-flash-lite'  // 3. Fallback Universal: Económico y resistente.
]

// Cadena de prioridad para Reportes Ejecutivos (Narrativa de alta calidad)
const REPORT_MODEL_CHAIN = [
    'gemma-4-31b-it',        // 1. Principal: Máxima razonamiento y narrativa.
    'gemma-4-26b-a4b-it',    // 2. Fallback 1: Consistente.
    'gemini-2.5-flash-lite'  // 3. Fallback Universal: Resistente.
]


/**
 * Espera un número determinado de milisegundos
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Wrapper genérico para llamar a Gemini con Exponential Backoff y Model Fallback
 */
async function callWithRetry(modelChain: string[], prompt: string, maxRetries = 3): Promise<string> {
    return tracer.startActiveSpan('gemini.generateContent', async (span) => {
        let attempt = 0
        const baseDelayMs = 2000

        span.setAttribute('gen_ai.system', 'gemini')
        span.setAttribute('gen_ai.operation.name', 'chat')
        
        if (process.env.OTEL_GENAI_CAPTURE_CONTENT === 'true') {
            span.setAttribute('gen_ai.prompt', prompt)
        }

        while (attempt < maxRetries) {
            // Seleccionamos el modelo según el intento.
            const modelId = modelChain[Math.min(attempt, modelChain.length - 1)]
            const model = genAI.getGenerativeModel({ model: modelId })

            span.setAttribute('gen_ai.request.model', modelId)
            span.setAttribute('otp.ai.is_fallback', attempt > 0)
            span.setAttribute('otp.ai.attempt', attempt)

            const startTime = Date.now()
            try {
                const result = await model.generateContent(prompt)
                const text = result.response.text()
                
                const duration = Date.now() - startTime
                metricsApp.recordAiRequest(duration, { 
                    model_id: modelId, 
                    status: 'success', 
                    is_fallback: attempt > 0 
                });

                if (process.env.OTEL_GENAI_CAPTURE_CONTENT === 'true') {
                    span.setAttribute('gen_ai.completion', text) // Caution: Potential PII
                }
                
                span.setStatus({ code: SpanStatusCode.OK })
                span.end()
                return text
            } catch (error: any) {
                const duration = Date.now() - startTime
                metricsApp.recordAiRequest(duration, { 
                    model_id: modelId, 
                    status: 'error', 
                    is_fallback: attempt > 0 
                });

                span.recordException(error)
                // Manejar errores de Límites o Indisponibilidad de Servicio
                const isRateLimitOrUnavailable =
                    error?.status === 429 || error?.message?.includes('429') ||
                    error?.status === 503 || error?.message?.includes('503') ||
                    error?.status === 500 || error?.message?.includes('500');

                if (isRateLimitOrUnavailable) {
                    attempt++
                    log.ai.warn(`Error (429/500/503) con modelo ${modelId}. Fallback/Reintento en curso...`, {
                        'otp.ai.model': modelId,
                        'otp.ai.attempt': attempt,
                        'otp.ai.status': error?.status || 'unknown'
                    });

                    if (attempt >= maxRetries) {
                        const finalMsg = `Rate limit exceeded or service unavailable after ${maxRetries} attempts. Last model tried: ${modelId}`;
                        log.ai.error(finalMsg, error, { 'otp.ai.model': modelId });
                        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                        span.end()
                        throw new Error(finalMsg)
                    }
                    const waitTime = baseDelayMs * Math.pow(2, attempt - 1)
                    await delay(waitTime)
                } else {
                    log.ai.error(`Error no recuperable en Gemini (${modelId})`, error, { 'otp.ai.model': modelId });
                    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                    span.end()
                    throw error
                }
            }
        }

        const finalError = new Error('Failed to generate content after maximum retries.')
        span.setStatus({ code: SpanStatusCode.ERROR, message: finalError.message })
        span.end()
        throw finalError
    })
}

/**
 * Genera contenido (preguntas, casos, chat)
 * Usa la cadena de modelos de generación (Gemma 3 27B -> Gemma 3 12B -> Gemini 2.5 Flash Lite)
 */
export async function generateContentWithRetry(prompt: string, maxRetries = 3): Promise<string> {
    return callWithRetry(GENERATION_MODEL_CHAIN, prompt, maxRetries)
}

/**
 * Evalúa/analiza contenido (scoring, rúbricas, JSON estricto)
 * Usa la cadena de modelos de evaluación (Gemma 3 27B -> Gemma 3 12B -> Gemini 2.5 Flash Lite)
 */
export async function evaluateContentWithRetry(prompt: string, maxRetries = 3): Promise<string> {
    return callWithRetry(EVALUATION_MODEL_CHAIN, prompt, maxRetries)
}

/**
 * Genera feedback narrativo para reportes ejecutivos.
 * Usa la cadena de modelos de reporte (Gemma 4 31B -> Gemma 4 26B -> Gemini 2.5 Flash Lite)
 */
export async function generateReportFeedbackWithRetry(prompt: string, maxRetries = 3): Promise<string> {
    return callWithRetry(REPORT_MODEL_CHAIN, prompt, maxRetries)
}

/**
 * Fuerza la generación usando exclusivamente Gemini 2.5 Flash Lite (Estrategia de respaldo manual).
 */
export async function generateReportFeedbackLite(prompt: string): Promise<string> {
    return callWithRetry(['gemini-2.5-flash-lite'], prompt, 2)
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
${prompt}
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
