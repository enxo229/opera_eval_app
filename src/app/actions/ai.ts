'use server'

import { generateContentWithRetry, evaluateContentWithRetry } from '@/lib/ai/gemini'
import { log } from '@/lib/observability/logger'

/**
 * Fuerza la generación de feedback usando el modelo Lite.
 */
export async function generateNarrativeFeedbackLite(context: string): Promise<AINarrativeReport> {
    const prompt = `Actúa como un Consultor Senior de Talento Técnico y SRE. 
Tu objetivo es consolidar los resultados de una evaluación técnica y conductual para un rol de Analista de Observabilidad Junior.

CONTEXTO DE LA EVALUACIÓN:
${context}

INSTRUCCIONES:
1. Analiza el desempeño global.
2. Genera un "Relato Final" de 2-3 párrafos profesional y constructivo.
3. Identifica una lista de "Fortalezas" (mínimo 3).
4. Identifica una lista de "Brechas" (mínimo 2).

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

export async function generateDynamicCaseA4(): Promise<string> {
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
export async function generateNarrativeFeedback(context: string): Promise<AINarrativeReport> {
    const prompt = `Actúa como un Consultor Senior de Talento Técnico y SRE. 
Tu objetivo es consolidar los resultados de una evaluación técnica y conductual para un rol de Analista de Observabilidad Junior.

CONTEXTO DE LA EVALUACIÓN (Scores, Comentarios del Evaluador y Respuestas del Candidato):
${context}

INSTRUCCIONES:
1. Analiza el desempeño global.
2. Genera un "Relato Final" (narrativa) de unos 2-3 párrafos que sea profesional, constructivo y directamente compartible con el candidato. Debe tener un tono de mentoría.
3. Identifica una lista de "Fortalezas" (mínimo 3).
4. Identifica una lista de "Brechas o Áreas de Mejora" (mínimo 2).

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
    const prompt = `Eres una simulación de consola de logs/backend (Grafana/Kibana) durante un incidente P1. 
Responde de forma técnica y concisa simulando el resultado que arrojarían los logs o métricas según lo que el usuario pida.
Intenta ser realista: si pide logs sin filtrar, dile que hay demasiada data. Si pide logs específicos, dáselos.

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

export async function generateQuestionsA1(educationLevel: string): Promise<A1Question[]> {
    const seed = Math.floor(Math.random() * 10000)
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
 * Evalúa las 5 respuestas de A1 usando la escala 0-3.
 * Retorna un score y justificación para cada subcategoría.
 */
export type A1EvaluationResult = {
    subcategory: string
    label: string
    score: number      // 0-3
    justification: string
}

export async function evaluateAnswersA1(
    questionsAndAnswers: { subcategory: string; label: string; question: string; answer: string }[]
): Promise<A1EvaluationResult[]> {
    const qaBlock = questionsAndAnswers.map(qa =>
        `Subcategoría: ${qa.subcategory} (${qa.label})\nPregunta: ${qa.question}\nRespuesta del candidato: ${qa.answer}`
    ).join('\n\n---\n\n')

    const prompt = `Eres un evaluador técnico senior de infraestructura y cloud TI. Evalúa las siguientes respuestas de un candidato para el rol de Analista de Observabilidad Junior (Linux & AWS Cloud).

ESCALA DE VALORACIÓN (aplica estrictamente):
- 0 (Sin conocimiento): No conoce el concepto ni ha tenido contacto. Respuesta vacía, irrelevante o incorrecta.
- 1 (Básico): Ha escuchado el concepto, puede describirlo vagamente pero no lo ha aplicado. Respuesta parcial.
- 2 (Funcional): Lo ha aplicado en contexto real con supervisión. Respuesta correcta con comprensión básica.
- 3 (Autónomo): Lo aplica sin supervisión y puede explicarlo a otros. Respuesta completa y bien articulada.

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
    try {
        const parsed = JSON.parse(cleaned)
        log.ai.info('Evaluación A1 completada');
        return parsed
    } catch (e) {
        log.ai.error('Error parseando evaluación A1', e as Error, { raw });
        return questionsAndAnswers.map(qa => ({
            subcategory: qa.subcategory,
            label: qa.label,
            score: 0,
            justification: 'Error al procesar la evaluación. Intente nuevamente.',
        }))
    }
}

/**
 * Genera 5 preguntas A2 (1 por subcategoría) adaptadas a Observabilidad, SRE, Dynatrace y Grafana.
 */
export type A2Question = { subcategory: string; label: string; question: string }

export async function generateQuestionsA2(tool: string, educationLevel: string): Promise<A2Question[]> {
    const seed = Math.floor(Math.random() * 10000)

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
 * Evalúa las 5 respuestas de A2 usando la escala 0-3.
 */
export type A2EvaluationResult = {
    subcategory: string
    label: string
    score: number      // 0-3
    justification: string
}

export async function evaluateAnswersA2(
    questionsAndAnswers: { subcategory: string; label: string; question: string; answer: string }[]
): Promise<A2EvaluationResult[]> {
    const qaBlock = questionsAndAnswers.map(qa =>
        `Subcategoría: ${qa.subcategory} (${qa.label})\nPregunta: ${qa.question}\nRespuesta del candidato: ${qa.answer}`
    ).join('\n\n---\n\n')

    const prompt = `Eres un evaluador técnico senior de observabilidad y SRE. Evalúa las siguientes respuestas de un candidato para el rol de Analista de Observabilidad Junior (Observabilidad, SRE, Dynatrace, Grafana).

ESCALA DE VALORACIÓN (aplica estrictamente):
- 0 (Sin conocimiento): No conoce el concepto ni ha tenido contacto. Respuesta vacía, irrelevante o incorrecta.
- 1 (Básico): Ha escuchado el concepto, puede describirlo vagamente pero no lo ha aplicado. Respuesta parcial.
- 2 (Funcional): Lo ha aplicado en contexto real con supervisión. Respuesta correcta con comprensión básica.
- 3 (Autónomo): Lo aplica sin supervisión y puede explicarlo a otros. Respuesta completa y bien articulada.

IMPORTANTE: Es evaluación entry-level / junior. Sé justo y proporcional.
Un candidato que explica correctamente un concepto básico merece al menos un 2.

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

/**
 * Genera 3 preguntas A3 (Git & Análisis/Automatización con Python & Pandas).
 * Para A3.2 y A3.3, incluye fragmentos de código Python en el enunciado para evaluar
 * la capacidad del analista de interpretar qué hace el código, sus parámetros de entrada y sus salidas esperadas.
 */
export type A3Question = { subcategory: string; label: string; question: string }

export async function generateQuestionsA3(educationLevel: string): Promise<A3Question[]> {
    const seed = Math.floor(Math.random() * 10000)
    const isEntry = educationLevel === 'tecnico_sena' || educationLevel === 'bachiller'

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
    questionsAndAnswers: { subcategory: string; label: string; question: string; answer: string }[]
): Promise<A3EvaluationResult[]> {
    const qaBlock = questionsAndAnswers.map(qa =>
        `Subcategoría: ${qa.subcategory} (${qa.label})\nPregunta y Código: ${qa.question}\nRespuesta del candidato: ${qa.answer}`
    ).join('\n\n---\n\n')

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
 * Cada caso es diferente: diferentes servicios, errores, horarios, impactos.
 */
export async function generateIncidentCaseB1(): Promise<string> {
    const seed = Math.floor(Math.random() * 10000)
    const prompt = `Eres un generador de escenarios de incidentes técnicos de producción para evaluaciones de soporte NOC/SRE.

Genera UN escenario de incidente único y realista en español. El candidato debe usar este escenario para documentar un ticket de incidente como si lo fuera a ingresar en un sistema de gestión (GLPI).

Requisitos del escenario:
- Incluye hora exacta, nombre del servidor (formato srv-prod-XXX-01), servicio afectado
- Incluye una alerta con asunto del correo
- Incluye datos de lo que se observa en una herramienta de monitoreo (Grafana, Elasticsearch, Kibana)
- Incluye logs específicos con mensajes de error realistas
- Incluye un intento de contacto con el equipo de escalamiento
- Incluye resolución final (rollback, restart, fix temporal)
- Incluye duración del impacto
- Usa variación (seed: ${seed}) para que cada caso sea completamente diferente

Formato: Escribe el escenario como una narrativa en segunda persona ("Recibes una alerta...") de máximo 4 párrafos. No incluyas instrucciones sobre qué hacer.`

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
 * Evalúa un ticket B1 con la rúbrica detallada de 4 criterios.
 * Retorna puntaje por criterio (1-4 cada uno) + puntaje normalizado a /7.
 */
export async function evaluateTicketB1Detailed(ticketText: string, caseContext: string): Promise<B1RubricEvaluation> {
    const prompt = `Eres un evaluador senior de SRE. Evalúa el siguiente ticket de incidente documentado por un candidato de soporte NOC.

CONTEXTO DEL INCIDENTE:
${caseContext}

TICKET DOCUMENTADO POR EL CANDIDATO:
${ticketText}

REGLA LIMITANTE Y ESTRICTA: Si la respuesta del candidato tiene menos de 10 palabras, contiene solo afirmaciones genéricas (ej: "Se presentan errores", "Hubo falla") o carece por completo de los detalles técnicos mínimos provistos en el escenario, DEBES calificar con 1 TODOS los criterios. No asumas conocimiento que no está escrito explícitamente en el ticket.

Evalúa con la siguiente rúbrica (1-4 por criterio):

1. ESTRUCTURA DEL REGISTRO (1-4):
   1 = Solo describe lo que pasó sin orden
   2 = Tiene inicio y fin pero le faltan campos clave  
   3 = Cubre todos los campos relevantes del ticket
   4 = Estructura clara, reutilizable como plantilla

2. PRECISIÓN TÉCNICA (1-4):
   1 = Omite datos técnicos o los confunde
   2 = Menciona el error pero sin contexto (proceso, duración)
   3 = Incluye proceso, error, duración y métricas
   4 = Incluye evidencia técnica y cronología completa

3. ACCIONES DOCUMENTADAS (1-4):
   1 = Solo el problema, sin acciones tomadas
   2 = Menciona que escaló pero sin detalle
   3 = Documenta pasos propios y respuesta del escalado
   4 = Cronología de acciones con responsables y tiempos

4. IMPACTO DESCRITO (1-4):
   1 = No menciona el impacto al servicio
   2 = Menciona que hubo impacto sin cuantificar
   3 = Indica servicio afectado y duración
   4 = Cuantifica afectación con datos concretos

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


