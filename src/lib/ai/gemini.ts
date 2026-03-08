import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })

/**
 * Filtra la PII (Personally Identifiable Information) básica de los prompts
 */
export function sanitizePII(text: string): string {
    let sanitized = text
    // Filtrar correos electrónicos
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REMOVED]')
    // Filtrar números de teléfono comunes (+1234567890, 123-456-7890)
    sanitized = sanitized.replace(/\+?\b\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g, '[PHONE_REMOVED]')

    return sanitized
}

/**
 * Espera un número determinado de milisegundos
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Wrapper para llamar a Gemini con Exponential Backoff para manejar el Free Tier (15 RPM - error 429)
 */
export async function generateContentWithRetry(prompt: string, maxRetries = 3): Promise<string> {
    const sanitizedPrompt = sanitizePII(prompt)

    let attempt = 0
    let baseDelayMs = 2000 // Inicia con 2 segundos de espera

    while (attempt < maxRetries) {
        try {
            const result = await model.generateContent(sanitizedPrompt)
            return result.response.text()
        } catch (error: any) {
            if (error?.status === 429 || error?.message?.includes('429')) {
                attempt++
                if (attempt >= maxRetries) {
                    throw new Error('Rate limit exceeded. Please try again later.')
                }
                // Exponential backoff
                const waitTime = baseDelayMs * Math.pow(2, attempt - 1)
                console.warn(`[Gemini] 429 Rate Limit hit. Retrying in ${waitTime}ms (Attempt ${attempt} of ${maxRetries})...`)
                await delay(waitTime)
            } else {
                // Para otros errores (400, 500, etc), lanzamos directamente sin reintentos
                throw error
            }
        }
    }

    throw new Error('Failed to generate content after maximum retries.')
}
