'use server'

/**
 * Normaliza la dimensión A3.
 * Para perfil general: (suma_puntos_a3 / 9) * 10 (3 preguntas x 3 pts = max 9).
 * Para otel_expert: (suma_puntos_a3 / 6) * 10 (2 preguntas x 3 pts = max 6).
 */
export async function normalizeA3(rawA3Score: number, profileTrack?: string): Promise<number> {
    const maxRaw = profileTrack === 'otel_expert' ? 6 : 9
    const clampedRaw = Math.min(Math.max(0, rawA3Score), maxRaw)
    return parseFloat(((clampedRaw / maxRaw) * 10).toFixed(2))
}

/**
 * Normaliza la dimensión A4. El puntaje obtenido se calcula como: (suma_puntos_a4 / 9) * 10.
 */
export async function normalizeA4(rawA4Score: number): Promise<number> {
    const clampedRaw = Math.min(Math.max(0, rawA4Score), 9)
    return parseFloat(((clampedRaw / 9) * 10).toFixed(2))
}

/**
 * Calcula el Subtotal de la Dimensión A
 * A1 (15), A2 (15), A3 (10 normalizado), A4 (10 normalizado). Total = 50.
 */
export async function calculateDimensionA(
    scores: { a1: number; a2: number; a3: number; a4: number },
    profileTrack?: string
): Promise<number> {
    const normA3 = await normalizeA3(scores.a3, profileTrack)
    const normA4 = await normalizeA4(scores.a4)
    const total = scores.a1 + scores.a2 + normA3 + normA4
    return parseFloat(Math.min(Math.max(0, total), 50).toFixed(2))
}

/**
 * Calcula el Subtotal de la Dimensión B
 * La BD almacena los raw_scores.
 * Para perfil general: B1 (10) + B2 (10) + B3 (10) = 30 pts.
 * Para otel_expert: B1 Ticket (18 pts) + B2 Situacional (12 pts) = 30 pts.
 */
export async function calculateDimensionB(
    scores: {
        b1: number
        b2: number
        b3: number
        b4?: number
        b5?: number
        b6?: number
    },
    profileTrack?: string
): Promise<number> {
    const rawToNorm = (val: number, maxRaw: number, maxNorm: number) => {
        const clamped = Math.min(Math.max(0, val), maxRaw)
        return (clamped / maxRaw) * maxNorm
    }

    if (profileTrack === 'otel_expert') {
        const normB1 = rawToNorm(scores.b1, 16, 18)
        const normB2 = rawToNorm(scores.b2, 16, 12)
        const total = normB1 + normB2
        return parseFloat(Math.min(Math.max(0, total), 30).toFixed(2))
    }

    // Si viene en el formato legacy B1-B6
    if (scores.b4 !== undefined && scores.b5 !== undefined && scores.b6 !== undefined && (scores.b4 > 0 || scores.b5 > 0 || scores.b6 > 0)) {
        const normB1 = rawToNorm(scores.b1, 16, 7)
        const normB2 = rawToNorm(scores.b2, 16, 7)
        const normB3 = rawToNorm(scores.b3, 12, 4)
        const normB4 = rawToNorm(scores.b4, 12, 4)
        const normB5 = rawToNorm(scores.b5, 12, 4)
        const normB6 = rawToNorm(scores.b6, 12, 4)
        const total = normB1 + normB2 + normB3 + normB4 + normB5 + normB6
        return parseFloat(Math.min(Math.max(0, total), 30).toFixed(2))
    }

    // Formato consolidado B1 (10) + B2 (10) + B3 (10) = 30
    const normB1 = rawToNorm(scores.b1, 16, 10)
    const normB2 = rawToNorm(scores.b2, 16, 10)
    const normB3 = rawToNorm(scores.b3, 12, 10)

    const total = normB1 + normB2 + normB3
    return parseFloat(Math.min(Math.max(0, total), 30).toFixed(2))
}

/**
 * Calcula el Subtotal de la Dimensión C
 * Para perfil general: C1 (max 7), C2 (max 7), C3 (max 6) = 20 pts.
 * Para otel_expert: C1 (10 pts), C2 (10 pts) = 20 pts.
 */
export async function calculateDimensionC(
    scores: { c1: number; c2: number; c3: number; c4?: number },
    profileTrack?: string
): Promise<number> {
    if (profileTrack === 'otel_expert') {
        const normC1 = (Math.min(Math.max(0, scores.c1), 5) / 5) * 10
        const normC2 = (Math.min(Math.max(0, scores.c2), 5) / 5) * 10
        const total = normC1 + normC2
        return parseFloat(Math.min(Math.max(0, total), 20).toFixed(2))
    }

    const total = (scores.c1 || 0) + (scores.c2 || 0) + (scores.c3 || 0) + (scores.c4 || 0)
    return parseFloat(Math.min(Math.max(0, total), 20).toFixed(2))
}

/**
 * Calcula el Subtotal de la Dimensión IA (Complementaria - Desempate)
 * IA1 (5), IA2 (5). Total = 10. (Se muestra aparte)
 */
export async function calculateDimensionIA(scores: { ia1: number; ia2: number }): Promise<number> {
    const total = scores.ia1 + scores.ia2
    return parseFloat(Math.min(Math.max(0, total), 10).toFixed(2))
}

export type ClassificationResult = {
    score: number
    classification: string
    color: string
}

/**
 * Ponderación Final
 * Score Final = Subtotal A + Subtotal B + Subtotal C (Escala 0-100)
 */
export async function calculateFinalScoreAndClassification(
    subA: number,
    subB: number,
    subC: number
): Promise<ClassificationResult> {
    const finalScore = parseFloat((subA + subB + subC).toFixed(2))

    if (finalScore >= 80) {
        return { score: finalScore, classification: 'Listo para pivotar', color: '#10B981' } // Verde
    } else if (finalScore >= 60) {
        return { score: finalScore, classification: 'Pivote con nivelación', color: '#F59E0B' } // Amarillo
    } else if (finalScore >= 40) {
        return { score: finalScore, classification: 'En preparación', color: '#F97316' } // Naranja
    } else {
        return { score: finalScore, classification: 'Continúa en su rol actual', color: '#EF4444' } // Rojo
    }
}
