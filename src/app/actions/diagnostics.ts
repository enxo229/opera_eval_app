import { createClient } from '@/lib/supabase/server'

export async function getEnvDiagnostics() {
    const key = process.env.GEMINI_API_KEY || 'NOT_FOUND'
    const maskedKey = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : 'INVALID_LENGTH'

    console.log('--- ENV DIAGNOSTICS ---')
    console.log('GEMINI_API_KEY (masked):', maskedKey)
    console.log('GEMINI_API_KEY Length:', key.length)
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('-----------------------')

    return {
        maskedKey,
        length: key.length,
        env: process.env.NODE_ENV
    }
}
