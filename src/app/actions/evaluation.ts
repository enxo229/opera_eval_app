'use server'

/**
 * Normaliza la dimensión A3. El puntaje obtenido se calcula como: (suma_puntos_a3 / 12) * 10.
 */
export async function normalizeA3(rawA3Score: number): Promise<number> {
    // Aseguramos que no pase del máximo teórico de A3 (12 puntos)
    const clampedRaw = Math.min(Math.max(0, rawA3Score), 12)
    return parseFloat(((clampedRaw / 12) * 10).toFixed(2))
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
 * A1 (15), A2 (15), A3 (10 normalizado de 12), A4 (10 normalizado de 9). Total = 50.
 */
export async function calculateDimensionA(scores: { a1: number; a2: number; a3: number; a4: number }): Promise<number> {
    const normA3 = await normalizeA3(scores.a3)
    const normA4 = await normalizeA4(scores.a4)
    const total = scores.a1 + scores.a2 + normA3 + normA4
    return parseFloat(Math.min(Math.max(0, total), 50).toFixed(2))
}

/**
 * Calcula el Subtotal de la Dimensión B
 * La BD almacena los raw_scores.
 * B1 (max 16) -> normaliza a 7
 * B2 (max 16) -> normaliza a 7
 * B3-B6 (max 12) -> normaliza a 4
 * Total máximo redondeado a 2 decimas = 30.
 */
export async function calculateDimensionB(scores: {
    b1: number
    b2: number
    b3: number
    b4: number
    b5: number
    b6: number
}): Promise<number> {
    const rawToNorm = (val: number, maxRaw: number, maxNorm: number) => {
        const clamped = Math.min(Math.max(0, val), maxRaw)
        return (clamped / maxRaw) * maxNorm
    }

    const normB1 = rawToNorm(scores.b1, 16, 7)
    const normB2 = rawToNorm(scores.b2, 16, 7)
    const normB3 = rawToNorm(scores.b3, 12, 4)
    const normB4 = rawToNorm(scores.b4, 12, 4)
    const normB5 = rawToNorm(scores.b5, 12, 4)
    const normB6 = rawToNorm(scores.b6, 12, 4)

    const total = normB1 + normB2 + normB3 + normB4 + normB5 + normB6
    return parseFloat(Math.min(Math.max(0, total), 30).toFixed(2))
}

/**
 * Calcula el Subtotal de la Dimensión C
 * C1 (5), C2 (5), C3 (5), C4 (5). Total = 20.
 */
export async function calculateDimensionC(scores: { c1: number; c2: number; c3: number; c4: number }): Promise<number> {
    const total = scores.c1 + scores.c2 + scores.c3 + scores.c4
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
