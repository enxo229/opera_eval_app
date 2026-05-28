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
    'gemini-2.5-flash',      // 1. Principal: Ultra-rápido, creativo y estable.
    'gemma-4-31b-it',        // 2. Fallback: Gratuito, razonativo.
    'gemma-4-26b-a4b-it',    // 3. Fallback: Consistente.
    'gemini-2.5-flash-lite'  // 4. Fallback Universal: Económico, resistente.
]

// Cadena de prioridad para evaluación (scoring estricto en JSON)
const EVALUATION_MODEL_CHAIN = [
    'gemini-2.5-flash',      // 1. Principal: Calificación e interpretación en milisegundos.
    'gemma-4-31b-it',        // 2. Fallback: Alta capacidad analítica.
    'gemma-4-26b-a4b-it',    // 3. Fallback: Rápido.
    'gemini-2.5-flash-lite'  // 4. Fallback Universal: Resistente.
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
async function callWithRetry(modelChain: string[], prompt: string, maxRetries = 3, temperature?: number): Promise<string> {
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
            const model = genAI.getGenerativeModel({ 
                model: modelId,
                generationConfig: typeof temperature === 'number' ? { temperature } : undefined
            })

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
                // Manejar errores de Límites, Indisponibilidad de Servicio o Modelo No Encontrado (404/400)
                const isRecoverableError =
                    error?.status === 429 || error?.message?.includes('429') ||
                    error?.status === 503 || error?.message?.includes('503') ||
                    error?.status === 500 || error?.message?.includes('500') ||
                    error?.status === 404 || error?.message?.includes('404') ||
                    error?.status === 400 || error?.message?.includes('400');

                if (isRecoverableError) {
                    attempt++
                    log.ai.warn(`Error (4xx/5xx) con modelo ${modelId}. Fallback/Reintento en curso...`, {
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
 * Usa una temperatura alta de 0.85 para propiciar creatividad y dinamismo
 */
export async function generateContentWithRetry(prompt: string, maxRetries = 3, temperature = 0.85): Promise<string> {
    return callWithRetry(GENERATION_MODEL_CHAIN, prompt, maxRetries, temperature)
}

/**
 * Evalúa/analiza contenido (scoring, rúbricas, JSON estricto)
 * Usa la cadena de modelos de evaluación (Gemma 3 27B -> Gemma 3 12B -> Gemini 2.5 Flash Lite)
 * Usa una temperatura baja de 0.15 para precisión y consistencia estrictas
 */
export async function evaluateContentWithRetry(prompt: string, maxRetries = 3, temperature = 0.15): Promise<string> {
    return callWithRetry(EVALUATION_MODEL_CHAIN, prompt, maxRetries, temperature)
}

/**
 * Genera feedback narrativo para reportes ejecutivos.
 * Usa la cadena de modelos de reporte (Gemma 4 31B -> Gemma 4 26B -> Gemini 2.5 Flash Lite)
 * Usa una temperatura media de 0.70 para fluidez narrativa y formalidad
 */
export async function generateReportFeedbackWithRetry(prompt: string, maxRetries = 3, temperature = 0.7): Promise<string> {
    return callWithRetry(REPORT_MODEL_CHAIN, prompt, maxRetries, temperature)
}

/**
 * Fuerza la generación usando exclusivamente Gemini 2.5 Flash Lite (Estrategia de respaldo manual).
 */
export async function generateReportFeedbackLite(prompt: string): Promise<string> {
    return callWithRetry(['gemini-2.5-flash-lite'], prompt, 2, 0.7)
}

/**
 * IA-2: Evalúa el prompt que el candidato formuló en su herramienta de IA.
 * Analiza 5 dimensiones de Ingeniería de Contexto (Prompt Engineering) y sugiere un score riguroso.
 */
export async function evaluateIA2Prompt(prompt: string): Promise<string> {
    const systemPrompt = `Eres un evaluador ESTRICTO y experto en Ingeniería de Prompts (Prompt Engineering) evaluando candidatos para un rol de NOC/SRE.

El candidato participó en un ejercicio práctico donde se le dio este enunciado textual:
"Usando la herramienta de IA que prefieras, pregúntale cómo buscarías en Elasticsearch todos los logs de error del servidor srv-prod-payments-01 del día de ayer."

A continuación, te presentaré el prompt EXACTO que el candidato ingresó en su herramienta de IA (ChatGPT/Copilot/etc.).

IMPORTANTE: NO estás evaluando si el candidato mencionó los parámetros del enunciado. Eso es lo MÍNIMO esperado (el enunciado ya se los dio). 
Lo que evalúas es si el candidato demostró HABILIDAD DE INGENIERÍA DE PROMPTS al formular su consulta. Un candidato que simplemente parafrasea o copia el enunciado NO demuestra habilidad de prompting.

Debes analizar RIGUROSAMENTE estas 5 dimensiones técnicas de Prompt Engineering:

1. ASIGNACIÓN DE ROL (0 o 1 punto): ¿Le asignó un rol, persona o nivel de expertise al modelo? 
   Ejemplo que SÍ puntúa: "Actúa como un ingeniero SRE experto en Elasticsearch..."
   Ejemplo que NO puntúa: No asignar rol alguno (simplemente preguntar directamente).

2. CONTEXTO TÉCNICO (0 o 1 punto): ¿Incluyó los 4 parámetros clave del escenario?
   - Herramienta: "Elasticsearch"
   - Tipo de log: "logs de error" / "level: ERROR"
   - Servidor: "srv-prod-payments-01"
   - Marco temporal: "ayer" / "últimas 24 horas"
   NOTA CRÍTICA: Si el candidato simplemente reformuló el enunciado que le dieron sin agregar valor, esto le da 1 punto en esta dimensión PERO NO en las demás. Parafrasear no es ingeniería de prompts.

3. FORMATO DE SALIDA (0 o 1 punto): ¿Especificó cómo quiere recibir la respuesta?
   Ejemplo que SÍ puntúa: "Dame la query en formato JSON de Elasticsearch DSL", "Respóndeme paso a paso", "Muéstrame el query con comentarios explicativos"
   Ejemplo que NO puntúa: No indicar formato alguno (dejar que el modelo decida libremente).

4. RESTRICCIONES / GUARDRAILS (0 o 1 punto): ¿Acotó el alcance para evitar respuestas genéricas o ambiguas?
   Ejemplo que SÍ puntúa: "Usa el campo @timestamp para el rango de fecha y level para filtrar errores", "No incluyas aggregations, solo la búsqueda básica"
   Ejemplo que NO puntúa: Preguntas abiertas sin restricciones técnicas.

5. SOFISTICACIÓN / ITERACIÓN (0 o 1 punto): ¿Demostró madurez más allá de una pregunta plana?
   Ejemplo que SÍ puntúa: Pedir explicación de cada parte del query, solicitar variantes alternativas, pedir validación del resultado, incluir un escenario de follow-up.
   Ejemplo que NO puntúa: Una sola pregunta directa sin profundidad.

ESCALA DE PUNTUACIÓN (suma de las 5 dimensiones):
- 5/5: Prompt de nivel profesional/senior. Incluye rol + parámetros + formato + restricciones + sofisticación.
- 4/5: Prompt avanzado. Incluye rol + parámetros + formato o restricciones. Demuestra intención clara de guiar al modelo.
- 3/5: Prompt funcional. Incluye los parámetros y al menos un elemento avanzado (rol O formato). Obtendría respuesta útil pero no óptima.
- 2/5: Prompt básico / paráfrasis. Menciona los parámetros clave pero es una reformulación plana del enunciado sin técnicas de prompting.
- 1/5: Prompt vago. Faltan parámetros clave o es demasiado genérico.
- 0/5: Irrelevante. No tiene relación con el ejercicio.

REGLA ANTI-INFLACIÓN: Si el candidato SOLO reformuló el enunciado original (mencionando Elasticsearch, logs de error, el servidor y ayer) SIN añadir rol, formato, restricciones ni sofisticación, el puntaje MÁXIMO es 2. No importa qué tan "clara" sea la reformulación: parafrasear no es prompt engineering.

Prompt enviado por el candidato:
"""
${prompt}
"""

Responde estricta y ÚNICAMENTE con un objeto JSON (sin delimitadores markdown \\\`\\\`\\\`json) con el siguiente formato:
{
  "context_analysis": "Análisis de qué dimensiones técnicas de prompt engineering aplicó y cuáles omitió. Sé específico sobre cada una de las 5 dimensiones. Máx. 3 oraciones.",
  "clarity_analysis": "Evaluación del nivel de madurez y sofisticación del prompt. ¿Es una simple paráfrasis del enunciado o demuestra técnicas reales de ingeniería de contexto? Máx. 2 oraciones.",
  "suggested_score": 0,
  "feedback_to_evaluator": "Un comentario directo al humano (Evaluador) indicándole qué nivel de habilidad de prompting demuestra el candidato y qué le faltó para obtener un puntaje superior."
}`

    return evaluateContentWithRetry(systemPrompt)
}
