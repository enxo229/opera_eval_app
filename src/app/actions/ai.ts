'use server'

import { generateContentWithRetry, evaluateContentWithRetry } from '@/lib/ai/gemini'
import { log } from '@/lib/observability/logger'
import { analyzeAiLikelihood } from '@/app/actions/ai-detector'

/**
 * Fuerza la generación de feedback usando el modelo Lite.
 */
export async function generateNarrativeFeedbackLite(context: string, profileTrack?: string): Promise<AINarrativeReport> {
    const isOtel = profileTrack === 'otel_expert' || context.includes('otel_expert')
    const prompt = isOtel
        ? `Actúa como Consultor Principal de SRE & Arquitecto de Observabilidad, Líder del CoE de Observabilidad.
Tu objetivo es consolidar los resultados de una evaluación para un candidato al perfil de **SRE Experto en OpenTelemetry & Grafana Cloud**.

CONTEXTO DE LA EVALUACIÓN (OpenTelemetry, OTLP, OTel Collector Pipelines, Grafana Alloy Flow Mode, Mimir PromQL, Loki LogQL, Tempo TraceQL, Pyroscope Continuous Profiling, Tail Sampling, OTTL, Ticket de Incidente SRE con SLOs, Mitigación vs Preservación, Cultura Blameless, Error Budgets):
${context}

INSTRUCCIONES DE CALIBRACIÓN Y RIGUROSIDAD:
1. Analiza con criterio de Arquitecto/Principal SRE el desempeño global y la clasificación obtenida.
2. Genera un "Relato Final" de 2-3 párrafos profesional, constructivo y riguroso. Si el puntaje es mínimo (< 40 pts) o las respuestas son deficientes/erróneas, sé honesto y directo: indica con franqueza profesional que el candidato no demuestra el conocimiento requerido para el perfil de SRE Experto.
3. IDENTIFICACIÓN DE FORTALEZAS (CALIBRACIÓN CRÍTICA):
   - PROHIBIDO inventar fortalezas complacientes o condescendientes si el candidato falló las preguntas o su puntaje es mínimo.
   - Si las respuestas fueron erróneas o el puntaje es < 40 pts, el arreglo "fortalezas" DEBE contener ÚNICAMENTE: ["No se evidenciaron fortalezas técnicas demostradas en este intento"] o estar vacío [].
   - Solo incluye fortalezas si están explícitamente sustentadas en respuestas correctas del candidato.
4. Identifica una lista de "Brechas o Áreas de Mejora" (entre 2 y 4) claras y priorizadas para el stack OTel/Grafana/SRE.

Responde ÚNICAMENTE con JSON:
{
  "final_narrative": "...",
  "fortalezas": [...],
  "brechas": [...]
}`
        : `Actúa como un Consultor Senior de Talento Técnico y Líder del CoE de Observabilidad / SRE. 
Tu objetivo es consolidar los resultados de una evaluación para un candidato a Analista de Observabilidad Junior.

CONTEXTO DE LA EVALUACIÓN (Linux, AWS Cloud, Dynatrace, Grafana, Git, Pandas, GLPI, AlertOps, Teams):
${context}

INSTRUCCIONES:
1. Analiza el desempeño global y la clasificación obtenida.
2. Genera un "Relato Final" de 2-3 párrafos profesional, constructivo y de mentoría.
3. Identifica una lista de "Fortalezas" (mínimo 3).
4. Identifica una lista de "Brechas o Áreas de Mejora" (mínimo 2).

Responde ÚNICAMENTE con JSON:
{
  "final_narrative": "...",
  "fortalezas": [...],
  "brechas": [...]
}`

    const { generateReportFeedbackLite } = await import('@/lib/ai/gemini')
    const raw = await generateReportFeedbackLite(prompt)
    
    // Extractor de JSON robusto
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const cleaned = jsonMatch ? jsonMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    
    try {
        const parsed = JSON.parse(cleaned)
        log.ai.info('Feedback narrativo Lite generado exitosamente');
        return parsed
    } catch (e) {
        log.ai.error('Error parseando Narrative Feedback Lite', e as Error, { raw });
        return {
            final_narrative: "Error crítico en la comunicación con la IA. El modelo respondió con un formato inesperado.",
            fortalezas: ["Falla de formato"],
            brechas: ["Falla de formato"]
        }
    }
}

export async function generateDynamicCaseA4(profileTrack?: string): Promise<string> {
    if (profileTrack === 'otel_expert') {
        const prompt = `Actúa como un Lead SRE de Observabilidad. Genera un escenario de incidente técnico de Nivel 2 (P1/P2) enfocado en OpenTelemetry y Grafana Cloud (por ejemplo: descalibración en tail_sampling con caída de trazas de latencia alta, desbordamiento de buffer o alto consumo de memoria en el OTel Collector, o degradación de servicio por alta cardinalidad en métricas de Mimir).
Retorna el caso en 2 párrafos concisos y directos describiendo la alerta y los síntomas iniciales, sin dar la causa raíz ni la solución.`
        return generateContentWithRetry(prompt)
    }
    const prompt = `Actúa como un líder técnico de observabilidad. Genera un escenario de incidente técnico de Nivel 2 (caída de servidor o alto CPU) que el candidato debe investigar en un entorno Dynatrace/Grafana. Retorna solo el caso en 2 párrafos concisos sin la solución.`
    return generateContentWithRetry(prompt)
}

export async function evaluateTicketB1(ticketText: string): Promise<string> {
    const prompt = `Actúa como un evaluador senior de SRE. Analiza el ticket: "${ticketText}". Describe brevemente estructura técnica y asertividad, y asigna un puntaje del 1 al 7.`
    return evaluateContentWithRetry(prompt)
}

export type AIInsightsContent = {
    fortalezas: string[]
    brechas: string[]
    recomendacion_final: string
}

export type AINarrativeReport = {
    final_narrative: string
    fortalezas: string[]
    brechas: string[]
}

/**
 * Genera un feedback narrativo consolidado, fortalezas y brechas basado en toda la evaluación.
 * Usa la cadena de modelos de REPORTE (Gemini 3.7 Flash -> Gemini 3.5 Flash Lite -> Gemini 2.5 Flash Lite).
 */
export async function generateNarrativeFeedback(context: string, profileTrack?: string): Promise<AINarrativeReport> {
    const isOtel = profileTrack === 'otel_expert' || context.includes('otel_expert')
    const prompt = isOtel
        ? `Actúa como el Principal SRE & Arquitecto de Observabilidad Global y Líder Técnico del CoE de Observabilidad. 
Tu objetivo es consolidar los resultados y emitir un dictamen técnico-ejecutivo riguroso para un candidato al perfil de **SRE Experto en OpenTelemetry & Grafana Cloud**.

STACK Y ÁREAS EVALUADAS (Escala 0-100 Puntos):
- Dimensión A (Técnica / 50 pts):
  * A1: Estándar OpenTelemetry (API vs SDK, W3C Trace Context, OTel Collector pipelines, OTLP gRPC/HTTP, eBPF Profiling).
  * A2: Ecosistema Grafana Cloud (Grafana Alloy Flow mode, Mimir PromQL, Loki LogQL, Tempo TraceQL, Pyroscope Continuous Profiling).
  * A3: Arquitectura, Muestreo y Cardinalidad (Tail Sampling, reglas OTTL en transform processor, control de cardinalidad y costos).
  * A4: Diagnóstico y Causa Raíz de Incidentes (Troubleshooting conversacional con telemetría de producción).
- Dimensión B (Competencias Situacionales SRE / 30 pts):
  * B1: Redacción Formal de Ticket de Incidente SRE (impacto cuantitativo en SLO, causa raíz, mitigación y handoff).
  * B2: Gestión de Presión ante Incidentes y Colaboración Blameless (preservación de evidencia forense vs mitigación rápida, salvaguardas en CI/CD y resiliencia).
- Dimensión C (Cultura y Filosofía SRE / 20 pts):
  * C1: Cultura Blameless & Post-mortems (análisis de factores sistémicos, sin culpas individuales, aprendizaje continuo).
  * C2: Mentalidad de SLOs & Error Budgets (balance entre velocidad de release y confiabilidad, defensa del presupuesto de error).
- Dimensión IA: N/A (Este track especializado prescinde de la dimensión de IA y concentra el 100% en A, B y C).

CONTEXTO DE LA EVALUACIÓN (Scores Ponderados, Comentarios del Evaluador y Evidencias Técnicas Directas):
${context}

INSTRUCCIONES DE CALIBRACIÓN Y RIGUROSIDAD TÉCNICA:
1. Analiza el desempeño global, el puntaje obtenido y la clasificación asignada con rigor de Arquitecto/Principal SRE.
2. Genera un "Relato Final" (narrativa ejecutiva) de 2-3 párrafos profesional, honesto y transparente:
   - Si el puntaje es deficiente o mínimo (< 40 pts o clasificación "No Cumple Perfil Experto") o las respuestas son mayoritariamente erróneas/vacías, NO uses eufemismos ni endulces el diagnóstico. Explica con franqueza y respeto profesional que el aspirante no cuenta con el dominio técnico, la profundidad conceptual ni la autonomía requerida para un rol de SRE Experto.
   - Si el puntaje es sobresaliente o competente, resalta con precisión los aciertos técnicos demostrados en el stack.
3. IDENTIFICACIÓN DE FORTALEZAS (CALIBRACIÓN CRÍTICA — PROHIBIDO INVENTAR FORTALEZAS FALSAS):
   - Si el puntaje es deficiente (< 40 pts) o las respuestas técnicas del candidato fueron incorrectas, vagas o deficientes, el arreglo "fortalezas" NO DEBE inventar virtudes falsas, condescendientes ni complacientes (como "intención de aprender", "conoce conceptos básicos", etc.).
   - En caso de respuestas erróneas o puntaje mínimo, el arreglo "fortalezas" DEBE contener ÚNICAMENTE:
     ["No se evidenciaron fortalezas técnicas demostradas en este intento"]
     o ser un arreglo vacío [].
   - ÚNICAMENTE si el candidato demostró respuestas genuinamente correctas y sólidas en sus respuestas, lista hasta 3 fortalezas técnicas reales y comprobables en la evidencia.
4. BRECHAS O ÁREAS DE MEJORA:
   - Identifica una lista de "Brechas o Áreas de Mejora" (entre 2 y 4 puntos críticos) priorizadas según su impacto en producción (ej. falta de dominio en pipelines OTel, ausencia de análisis cuantitativo en SLOs, desconocimiento de muestreo o reglas OTTL, etc.).

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "final_narrative": "Texto narrativo ejecutivo...",
  "fortalezas": ["puntos fuertes reales o 'No se evidenciaron fortalezas técnicas demostradas en este intento'"],
  "brechas": ["áreas de mejora prioritarias..."]
}`
        : `Actúa como un Consultor Senior de Talento Técnico y Líder del CoE de Observabilidad / SRE. 
Tu objetivo es consolidar los resultados de una evaluación técnica y conductual para un candidato a Analista de Observabilidad Junior.

STACK Y ÁREAS EVALUADAS:
- Dimensión A (Técnica /50): Linux & AWS Cloud Core (A1), Observabilidad/SRE con Dynatrace y Grafana (A2), Git & Analítica/Automatización con Python y Pandas (A3), Troubleshooting y Causa Raíz (A4).
- Dimensión B (Blandas /30): Documentación formal de incidentes en GLPI (B1), Comunicación Verbal con Stakeholders (B2), Colaboración y Priorización de Alertas con AlertOps/Teams (B3).
- Dimensión C (Actitudinal /20): Aprendizaje Autónomo (C1), Adaptabilidad al Cambio (C2), Proyección hacia SRE (C3).
- Dimensión IA (/10): Criterio y Prompt Engineering aplicado a Observabilidad.

CONTEXTO DE LA EVALUACIÓN (Scores, Comentarios del Evaluador y Evidencias):
${context}

INSTRUCCIONES:
1. Analiza el desempeño global y la clasificación obtenida.
2. Genera un "Relato Final" (narrativa ejecutiva) de 2-3 párrafos profesional, constructivo y con tono de mentoría técnica para el candidato.
3. Identifica una lista de "Fortalezas" (mínimo 3) destacando sus mejores competencias demostradas.
4. Identifica una lista de "Brechas o Áreas de Mejora" (mínimo 2) alineadas al plan de formación del CoE.

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "final_narrative": "Texto largo aquí...",
  "fortalezas": ["puntos fuertes..."],
  "brechas": ["áreas de mejora..."]
}`

    const { generateReportFeedbackWithRetry } = await import('@/lib/ai/gemini')
    const raw = await generateReportFeedbackWithRetry(prompt)
    
    // Extractor de JSON robusto
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const cleaned = jsonMatch ? jsonMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    
    try {
        const parsed = JSON.parse(cleaned)
        log.ai.info('Feedback narrativo generado exitosamente');
        return parsed
    } catch (e) {
        log.ai.error('Error parseando Narrative Feedback', e as Error, { raw });
        return {
            final_narrative: "No se pudo generar el feedback narrativo en este momento. El formato de respuesta fue inválido.",
            fortalezas: ["Error de formato"],
            brechas: ["Error de formato"]
        }
    }
}

// NUEVO: Handler para el Chat interactivo A4 llamado desde Client Component
export async function handleCandidateChat(history: string, userInput: string): Promise<string> {
    const prompt = `Eres una simulación de consola de observabilidad y logs (Dynatrace / Grafana Loki) durante un incidente P1 en producción. 
Responde de forma técnica y concisa simulando el resultado que arrojarían las métricas, trazas o logs según lo que el usuario pida.
Intenta ser realista: si pide logs sin filtrar, dile que hay demasiada data. Si pide logs o métricas específicas, dáselos.

Historial:
${history}
USER: ${userInput}
SISTEMA SIMULADO:`
    return generateContentWithRetry(prompt)
}

export type A4EvaluationResult = {
    subcategory: string
    label: string
    score: number
    justification: string
}

/**
 * Evalúa el historial completo del chat A4 en 3 subcategorías.
 */
export async function evaluateA4Chat(history: string, caseContext: string): Promise<A4EvaluationResult[]> {
    const prompt = `Eres un evaluador senior de SRE. Evalúa el desempeño de un candidato en una investigación de incidente vía chat.

CONTEXTO DEL CASO:
${caseContext}

HISTORIAL DE INVESTIGACIÓN:
${history}

Evalúa estas 3 subcategorías (Escala 0-3):
1. A4.1 — Identificación de Fuentes: ¿El candidato pidió logs, métricas o estados de servicios correctos?
2. A4.2 — Lógica de Investigación: ¿Siguió un flujo coherente o pidió cosas al azar?
3. A4.3 — Diagnóstico: ¿Llegó a una conclusión válida sobre la causa raíz?

ESCALA:
0: No investigó o solo saludó.
1: Investigó de forma errática o no entendió los datos.
2: Investigación funcional, llegó a conclusiones básicas.
3: Investigación excelente, usó filtros técnicos y diagnóstico preciso.

Responde ÚNICAMENTE con un JSON array de 3 objetos:
[
  {"subcategory": "A4.1", "label": "Identificación de Fuentes", "score": N, "justification": "..."},
  {"subcategory": "A4.2", "label": "Lógica de Investigación", "score": N, "justification": "..."},
  {"subcategory": "A4.3", "label": "Diagnóstico y Resolución", "score": N, "justification": "..."}
]`

    const raw = await evaluateContentWithRetry(prompt)
    const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
    const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        const parsed = JSON.parse(cleaned)
        log.ai.info('Evaluación A4 Chat completada');
        return parsed
    } catch (e) {
        log.ai.error('Error parseando evaluación A4 Chat', e as Error, { raw });
        return [
            { subcategory: 'A4.1', label: 'Identificación de Fuentes', score: 0, justification: 'Error en evaluación' },
            { subcategory: 'A4.2', label: 'Lógica de Investigación', score: 0, justification: 'Error en evaluación' },
            { subcategory: 'A4.3', label: 'Diagnóstico y Resolución', score: 0, justification: 'Error en evaluación' },
        ]
    }
}

// ============================
// PREGUNTAS DINÁMICAS POR IA
// ============================

/**
 * Genera 5 preguntas (1 por cada A1.X) adaptadas al nivel de escolaridad del candidato.
 * Retorna un JSON con subcategory y question por cada una.
 */
export type A1Question = { subcategory: string; label: string; question: string }

export async function generateQuestionsA1(educationLevel: string, profileTrack?: string): Promise<A1Question[]> {
    const seed = Math.floor(Math.random() * 10000)

    if (profileTrack === 'otel_expert') {
        const prompt = `Eres un evaluador técnico senior de SRE y Observabilidad.
Genera exactamente 4 preguntas en español de RESPUESTA ABIERTA Y SINTETIZADA para el perfil "SRE Experto en OpenTelemetry & Grafana Cloud".

Subcategorías:
1. A1.1 — Arquitectura OTel: Concepto de API vs SDK (cuándo usar cada uno) y propagación de contexto en microservicios.
2. A1.2 — OTel Collector: Qué componente de pipeline (Receiver, Processor, Exporter) usarías para filtrar logs y reducir cardinalidad.
3. A1.3 — Protocolo OTLP: Ventajas conceptuales de OTLP/gRPC frente a HTTP/JSON y manejo de reintentos.
4. A1.4 — Profiling eBPF: Ventajas de la instrumentación sin código (eBPF) frente a la tradicional en observabilidad.

REGLAS CRÍTICAS:
- TODAS las preguntas DEBEN SER DE RESPUESTA ABIERTA. NINGUNA opción múltiple.
- Las preguntas deben ser conceptuales y de análisis rápido. NO pidas diseñar archivos de configuración completos ni bloques de código YAML extensos. El candidato debe poder responderlas en 2-3 minutos con 2-4 oraciones.
- Responde ÚNICAMENTE con un JSON array de 4 objetos.

Formato exacto:
[
  {"subcategory": "A1.1", "label": "Arquitectura OTel & Contexto", "question": "..."},
  {"subcategory": "A1.2", "label": "Collector & OTTL Pipelines", "question": "..."},
  {"subcategory": "A1.3", "label": "Protocolo OTLP & Transportes", "question": "..."},
  {"subcategory": "A1.4", "label": "Profiling & eBPF Telemetry", "question": "..."}
]`

        const raw = await generateContentWithRetry(prompt)
        const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
        const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
        try {
            const parsed = JSON.parse(cleaned)
            log.ai.info('Preguntas A1 (OTel Expert) generadas exitosamente');
            return parsed
        } catch (e) {
            log.ai.error('Error parseando preguntas A1 OTel Expert', e as Error, { raw });
            return [
                { subcategory: 'A1.1', label: 'Arquitectura OTel & Contexto', question: '¿Cuál es la diferencia conceptual entre la API y el SDK de OpenTelemetry y cuándo interactúa tu aplicación con cada uno?' },
                { subcategory: 'A1.2', label: 'Collector & OTTL Pipelines', question: '¿Cómo configurarías conceptualmente un pipeline en el OTel Collector para procesar únicamente logs que contengan la palabra "error"?' },
                { subcategory: 'A1.3', label: 'Protocolo OTLP & Transportes', question: '¿Qué ventajas tiene gRPC sobre HTTP/JSON al enviar datos de telemetría a través del protocolo OTLP?' },
                { subcategory: 'A1.4', label: 'Profiling & eBPF Telemetry', question: '¿Cómo ayuda eBPF a recolectar métricas de CPU y memoria sin alterar el código de una aplicación?' }
            ]
        }
    }

    const isTecnico = educationLevel === 'tecnico_sena' || educationLevel === 'bachiller'

    const questionStyle = isTecnico
        ? 'Pregunta exploratoria: "¿Conoce el concepto de X? Si es así, ¿podría explicarlo en sus palabras?"'
        : 'Pregunta de explicación directa: "Explique en sus palabras X y cómo se aplica"'

    const prompt = `Eres un evaluador técnico de infraestructura y sistemas para Analistas de Observabilidad Junior.
Genera exactamente 5 preguntas en español, una por cada subcategoría de A1 (Linux y Cloud Computing AWS), adaptadas al nivel educativo "${educationLevel}".

Estilo de preguntas a usar: ${questionStyle}

Subcategorías:
1. A1.1 — Linux Filesystem & Permisos: navegar directorios, permisos chmod/chown, gestión de archivos
2. A1.2 — Linux Procesos & Servicios: listar y detener procesos (ps, top, kill), gestión de servicios (systemctl status/restart)
3. A1.3 — Linux Logs & Troubleshooting: inspección de logs del sistema (/var/log, journalctl, tail -f, grep)
4. A1.4 — Fundamentos Cloud Computing: modelos IaaS / PaaS / SaaS, alta disponibilidad y escalabilidad en nube
5. A1.5 — AWS Core Services & Seguridad: servicios core (EC2, S3, CloudWatch), Modelo de Responsabilidad Compartida

Contexto: El candidato viene de un rol de soporte (NOC/Soporte Nivel 1). NO es un examen de ingeniería.
Se evalúa comprensión conceptual y capacidad de explicar procedimientos operativos en Linux y conceptos esenciales de Cloud AWS.

Reglas:
- NO incluyas preguntas sobre Windows Server, redes OSI/TCP ni Docker/contenedores.
- Cada pregunta debe poder responderse en 2-4 oraciones.
- Cada pregunta debe plantear una situación o problema práctico del mundo real (ej: "Tienes que buscar un log de error en /var/log...", "Un servicio se detuvo en Linux y debes reiniciarlo...", "Un cliente pregunta qué servicio de AWS usar para almacenar archivos estáticos...").
- Usa variación (seed: ${seed}) para generar preguntas diferentes cada vez.
- Responde ÚNICAMENTE con un JSON array de 5 objetos.

Formato exacto:
[
  {"subcategory": "A1.1", "label": "Linux Filesystem", "question": "..."},
  {"subcategory": "A1.2", "label": "Linux Procesos", "question": "..."},
  {"subcategory": "A1.3", "label": "Linux Logs", "question": "..."},
  {"subcategory": "A1.4", "label": "Cloud Computing", "question": "..."},
  {"subcategory": "A1.5", "label": "AWS Core Services", "question": "..."}
]`

    const raw = await generateContentWithRetry(prompt)
    const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
    const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        const parsed = JSON.parse(cleaned)
        log.ai.info('Preguntas A1 generadas exitosamente');
        return parsed
    } catch (e) {
        log.ai.error('Error parseando preguntas A1', e as Error, { raw });
        return [
            { subcategory: 'A1.1', label: 'Linux Filesystem', question: '¿Cómo buscarías un archivo en el sistema de archivos de Linux y cómo verificarías sus permisos de lectura y ejecución?' },
            { subcategory: 'A1.2', label: 'Linux Procesos', question: 'Si un proceso consume demasiado CPU en un servidor Linux, ¿qué comandos usarías para identificarlo y detenerlo de forma segura?' },
            { subcategory: 'A1.3', label: 'Linux Logs', question: '¿En qué directorio de Linux se almacenan habitualmente los logs del sistema y qué comando usarías para ver los logs en tiempo real?' },
            { subcategory: 'A1.4', label: 'Cloud Computing', question: '¿Cuál es la principal diferencia entre IaaS y PaaS en entornos de nube? Explica con un ejemplo.' },
            { subcategory: 'A1.5', label: 'AWS Core Services', question: '¿Qué función cumplen servicios como Amazon EC2, Amazon S3 y CloudWatch en una arquitectura básica de AWS?' },
        ]
    }
}

/**
 * Evalúa las respuestas de A1 usando la escala 0-3 e incluye detección de probabilidad IA.
 */
export type A1EvaluationResult = {
    subcategory: string
    label: string
    score: number      // 0-3
    justification: string
    aiLikelihoodScore?: number // 0-100%
    aiLikelihoodRisk?: 'LOW' | 'MEDIUM' | 'HIGH'
    aiLikelihoodIndicators?: string[]
}

export async function evaluateAnswersA1(
    questionsAndAnswers: { subcategory: string; label: string; question: string; answer: string }[],
    profileTrack?: string
): Promise<A1EvaluationResult[]> {
    const qaBlock = questionsAndAnswers.map(qa =>
        `Subcategoría: ${qa.subcategory} (${qa.label})\nPregunta: ${qa.question}\nRespuesta del candidato: ${qa.answer}`
    ).join('\n\n---\n\n')

    const prompt = profileTrack === 'otel_expert'
        ? `Eres un evaluador técnico senior de SRE y OpenTelemetry. Evalúa las siguientes respuestas de un candidato para el rol de SRE Experto en OpenTelemetry & Grafana Cloud (Arquitectura OTel, Collector Pipelines, Protocolo OTLP y Profiling eBPF).

ESCALA DE VALORACIÓN (aplica estrictamente):
- 0 (Sin conocimiento): Respuesta errónea, vacía o irrelevante.
- 1 (Básico): Conocimiento vago de OTel o definiciones genéricas sin profundidad.
- 2 (Funcional): Comprensión técnica sólida de API vs SDK, pipelines del collector, OTLP o eBPF.
- 3 (Autónomo / Experto): Explicación impecable, profundidad arquitectónica y justificación técnica clara.

RESPUESTAS A EVALUAR:

${qaBlock}

Responde ÚNICAMENTE con un JSON array de objetos con subcategory, label, score (0-3) y justification:
[
  {"subcategory": "A1.1", "label": "Arquitectura OTel & Contexto", "score": 2, "justification": "..."},
  {"subcategory": "A1.2", "label": "Collector & OTTL Pipelines", "score": 2, "justification": "..."},
  {"subcategory": "A1.3", "label": "Protocolo OTLP & Transportes", "score": 2, "justification": "..."},
  {"subcategory": "A1.4", "label": "Profiling & eBPF Telemetry", "score": 2, "justification": "..."}
]`
        : `Eres un evaluador técnico senior de infraestructura y cloud TI. Evalúa las siguientes respuestas de un candidato para el rol de Analista de Observabilidad Junior (Linux & AWS Cloud).

ESCALA DE VALORACIÓN (aplica estrictamente):
- 0 (Sin conocimiento): No conoce el concepto ni ha tenido contacto. Respuesta vacía, irrelevante o incorrecta.
- 1 (Básico): Ha escuchado el concepto, puede describirlo vagamente pero no lo ha aplicado. Respuesta parcial.
- 2 (Funcional): Lo ha aplicado en contexto real con supervisión. Respuesta correcta con comprensión técnica/básica.
- 3 (Autónomo): Lo aplica sin supervisión y puede explicarlo a otros. Respuesta completa y articulada.

IMPORTANTE: NO es un examen de ingeniería senior. Es una evaluación de comprensión conceptual y operativa para soporte NOC/Observabilidad.
Sé justo y proporcional. Un candidato que explica correctamente un concepto básico merece al menos un 2.

RESPUESTAS A EVALUAR:

${qaBlock}

Responde ÚNICAMENTE con un JSON array de objetos con subcategory, label, score (0-3) y justification:
[
  {"subcategory": "A1.1", "label": "Linux Filesystem", "score": 2, "justification": "..."},
  ...
]`

    const raw = await evaluateContentWithRetry(prompt)
    const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
    const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    let parsed: any[] = []
    try {
        parsed = JSON.parse(cleaned)
        log.ai.info('Evaluación A1 completada');
    } catch (e) {
        log.ai.error('Error parseando evaluación A1', e as Error, { raw });
        parsed = questionsAndAnswers.map(qa => ({
            subcategory: qa.subcategory,
            label: qa.label,
            score: 0,
            justification: 'Error al procesar la evaluación. Intente nuevamente.',
        }))
    }

    // Attach AI Likelihood Detection to each answer
    const results: A1EvaluationResult[] = await Promise.all(parsed.map(async (item: any) => {
        const matchingQA = questionsAndAnswers.find(qa => qa.subcategory === item.subcategory)
        let aiDetection = { likelihoodPercentage: 0, riskLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH', indicators: [] as string[] }
        if (matchingQA && matchingQA.answer) {
            try {
                const det = await analyzeAiLikelihood(matchingQA.answer, matchingQA.question)
                aiDetection = {
                    likelihoodPercentage: det.likelihoodPercentage,
                    riskLevel: det.riskLevel,
                    indicators: det.indicators
                }
            } catch (err) {
                console.error('Error calculating AI likelihood for A1:', err)
            }
        }
        return {
            subcategory: item.subcategory,
            label: item.label || item.subcategory,
            score: typeof item.score === 'number' ? item.score : 0,
            justification: item.justification || '',
            aiLikelihoodScore: aiDetection.likelihoodPercentage,
            aiLikelihoodRisk: aiDetection.riskLevel,
            aiLikelihoodIndicators: aiDetection.indicators
        }
    }))

    return results
}

/**
 * Genera 5 preguntas A2 (1 por subcategoría) adaptadas a Observabilidad, SRE, Dynatrace y Grafana.
 */
export type A2Question = { subcategory: string; label: string; question: string }

export async function generateQuestionsA2(tool: string, educationLevel: string, profileTrack?: string): Promise<A2Question[]> {
    const seed = Math.floor(Math.random() * 10000)

    if (profileTrack === 'otel_expert') {
        const prompt = `Eres un evaluador técnico senior de SRE y Observabilidad.
Genera exactamente 3 preguntas en español de RESPUESTA ABIERTA Y SINTETIZADA para el perfil "SRE Experto en OpenTelemetry & Grafana Cloud".

Subcategorías:
1. A2.1 — Grafana Alloy: Concepto de Alloy en modo Flow (por qué componentes declarativos) y despliegue básico.
2. A2.2 — Grafana Mimir & Loki: Cuándo calcular la tasa de error por segundo en PromQL y la diferencia conceptual entre LogQL y SQL para consultar logs.
3. A2.3 — Grafana Tempo & Pyroscope: Concepto de Span Metrics (trazas a métricas) y cómo ayuda el profiling contínuo a reducir costes cloud.

REGLAS CRÍTICAS:
- TODAS las preguntas DEBEN SER DE RESPUESTA ABIERTA. NINGUNA opción múltiple.
- Las preguntas deben ser conceptuales y de análisis rápido. NO pidas diseñar archivos de configuración completos ni bloques de código YAML extensos. El candidato debe poder responderlas en 2-3 minutos con 2-4 oraciones.
- Responde ÚNICAMENTE con un JSON array de 3 objetos.

Formato exacto:
[
  {"subcategory": "A2.1", "label": "Grafana Alloy Flow Mode", "question": "..."},
  {"subcategory": "A2.2", "label": "Mimir & Loki (PromQL/LogQL)", "question": "..."},
  {"subcategory": "A2.3", "label": "Tempo & Pyroscope (TraceQL/Profiling)", "question": "..."}
]`

        const raw = await generateContentWithRetry(prompt)
        const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
        const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
        try {
            const parsed = JSON.parse(cleaned)
            log.ai.info('Preguntas A2 (OTel Expert) generadas exitosamente');
            return parsed
        } catch (e) {
            log.ai.error('Error parseando preguntas A2 OTel Expert', e as Error, { raw });
            return [
                { subcategory: 'A2.1', label: 'Grafana Alloy Flow Mode', question: '¿Cuál es la ventaja principal del modo de configuración Flow en Grafana Alloy frente a las configuraciones estáticas tradicionales?' },
                { subcategory: 'A2.2', label: 'Mimir & Loki (PromQL/LogQL)', question: 'Explica conceptualmente cómo calcularías la tasa de peticiones por segundo utilizando una métrica de contador en PromQL.' },
                { subcategory: 'A2.3', label: 'Tempo & Pyroscope (TraceQL/Profiling)', question: '¿Cómo se utiliza un Flamegraph en Pyroscope para identificar qué función está consumiendo la mayor cantidad de CPU?' }
            ]
        }
    }

    const prompt = `Eres un evaluador técnico de observabilidad para Analistas Junior (entry-level).
Genera exactamente 5 preguntas en español, una por cada subcategoría de A2, alineadas a Observabilidad, SRE (SLI/SLO), Dynatrace APM y Grafana Dashboards.

Subcategorías:
1. A2.1 — Pilares de Observabilidad: Métricas, Logs y Trazas; monitoreo reactivo vs observabilidad proactiva.
2. A2.2 — SRE Fundamentals: Conceptos y diferencias entre SLI, SLO, SLA y qué representa un Error Budget.
3. A2.3 — Dynatrace APM & IA: Monitoreo de rendimiento de aplicaciones (APM), transacciones de servicios y detección de anomalías con IA.
4. A2.4 — Grafana Dashboards & Visualización: Interpretación de paneles, filtros temporales, dashboards unificados y fuentes de datos.
5. A2.5 — Interpretación de Alertas: Genera una ALERTA SIMULADA realista de Dynatrace o Grafana (ej: "ALERTA: HTTP 500 error rate > 5% en servicio auth-service y latencia P95 > 3.2s") y pide al candidato que la interprete y proponga primeros pasos de diagnóstico.

Reglas:
- NO incluyas preguntas de Elasticsearch ni Kibana.
- Nivel entry-level / junior (${educationLevel}).
- Cada pregunta debe ser práctica y contextualizada.
- Responde ÚNICAMENTE con un JSON array de 5 objetos:
[
  {"subcategory": "A2.1", "label": "Pilares Observabilidad", "question": "..."},
  {"subcategory": "A2.2", "label": "SRE (SLI/SLO)", "question": "..."},
  {"subcategory": "A2.3", "label": "Dynatrace APM", "question": "..."},
  {"subcategory": "A2.4", "label": "Grafana Dashboards", "question": "..."},
  {"subcategory": "A2.5", "label": "Interpretación de Alertas", "question": "ALERTA: ... ¿Qué indica esta alerta y cuáles serían tus primeros pasos?"}
]`

    const raw = await generateContentWithRetry(prompt)
    const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
    const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        const parsed = JSON.parse(cleaned)
        log.ai.info('Preguntas A2 generadas exitosamente');
        return parsed
    } catch (e) {
        log.ai.error('Error parseando preguntas A2', e as Error, { raw });
        return [
            { subcategory: 'A2.1', label: 'Pilares Observabilidad', question: '¿Cuáles son los tres pilares de la observabilidad (métricas, logs, trazas) y en qué se diferencia el monitoreo reactivo de la observabilidad proactiva?' },
            { subcategory: 'A2.2', label: 'SRE (SLI/SLO)', question: 'En SRE, ¿cuál es la diferencia entre un SLI (Indicador de Nivel de Servicio) y un SLO (Objetivo de Nivel de Servicio)? ¿Qué es un Error Budget?' },
            { subcategory: 'A2.3', label: 'Dynatrace APM', question: '¿Cómo ayuda una herramienta de APM como Dynatrace a identificar rápidamente qué servicio o base de datos está causando lentitud en una aplicación?' },
            { subcategory: 'A2.4', label: 'Grafana Dashboards', question: '¿Cómo utilizarías los filtros y variables de un dashboard en Grafana para analizar la tasa de errores y latencia de un microservicio específico?' },
            { subcategory: 'A2.5', label: 'Interpretación de Alertas', question: 'ALERTA: Error rate > 8% y latencia P95 > 4.5s en servicio checkout-service durante los últimos 10 minutos. ¿Qué indica esta alerta y qué pasos iniciales tomarías para aislar el fallo?' },
        ]
    }
}

/**
 * Evalúa las respuestas de A2 usando la escala 0-3 e incluye probabilidad IA.
 */
export type A2EvaluationResult = {
    subcategory: string
    label: string
    score: number      // 0-3
    justification: string
    aiLikelihoodScore?: number
    aiLikelihoodRisk?: 'LOW' | 'MEDIUM' | 'HIGH'
    aiLikelihoodIndicators?: string[]
}

export async function evaluateAnswersA2(
    questionsAndAnswers: { subcategory: string; label: string; question: string; answer: string }[],
    profileTrack?: string
): Promise<A2EvaluationResult[]> {
    const qaBlock = questionsAndAnswers.map(qa =>
        `Subcategoría: ${qa.subcategory} (${qa.label})\nPregunta: ${qa.question}\nRespuesta del candidato: ${qa.answer}`
    ).join('\n\n---\n\n')

    const prompt = profileTrack === 'otel_expert'
        ? `Eres un evaluador técnico senior de SRE y Observabilidad. Evalúa las siguientes respuestas de un candidato para el rol de SRE Experto en OpenTelemetry & Grafana Cloud (Grafana Alloy Flow Mode, Mimir & Loki PromQL/LogQL, Tempo & Pyroscope TraceQL/Profiling).

ESCALA DE VALORACIÓN (aplica estrictamente):
- 0 (Sin conocimiento): Respuesta errónea, vacía o irrelevante.
- 1 (Básico): Conocimiento superficial sin formular queries ni explicar componentes.
- 2 (Funcional): Comprensión técnica adecuada de Alloy Flow, sintaxis de PromQL/LogQL o TraceQL/Profiling.
- 3 (Autónomo / Experto): Excelente articulación técnica, formulación precisa de métricas/consultas y análisis de rendimiento.

RESPUESTAS A EVALUAR:

${qaBlock}

Responde ÚNICAMENTE con un JSON array de objetos con subcategory, label, score (0-3) y justification:
[
  {"subcategory": "A2.1", "label": "Grafana Alloy Flow Mode", "score": 2, "justification": "..."},
  {"subcategory": "A2.2", "label": "Mimir & Loki (PromQL/LogQL)", "score": 2, "justification": "..."},
  {"subcategory": "A2.3", "label": "Tempo & Pyroscope (TraceQL/Profiling)", "score": 2, "justification": "..."}
]`
        : `Eres un evaluador técnico senior de observabilidad y SRE. Evalúa las siguientes respuestas de un candidato para el rol de Analista de Observabilidad Junior (Observabilidad, SRE, Dynatrace, Grafana).

ESCALA DE VALORACIÓN (aplica estrictamente):
- 0 (Sin conocimiento): Respuesta vacía, irrelevante o incorrecta.
- 1 (Básico): Conocimiento conceptual parcial sin aplicación profunda.
- 2 (Funcional): Comprensión técnica adecuada y aplicación correcta.
- 3 (Autónomo / Experto): Excelente articulación técnica, profundidad y justificación.

RESPUESTAS A EVALUAR:

${qaBlock}

Responde ÚNICAMENTE con un JSON array de objetos con subcategory, label, score (0-3) y justification:
[
  {"subcategory": "A2.1", "label": "Pilares Observabilidad", "score": 2, "justification": "..."},
  ...
]`

    const raw = await evaluateContentWithRetry(prompt)
    const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
    const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    let parsed: any[] = []
    try {
        parsed = JSON.parse(cleaned)
    } catch {
        parsed = questionsAndAnswers.map(qa => ({
            subcategory: qa.subcategory,
            label: qa.label,
            score: 0,
            justification: 'Error al procesar la evaluación. Intente nuevamente.',
        }))
    }

    const results: A2EvaluationResult[] = await Promise.all(parsed.map(async (item: any) => {
        const matchingQA = questionsAndAnswers.find(qa => qa.subcategory === item.subcategory)
        let aiDetection = { likelihoodPercentage: 0, riskLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH', indicators: [] as string[] }
        if (matchingQA && matchingQA.answer) {
            try {
                const det = await analyzeAiLikelihood(matchingQA.answer, matchingQA.question)
                aiDetection = {
                    likelihoodPercentage: det.likelihoodPercentage,
                    riskLevel: det.riskLevel,
                    indicators: det.indicators
                }
            } catch (err) {
                console.error('Error calculating AI likelihood for A2:', err)
            }
        }
        return {
            subcategory: item.subcategory,
            label: item.label || item.subcategory,
            score: typeof item.score === 'number' ? item.score : 0,
            justification: item.justification || '',
            aiLikelihoodScore: aiDetection.likelihoodPercentage,
            aiLikelihoodRisk: aiDetection.riskLevel,
            aiLikelihoodIndicators: aiDetection.indicators
        }
    }))

    return results
}

/**
 * Genera 3 preguntas A3 (Git & Análisis/Automatización con Python & Pandas).
 * Para A3.2 y A3.3, incluye fragmentos de código Python en el enunciado para evaluar
 * la capacidad del analista de interpretar qué hace el código, sus parámetros de entrada y sus salidas esperadas.
 */
export type A3Question = { subcategory: string; label: string; question: string }

export async function generateQuestionsA3(educationLevel: string, profileTrack?: string): Promise<A3Question[]> {
    const seed = Math.floor(Math.random() * 10000)
    const isEntry = educationLevel === 'tecnico_sena' || educationLevel === 'bachiller'

    if (profileTrack === 'otel_expert') {
        const prompt = `Eres un evaluador técnico para ingenieros SRE Expertos en OpenTelemetry.
El candidato está viendo en pantalla un archivo YAML de OTel Collector (otel-collector-config.yaml) que incluye:
- Receivers: OTLP (gRPC: 4317, HTTP: 4318)
- Processors: batch, transform (reglas OTTL: set service.env, replace_pattern http.target, keep_keys), tail_sampling (filter_errors, filter_latency > 2000ms, probabilistic_sample 10%)
- Exporters: OTLP (Tempo Grafana)

Genera exactamente 2 preguntas CORTAS, CONCISAS Y DIRECTAS en español:

1. A3.1 — Análisis de Pipeline & Muestreo: Pide analizar la sección 'tail_sampling' del YAML en pantalla. ¿Qué trazas serán capturadas por las políticas de error y latencia, y cuál es el impacto de conservar un 10% probabilístico del resto?
2. A3.2 — Reglas OTTL & Procesamiento: Pide analizar las sentencias OTTL del procesador 'transform' en el YAML. ¿Qué modificaciones realizan sobre los atributos 'service.env' y 'http.target', y qué beneficio aportan?

REGLAS CRÍTICAS DE CONCISIÓN:
- Cada pregunta debe tener MÁXIMO 35 a 45 palabras.
- NUNCA inventes escenarios narrativos largos ni párrafos extensos. El candidato ya tiene el archivo YAML visible en pantalla.
- Haz preguntas puntuales de análisis y diagnóstico técnico que se puedan responder rápidamente.
- Responde ÚNICAMENTE con un JSON array de 2 objetos:
[
  {"subcategory": "A3.1", "label": "Análisis de Pipeline & Muestreo", "question": "..."},
  {"subcategory": "A3.2", "label": "Reglas OTTL & Procesamiento", "question": "..."}
]`
        const raw = await generateContentWithRetry(prompt)
        const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
        const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
        try {
            const parsed = JSON.parse(cleaned)
            log.ai.info('Preguntas A3 (OTel Expert) generadas exitosamente');
            return parsed
        } catch (e) {
            log.ai.error('Error parseando preguntas A3 (OTel Expert)', e as Error, { raw });
            return [
                { subcategory: 'A3.1', label: 'Análisis de Pipeline & Muestreo', question: 'Analiza la sección tail_sampling en el YAML mostrado arriba. ¿Qué trazas serán capturadas por las políticas filter_errors y filter_latency, y cuál es el objetivo de mantener un 10% probabilístico del resto?' },
                { subcategory: 'A3.2', label: 'Reglas OTTL & Procesamiento', question: 'Revisa las reglas OTTL en el procesador transform del YAML. ¿Qué cambios realizan sobre los atributos service.env y http.target, y qué beneficio aporta la sentencia keep_keys?' }
            ]
        }
    }

    const prompt = `Eres un líder técnico y evaluador de talento para Analistas de Observabilidad Junior (entry-level).
Genera exactamente 3 preguntas prácticas en español para la subsección A3 (Control de Versiones Git, Analítica con Pandas y Automatización con Python).
Nivel educativo del candidato: "${educationLevel}" (${isEntry ? 'Formación Técnica / Bachiller: lenguaje muy accesible, directo y práctico' : 'Tecnólogo / Profesional: razonamiento analítico y operativo'}).

Instrucciones por Subcategoría:

1. A3.1 — Git: Flujo y Ramas:
   - Plantea una situación de colaboración cotidiana en observabilidad (ej: clonar repositorio, crear una rama de trabajo 'feature/alertas', hacer commit con mensaje claro y subir cambios al remoto con 'git push').
   - Pide al candidato explicar el flujo o secuencia de comandos básicos para cumplir la tarea.

2. A3.2 — Analítica de Datos con Pandas (Interpretación de Código):
   - INCLUYE obligatoriamente en el texto de la pregunta un fragmento corto y claro de código en Python usando Pandas (4 a 6 líneas) que lea un CSV de logs/métricas y filtre o calcule algo (ej. filtrar filas con latency_ms > 1000 o status_code == 500, o calcular promedio de latencia).
   - Pide al analista que interprete y responda:
     a) ¿Qué hace el script y cuál es su objetivo?
     b) ¿Qué datos o columnas de entrada analiza?
     c) Ante un caso hipotético con datos de prueba, ¿qué resultado o salida entregará?

3. A3.3 — Automatización Simple en Python (Interpretación de Código):
   - INCLUYE obligatoriamente en el texto de la pregunta un script o función corta en Python (5 a 8 líneas) de automatización de observabilidad (ej: una función que evalúa el uso de CPU/memoria o tasa de errores y asigna un estado 'OK', 'WARNING' o 'CRITICAL' y una acción de alerta).
   - Pide al analista que interprete y responda:
     a) ¿Cuál es el objetivo y flujo lógico de esta función de automatización?
     b) ¿Qué parámetros de entrada recibe y qué condición dispara la alerta?
     c) Si se ejecuta con valores de prueba específicos (ej: cpu=92, memoria=65), ¿cuál será el resultado que retornará?

Reglas:
- NO pidas que el candidato escriba código complejo desde cero. Debe interpretar, entender entradas, lógica y salidas.
- NO incluyas preguntas de tickets ni GLPI (se evalúan en B1).
- Usa variación (seed: ${seed}).
- Responde ÚNICAMENTE con un JSON array de 3 objetos:
[
  {"subcategory": "A3.1", "label": "Git: Ramas y Flujo", "question": "..."},
  {"subcategory": "A3.2", "label": "Pandas: Análisis de Datos", "question": "Analiza el siguiente script en Python con Pandas:\n\n[fragmento de código Python]\n\nResponde:\n1) ...\n2) ...\n3) ..."},
  {"subcategory": "A3.3", "label": "Python: Automatización", "question": "Analiza la siguiente función de automatización en Python:\n\n[función de código Python]\n\nResponde:\n1) ...\n2) ...\n3) ..."}
]`

    const raw = await generateContentWithRetry(prompt)
    const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
    const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        const parsed = JSON.parse(cleaned)
        log.ai.info('Preguntas A3 generadas exitosamente con interpretación de código');
        return parsed
    } catch (e) {
        log.ai.error('Error parseando preguntas A3', e as Error, { raw });
        return [
            {
                subcategory: 'A3.1',
                label: 'Git: Ramas y Flujo',
                question: 'En un equipo de observabilidad, estás trabajando en la mejora de un script de monitoreo. ¿Cuál es el flujo básico de comandos en Git que debes ejecutar para: 1) Crear y cambiarte a una nueva rama de trabajo ("feature/alertas"), 2) Guardar tus modificaciones con un mensaje de commit descriptivo, y 3) Subir tu rama al repositorio remoto para revisión?'
            },
            {
                subcategory: 'A3.2',
                label: 'Pandas: Análisis de Datos',
                question: 'Analiza el siguiente script en Python con Pandas:\n\n```python\nimport pandas as pd\n\n# Carga de métricas de servicios\ndf = pd.read_csv("api_metrics.csv")\n\n# Filtrado de transacciones críticas\nalertas = df[(df["latency_ms"] > 1500) | (df["status_code"] == 500)]\nprint(f"Total eventos críticos: {len(alertas)}")\nprint(alertas[["service_name", "endpoint", "latency_ms"]])\n```\n\nResponde:\n1) ¿Qué hace este script y cuál es su objetivo en observabilidad?\n2) ¿Qué columnas y condiciones de entrada evalúa del archivo "api_metrics.csv"?\n3) Si el archivo contiene 100 registros en total, donde 3 tienen latencia de 2000 ms (status 200) y 2 tienen status 500 (latencia 300 ms), ¿cuántos eventos críticos reportará el script?'
            },
            {
                subcategory: 'A3.3',
                label: 'Python: Automatización',
                question: 'Analiza la siguiente función de automatización en Python:\n\n```python\ndef evaluar_salud_nodo(host, cpu_usage, memory_usage):\n    if cpu_usage > 90 or memory_usage > 85:\n        estado = "CRITICAL"\n        accion = "Disparar alerta prioritaria a Guardia NOC"\n    elif cpu_usage > 75 or memory_usage > 70:\n        estado = "WARNING"\n        accion = "Registrar advertencia en log de monitoreo"\n    else:\n        estado = "HEALTHY"\n        accion = "Operación normal"\n    \n    return {"host": host, "estado": estado, "accion": accion}\n```\n\nResponde:\n1) ¿Cuál es el objetivo de esta función de automatización?\n2) ¿Qué parámetros de entrada recibe y qué condición exacta activa el estado "CRITICAL"?\n3) Si ejecutamos evaluar_salud_nodo("srv-db-01", cpu_usage=93, memory_usage=55), ¿cuál será el resultado que retornará la función?'
            },
        ]
    }
}

/**
 * Evalúa las 3 respuestas de A3 usando la escala 0-3.
 * Valora la comprensión lógica, identificación de entradas y deducción de salidas.
 */
export type A3EvaluationResult = {
    subcategory: string
    label: string
    score: number      // 0-3
    justification: string
}

export async function evaluateAnswersA3(
    questionsAndAnswers: { subcategory: string; label: string; question: string; answer: string }[],
    profileTrack?: string
): Promise<A3EvaluationResult[]> {
    const qaBlock = questionsAndAnswers.map(qa =>
        `Subcategoría: ${qa.subcategory} (${qa.label})\nPregunta y Código: ${qa.question}\nRespuesta del candidato: ${qa.answer}`
    ).join('\n\n---\n\n')

    if (profileTrack === 'otel_expert') {
        const prompt = `Eres un evaluador técnico senior experto en OpenTelemetry. Evalúa las respuestas del candidato especialista a las preguntas de configuración, OTTL y pipelines de A3.

QA A EVALUAR:
${qaBlock}

ESCALA DE VALORACIÓN:
- 0 (Sin conocimiento): Respuesta errónea, vacía o copia literal.
- 1 (Básico): Entiende la sintaxis básica pero no comprende la lógica del pipeline, el muestreo (sampling) ni las reglas OTTL.
- 2 (Funcional): Demuestra un entendimiento correcto de la lógica de tail_sampling y de las sentencias OTTL del transform.
- 3 (Autónomo/Experto): Aporta un análisis profundo sobre la latencia, reintentos, control de cardinalidad y optimizaciones.

Responde ÚNICAMENTE con un JSON array de objetos matching the length of the input array (exactamente 2):
[
  {"subcategory": "A3.1", "label": "Análisis de Pipeline & Muestreo", "score": 2, "justification": "..."},
  {"subcategory": "A3.2", "label": "Reglas OTTL & Procesamiento", "score": 2, "justification": "..."}
]`

        const raw = await evaluateContentWithRetry(prompt)
        const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
        const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
        try {
            return JSON.parse(cleaned)
        } catch {
            return questionsAndAnswers.map(qa => ({
                subcategory: qa.subcategory,
                label: qa.label,
                score: 0,
                justification: 'Error al procesar la evaluación de A3 (OTel Expert).',
            }))
        }
    }

    const prompt = `Eres un evaluador técnico senior y mentor de observabilidad. Evalúa las respuestas de un candidato para el rol de Analista de Observabilidad Junior sobre Git, Analítica con Pandas y Automatización con Python.

Criterios de Evaluación:
- A3.1 (Git): Comprensión del ciclo básico (ramas, commit, push) y trabajo en equipo.
- A3.2 (Pandas - Interpretación de Código): Capacidad de entender qué hace el script, qué columnas/filtros usa y deducir correctamente la salida ante el caso de prueba.
- A3.3 (Python Automatización - Interpretación de Código): Comprensión del flujo condicional (if/else), parámetros de entrada y deducción del resultado devuelto.

ESCALA DE VALORACIÓN (0-3):
- 0 (Sin conocimiento): Respuesta vacía, incoherente o completamente errónea.
- 1 (Básico): Identifica partes del código pero no explica el flujo completo o se equivoca en la salida esperada.
- 2 (Funcional): Explica correctamente la lógica general, entiende las entradas y deduce la salida con sentido común (incluso sin lenguaje formal).
- 3 (Autónomo): Explicación impecable, clara y bien estructurada del objetivo, parámetros y salida exacta.

IMPORTANTE: Sé empático y formativo. Se evalúa capacidad de razonamiento lógico y lectura de código, no memoria de sintaxis.

QA A EVALUAR:
${qaBlock}

Responde ÚNICAMENTE con un JSON array de objetos con subcategory, label, score (0-3) y justification:
[
  {"subcategory": "A3.1", "label": "Git: Ramas y Flujo", "score": 2, "justification": "..."},
  {"subcategory": "A3.2", "label": "Pandas: Análisis de Datos", "score": 2, "justification": "..."},
  {"subcategory": "A3.3", "label": "Python: Automatización", "score": 2, "justification": "..."}
]`

    const raw = await evaluateContentWithRetry(prompt)
    const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
    const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        return JSON.parse(cleaned)
    } catch {
        return questionsAndAnswers.map(qa => ({
            subcategory: qa.subcategory,
            label: qa.label,
            score: 0,
            justification: 'Error al procesar la evaluación. Intente nuevamente.',
        }))
    }
}

// ============================
// MÓDULO B1 MEJORADO
// ============================

/**
 * Genera un caso de incidente único en español para el módulo B1.
 * Escenario conciso (2 párrafos, ~120-150 palabras) alineado con las herramientas del equipo:
 * Monitoreo: Dynatrace / Grafana, Alertas/Guardias: AlertOps, Coordinación: Microsoft Teams, Registro: GLPI.
 */
export async function generateIncidentCaseB1(profileTrack?: string): Promise<string> {
    const seed = Math.floor(Math.random() * 10000)
    const prompt = `Eres un generador de escenarios de incidentes de producción para evaluaciones de soporte NOC/SRE.

Genera UN escenario de incidente conciso, claro y realista en español de EXACTAMENTE 2 párrafos cortos (máximo 150 palabras en total).
El candidato usará este escenario para documentar un ticket formal de incidente en el sistema GLPI.

Estructura y Requisitos Obligatorios:
1. Párrafo 1 — Detección y Métricas:
   - Hora exacta en formato UTC.
   - Nombre del servidor (formato srv-prod-XXX-01) y nombre del microservicio afectado.
   - Asunto de la alerta crítica recibida en AlertOps (ej: "[CRITICAL] [ALERTOPS] High HTTP 500 Rate on order-service").
   - Métricas o síntomas concretos observados en Dynatrace o Grafana (ej: latencia P95 subió a 4.2s o tasa de errores 500 alcanzó el 30%).

2. Párrafo 2 — Escalamiento, Resolución e Impacto:
   - Escalamiento al ingeniero on-call a través de AlertOps y apertura de sala de crisis en Microsoft Teams.
   - Causa identificada y acción de resolución ejecutada (ej: rollback de versión en pipeline o reinicio secuencial de instancias).
   - Hora de normalización de métricas y duración total del impacto (ej: 25 a 35 minutos de indisponibilidad parcial).

Reglas Estrictas:
- Usa ÚNICAMENTE estas herramientas: Dynatrace o Grafana (monitoreo), AlertOps (alertas y guardia on-call), Microsoft Teams (sala de crisis), GLPI (sistema de tickets).
- PROHIBIDO mencionar PagerDuty, Slack, Elasticsearch, Kibana, Docker o Kubernetes.
- Debe ser directo y conciso (máximo 150 palabras). No agregues instrucciones ni títulos adicionales.
- Usa variación (seed: ${seed}) para que los nombres de servicio y horarios varíen cada vez.`

    return generateContentWithRetry(prompt)
}

export type B1RubricEvaluation = {
    estructura: { puntaje: number; comentario: string }
    precision_tecnica: { puntaje: number; comentario: string }
    acciones_documentadas: { puntaje: number; comentario: string }
    impacto: { puntaje: number; comentario: string }
    puntaje_total: number
    puntaje_normalizado: number
    resumen: string
}

/**
 * Evalúa un ticket B1 con la rúbrica detallada de 4 criterios para GLPI.
 * Retorna puntaje por criterio (1-4 cada uno) + puntaje normalizado a /7.
 */
export async function evaluateTicketB1Detailed(ticketText: string, caseContext: string): Promise<B1RubricEvaluation> {
    const prompt = `Eres un evaluador senior de SRE y líder de mesa de ayuda GLPI. Evalúa el siguiente ticket de incidente documentado por un candidato de soporte NOC.

CONTEXTO DEL INCIDENTE:
${caseContext}

TICKET DOCUMENTADO POR EL CANDIDATO (GLPI):
${ticketText}

REGLA LIMITANTE Y ESTRICTA: Si la respuesta del candidato tiene menos de 10 palabras, contiene solo afirmaciones genéricas (ej: "Se presentan errores", "Hubo falla") o carece por completo de los detalles técnicos mínimos provistos en el escenario, DEBES calificar con 1 TODOS los criterios. No asumas conocimiento que no está escrito explícitamente en el ticket.

Evalúa con la siguiente rúbrica para tickets en GLPI (1-4 por criterio):

1. ESTRUCTURA DEL REGISTRO EN GLPI (1-4):
   1 = Solo describe lo que pasó sin orden ni formato
   2 = Tiene inicio y fin pero le faltan campos clave (título, prioridad, servicio)
   3 = Cubre todos los campos relevantes de un ticket formal en GLPI
   4 = Estructura impecable, profesional y reutilizable como plantilla de incidente

2. PRECISIÓN TÉCNICA (1-4):
   1 = Omite datos técnicos o los confunde
   2 = Menciona el error pero sin contexto (host, métricas o herramientas)
   3 = Incluye host (srv-prod-...), servicio, error, métricas de Dynatrace/Grafana
   4 = Incluye evidencia técnica precisa, cronología de horas UTC y herramientas correctas

3. ACCIONES Y ESCALAMIENTO DOCUMENTADOS (1-4):
   1 = Solo el problema, sin acciones tomadas
   2 = Menciona que escaló pero sin detalle de AlertOps ni Teams
   3 = Documenta escalamiento vía AlertOps, sala en Microsoft Teams y solución aplicada
   4 = Cronología completa de acciones con responsables, herramientas y tiempos exactos

4. IMPACTO DESCRITO (1-4):
   1 = No menciona el impacto al servicio
   2 = Menciona que hubo impacto sin cuantificar
   3 = Indica servicio afectado y duración estimada
   4 = Cuantifica con exactitud el tiempo de impacto (minutos) y la afectación a usuarios

Responde ÚNICAMENTE con un JSON válido:
{
  "estructura": {"puntaje": N, "comentario": "..."},
  "precision_tecnica": {"puntaje": N, "comentario": "..."},
  "acciones_documentadas": {"puntaje": N, "comentario": "..."},
  "impacto": {"puntaje": N, "comentario": "..."},
  "puntaje_total": N,
  "puntaje_normalizado": N,
  "resumen": "..."
}

Donde puntaje_total = suma de los 4 criterios (max 16).
Donde puntaje_normalizado = (puntaje_total / 16) * 7, redondeado a 1 decimal.`

    const raw = await evaluateContentWithRetry(prompt)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const cleaned = jsonMatch ? jsonMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        const parsed = JSON.parse(cleaned)
        log.ai.info('Evaluación detallada B1 completada');
        return parsed
    } catch (e) {
        log.ai.error('Error parseando evaluación detallada B1', e as Error, { raw });
        return {
            estructura: { puntaje: 0, comentario: 'Error al evaluar' },
            precision_tecnica: { puntaje: 0, comentario: 'Error al evaluar' },
            acciones_documentadas: { puntaje: 0, comentario: 'Error al evaluar' },
            impacto: { puntaje: 0, comentario: 'Error al evaluar' },
            puntaje_total: 0,
            puntaje_normalizado: 0,
            resumen: 'Fallo al parsear respuesta JSON de Gemini para B1.'
        }
    }
}

export type B6RubricEvaluation = {
    handoff: { puntaje: number; comentario: string }
    claridad_bloqueos: { puntaje: number; comentario: string }
    seguimiento_acuerdos: { puntaje: number; comentario: string }
    puntaje_total: number
    puntaje_normalizado: number
    resumen: string
}

/**
 * Evalúa la dimensión B6 (Colaboración Asíncrona) usando el ticket B1.
 * Retorna puntaje por criterio (1-4 cada uno) + puntaje normalizado a /4.
 */
export async function evaluateTicketB6Detailed(ticketText: string): Promise<B6RubricEvaluation> {
    const prompt = `Eres un evaluador senior de SRE. Evalúa el siguiente ticket de incidente documentado por un candidato de soporte NOC, PERO enfocándote exclusivamente en la competencia "B6. Colaboración Asíncrona (Documentación y Orden)".
    
TICKET DOCUMENTADO POR EL CANDIDATO:
${ticketText}

REGLA LIMITANTE Y ESTRICTA: Si la respuesta del candidato es excesivamente corta (menos de 10 palabras), puramente genérica, o no contiene instrucciones, escalamientos ni referencias a siguientes pasos, DEBES calificar con 1 TODOS los criterios.

Evalúa cómo el registro facilita que otro ingeniero tome el relevo, con la siguiente rúbrica (1-4 por criterio):

1. B6.1 Handoff / Traspaso de turno (1-4):
   1 = No hay información clara para quien recibe el turno.
   2 = Hay contexto, pero falta información crítica para continuar sin preguntar.
   3 = Contexto suficiente para que otro ingeniero entienda el estado actual.
   4 = Excelente resumen de estado, siguientes pasos claros y contactos relevantes.

2. B6.2 Claridad en bloqueos (1-4):
   1 = No menciona si hay algo bloqueando o pendiente.
   2 = Menciona un bloqueo de forma vaga ("esperando respuesta").
   3 = Define claramente qué falta o quién debe responder.
   4 = Además de definir el bloqueo, indica exactamente qué hacer si se resuelve o no.

3. B6.3 Seguimiento de acuerdos / Próximos pasos (1-4):
   1 = No hay próximos pasos.
   2 = Próximos pasos vagos ("revisar mañana").
   3 = Próximos pasos claros con un responsable implícito.
   4 = Próximos pasos detallados, con responsables, tiempos esperados y acciones contingentes.

Responde ÚNICAMENTE con un JSON válido:
{
  "handoff": {"puntaje": N, "comentario": "..."},
  "claridad_bloqueos": {"puntaje": N, "comentario": "..."},
  "seguimiento_acuerdos": {"puntaje": N, "comentario": "..."},
  "puntaje_total": N,
  "puntaje_normalizado": N,
  "resumen": "..."
}

Donde puntaje_total = suma de los 3 criterios (max 12).
Donde puntaje_normalizado = (puntaje_total / 12) * 4, redondeado a 1 decimal.`

    const raw = await evaluateContentWithRetry(prompt)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const cleaned = jsonMatch ? jsonMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        const parsed = JSON.parse(cleaned)
        log.ai.info('Evaluación detallada B6 completada');
        return parsed
    } catch (e) {
        log.ai.error('Error parseando evaluación detallada B6', e as Error, { raw });
        return {
            handoff: { puntaje: 0, comentario: 'Error al evaluar' },
            claridad_bloqueos: { puntaje: 0, comentario: 'Error al evaluar' },
            seguimiento_acuerdos: { puntaje: 0, comentario: 'Error al evaluar' },
            puntaje_total: 0,
            puntaje_normalizado: 0,
            resumen: 'Fallo al parsear respuesta JSON de Gemini para B6.'
        }
    }
}

// --- GENERADORES Y EVALUADORES PARA SECCIONES B & C (ASÍNCRONOS) ---

export type BQuestion = {
    subcategory: string
    label: string
    question: string
}

export type CQuestion = {
    subcategory: string
    label: string
    question: string
}

export async function generateQuestionsB(educationLevel: string, profileTrack?: string): Promise<BQuestion[]> {
    const isOtel = profileTrack === 'otel_expert'
    const prompt = `Actúa como un evaluador senior de SRE y habilidades situacionales en ingeniería de software.
Genera exactamente 2 preguntas situacionales de respuesta abierta en español (máximo 35 a 45 palabras cada una) para evaluar la gestión de incidentes y colaboración:

1. B2.1 — Adaptabilidad & Gestión de Presión: Pregunta sobre una situación de alta presión (ej. durante un corte activo de servicio con degradación crítica, el equipo de desarrollo o producto exige reiniciar inmediatamente servicios o pods. ¿Cómo manejas la situación para mitigar el impacto rápidamente sin comprometer la telemetría esencial de traces/logs en OpenTelemetry y Grafana para el diagnóstico de causa raíz?).
2. B2.2 — Colaboración Blameless & Resiliencia: Pregunta sobre cómo abordarías una situación donde un compañero de equipo causa fallas reiteradas en producción por errores manuales o configuraciones erróneas, equilibrando el soporte técnico empático con la implementación de salvaguardas sistémicas, automatización en CI/CD y alertas preventivas en Grafana.

Reglas:
- Las preguntas deben requerir respuestas analíticas y situacionales breves (~40-60 palabras).
- Nivel de escolaridad: ${educationLevel}. ${isOtel ? 'Enfocado en entorno SRE / OpenTelemetry / Grafana.' : ''}
- Responde ÚNICAMENTE con un JSON array de 2 objetos:
[
  {"subcategory": "B2.1", "label": "Adaptabilidad & Gestión de Presión", "question": "..."},
  {"subcategory": "B2.2", "label": "Colaboración Blameless & Resiliencia", "question": "..."}
]`

    const raw = await generateContentWithRetry(prompt)
    const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
    const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        return JSON.parse(cleaned)
    } catch {
        return [
            { subcategory: 'B2.1', label: 'Adaptabilidad & Gestión de Presión', question: 'En medio de un corte crítico activo, el equipo exige reiniciar servicios inmediatamente arriesgando la pérdida de trazas en OpenTelemetry. ¿Cómo manejas la presión para mitigar el impacto rápidamente sin comprometer la telemetría esencial en Grafana para el diagnóstico posterior?' },
            { subcategory: 'B2.2', label: 'Colaboración Blameless & Resiliencia', question: 'Un compañero causa reiteradamente caídas en producción por errores manuales en despliegues. ¿Cómo abordarías esta situación manteniendo una cultura blameless, equilibrando el soporte técnico empático con la implementación de salvaguardas sistémicas y alertas en Grafana para evitar la recurrencia?' }
        ]
    }
}

export async function generateQuestionsC(educationLevel: string, profileTrack?: string): Promise<CQuestion[]> {
    const isOtel = profileTrack === 'otel_expert'
    const prompt = `Actúa como un Consultor de Cultura SRE y Filosofía de Observabilidad.
Genera exactamente 2 preguntas situacionales de respuesta abierta en español (máximo 35 a 45 palabras cada una) sobre filosofía SRE:

1. C1 — Cultura Blameless & Post-mortems: Pregunta cómo estructurarías una cultura de aprendizaje continuo y post-mortems sin culpas después de un incidente grave.
2. C2 — Mentalidad de SLOs & Error Budgets: Pregunta qué recomendación técnica le harías al líder de producto cuando el Error Budget de un servicio crítico se ha consumido en un 90% este mes y exigen desplegar nuevas funcionalidades.

Reglas:
- Preguntas situacionales directas de reflexión (~40-60 palabras).
- Nivel de escolaridad: ${educationLevel}. ${isOtel ? 'Enfocado en entorno SRE / OpenTelemetry / Grafana.' : ''}
- Responde ÚNICAMENTE con un JSON array de 2 objetos:
[
  {"subcategory": "C1", "label": "Cultura Blameless & Post-mortems", "question": "..."},
  {"subcategory": "C2", "label": "Mentalidad de SLOs & Error Budgets", "question": "..."}
]`

    const raw = await generateContentWithRetry(prompt)
    const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
    const cleaned = arrayMatch ? arrayMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        return JSON.parse(cleaned)
    } catch {
        return [
            { subcategory: 'C1', label: 'Cultura Blameless & Post-mortems', question: '¿Cómo garantizas que las reuniones de post-mortem y los reportes de incidentes se mantengan enfocados en la mejora sistémica y no en culpar a individuos cuando ocurre un falla humana?' },
            { subcategory: 'C2', label: 'Mentalidad de SLOs & Error Budgets', question: 'Si el Error Budget de un servicio crítico ha consumido el 90% de su margen mensual debido a inestabilidad de infraestructura, ¿qué posición y recomendación técnica adoptas ante el Product Owner sobre el lanzamiento de nuevas características?' }
        ]
    }
}

export type SectionEvaluationWithAiDetection = {
    score: number
    justification: string
    aiLikelihood: {
        percentage: number
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
        indicators: string[]
    }
}

export async function evaluateQuestionGeneric(
    subcategory: string,
    questionContext: string,
    candidateResponse: string
): Promise<SectionEvaluationWithAiDetection> {
    let rubricHint = ''
    if (subcategory === 'B2.1') {
        rubricHint = `
Criterios de Evaluación B2.1 (Preservación de Evidencia vs. Mitigación de Incidente):
- Evalúa cómo balancea la presión de reiniciar con la preservación de telemetría para diagnóstico de causa raíz.
- 0: Cede totalmente a reiniciar a ciegas sin guardar evidencia o respuesta evasiva/agresiva.
- 1: Sugiere solo mantener la calma o esperar pasivamente sin proponer acciones técnicas ni alternativas de contención.
- 2: Propone una solución intermedia funcional (aislar un nodo/pod con tráfico drenado, o volcar logs antes del reinicio).
- 3: Enfoque SRE ejemplar: negociación asertiva, aislamiento de réplicas para preservación de memoria/trazas (heap dump, flush de buffers en OTel Collector/Alloy o snapshot rápido) y restauración coordinada del tráfico.`
    } else if (subcategory === 'B2.2') {
        rubricHint = `
Criterios de Evaluación B2.2 (Cultura Blameless y Salvaguardas Sistémicas):
- Evalúa el balance entre apoyo empático al compañero y soluciones técnicas para prevenir fallas humanas.
- 0: Enfoque punitivo, culpar a la persona o desentenderse del problema.
- 1: Muestra empatía interpersonal pero no propone soluciones técnicas para evitar la recurrencia.
- 2: Propone post-mortem o hablar constructivamente e incorporar alguna validación manual o alerta básica.
- 3: Mentalidad de ingeniería de resiliencia: promueve cultura libre de culpas (seguridad psicológica), post-mortem colaborativo e implementación de salvaguardas sistémicas automatizadas (gates en CI/CD, canary releases, validaciones de configuración y dashboards/alertas proactivas en Grafana).`
    } else if (subcategory === 'C1') {
        rubricHint = `
Criterios de Evaluación C1 (Cultura Blameless & Post-mortems / Curiosidad Técnica y Aprendizaje):
- Evalúa la comprensión de fallas sistémicas vs errores humanos, seguridad psicológica y proactividad en el autoaprendizaje técnico.
- 0: Enfoque punitivo hacia errores, desinterés por aprender más allá de lo rutinario o respuestas evasivas.
- 1: Reconoce que no se debe culpar o menciona estudio superficial pero sin metodología, fuentes sólidas ni ejemplos reales.
- 2: Propone post-mortems constructivos orientados a procesos o demuestra aprendizaje técnico autodirigido con aplicación práctica.
- 3: Cultura blameless ejemplar: post-mortems estructurados enfocados en resiliencia sistémica, seguridad psicológica activa en el equipo y hábito continuo de estudio técnico auto-motivado compartido con sus compañeros.`
    } else if (subcategory === 'C2') {
        rubricHint = `
Criterios de Evaluación C2 (Mentalidad de SLOs & Error Budgets / Adaptabilidad al Cambio):
- Evalúa la comprensión de trade-offs entre velocidad de entrega y confiabilidad del servicio mediante Error Budgets, y resiliencia ante nuevas tecnologías.
- 0: Pretende 100% de disponibilidad sin análisis de riesgo, rechazo al cambio de herramientas o desinterés en métricas de servicio.
- 1: Conoce los conceptos de forma memorística pero no sabe cómo actuar cuando se agota el presupuesto de error o depende totalmente de otros ante cambios.
- 2: Entiende el balance entre innovación y estabilidad; propone acuerdos constructivos con producto ante SLOs en riesgo y adopta herramientas con buena disposición.
- 3: Mentalidad SRE madura: gobernanza rigurosa de Error Budgets basada en datos y SLIs centrados en el usuario final; liderazgo proactivo, analítico y resiliente ante transformaciones tecnológicas.`
    } else if (subcategory === 'C3') {
        rubricHint = `
Criterios de Evaluación C3 (Proyección Técnica & Sentido de Urgencia hacia Observabilidad / SRE):
- Evalúa la claridad en la transición desde soporte reactivo tradicional hacia la observabilidad proactiva y la ingeniería de confiabilidad.
- 0: Conformismo con tareas mecánicas, sin metas de crecimiento ni sentido de servicio al cliente/negocio.
- 1: Interés difuso o meramente aspiracional sin acciones de formación ni entendimiento del rol de confiabilidad.
- 2: Metas de desarrollo claras, entendimiento de la diferencia entre monitoreo reactivo y observabilidad proactiva.
- 3: Motivación intrínseca excepcional, plan de carrera técnico sólido y visión profunda del valor de la confiabilidad y la automatización.`
    }

    // 1. Evaluate score 0-3 using Gemini
    const prompt = `Actúa como un evaluador senior de SRE. Evalúa la siguiente respuesta del candidato a una pregunta de la subcategoría ${subcategory}.
${rubricHint}

PREGUNTA:
"${questionContext}"

RESPUESTA DEL CANDIDATO:
"${candidateResponse}"

Escala de Calificación (0 a 3):
0 = No responde, respuesta irrelevante, punitiva o evasiva.
1 = Respuesta vaga o incompleta; atiende solo una parte del problema (solo técnico o solo humano).
2 = Respuesta clara y funcional, muestra buen criterio técnico y conductual.
3 = Respuesta excelente, sólida argumentación senior, orientada a mejores prácticas de SRE/Observabilidad.

Responde ÚNICAMENTE con un JSON:
{
  "score": N,
  "justification": "Breve explicación en 1-2 oraciones del puntaje asignado."
}`

    let score = 1
    let justification = 'Evaluación completada.'

    try {
        const raw = await evaluateContentWithRetry(prompt)
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        const cleaned = jsonMatch ? jsonMatch[0] : raw.replace(/```json/gi, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleaned)
        score = typeof parsed.score === 'number' ? Math.min(3, Math.max(0, parsed.score)) : 1
        justification = parsed.justification || justification
    } catch (e) {
        log.ai.error(`Error evaluando subcategoría ${subcategory}`, e as Error)
    }

    // 2. Dual AI Likelihood Contra-Evaluation
    const aiDetection = await analyzeAiLikelihood(candidateResponse, questionContext)

    return {
        score,
        justification,
        aiLikelihood: {
            percentage: aiDetection.likelihoodPercentage,
            riskLevel: aiDetection.riskLevel,
            indicators: aiDetection.indicators
        }
    }
}



