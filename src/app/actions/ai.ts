'use server'

import { generateContentWithRetry, evaluateContentWithRetry, sanitizePII } from '@/lib/ai/gemini'

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

export async function generateFinalInsights(scoresAndCommentsContext: string): Promise<AIInsightsContent> {
    const prompt = `Dado el contexto del candidato:\n${scoresAndCommentsContext}\nRetorna ÚNICAMENTE un JSON válido: {"fortalezas":["..."], "brechas":["..."], "recomendacion_final":"..."}`
    const rawJson = await evaluateContentWithRetry(prompt)
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
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        return JSON.parse(cleaned)
    } catch {
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

    const prompt = `Eres un evaluador técnico de infraestructura para Analistas de Observabilidad Junior.
Genera exactamente 5 preguntas en español, una por cada subcategoría de A1, adaptadas al nivel educativo "${educationLevel}".

Estilo de preguntas a usar: ${questionStyle}

Subcategorías:
1. A1.1 — Linux: administración básica (navegar filesystem, permisos, procesos, logs)
2. A1.2 — Windows Server: servicios, visor de eventos
3. A1.3 — Redes: modelo OSI, TCP/IP, puertos, DNS
4. A1.4 — Contenedores: qué es Docker, para qué se usa
5. A1.5 — Cloud: IaaS/PaaS/SaaS, diferencia on-premise vs cloud

Contexto: El candidato viene de un rol de soporte (NOC/Ópera). NO es un examen de ingeniería.
Se evalúa comprensión conceptual y capacidad de explicar, no resolución de problemas avanzados.

Reglas:
- Cada pregunta debe poder responderse en 2-4 oraciones
- Las preguntas deben ser justas para el nivel ${educationLevel}
- Usa variación (seed: ${seed}) para generar preguntas diferentes cada vez
- Responde ÚNICAMENTE con un JSON array de 5 objetos

Formato exacto:
[
  {"subcategory": "A1.1", "label": "Linux", "question": "..."},
  {"subcategory": "A1.2", "label": "Windows Server", "question": "..."},
  {"subcategory": "A1.3", "label": "Redes", "question": "..."},
  {"subcategory": "A1.4", "label": "Contenedores", "question": "..."},
  {"subcategory": "A1.5", "label": "Cloud", "question": "..."}
]`

    const raw = await generateContentWithRetry(prompt)
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        return JSON.parse(cleaned)
    } catch {
        return [
            { subcategory: 'A1.1', label: 'Linux', question: '¿Conoce cómo navegar el sistema de archivos en Linux? Explique.' },
            { subcategory: 'A1.2', label: 'Windows Server', question: '¿Sabe dónde revisar los eventos del sistema en Windows Server?' },
            { subcategory: 'A1.3', label: 'Redes', question: '¿Conoce el modelo OSI? ¿Podría explicarlo?' },
            { subcategory: 'A1.4', label: 'Contenedores', question: '¿Conoce qué es Docker y para qué se usa?' },
            { subcategory: 'A1.5', label: 'Cloud', question: '¿Conoce la diferencia entre IaaS, PaaS y SaaS?' },
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
        `Subcategoría: ${qa.subcategory} (${qa.label})\nPregunta: ${qa.question}\nRespuesta del candidato: ${sanitizePII(qa.answer)}`
    ).join('\n\n---\n\n')

    const prompt = `Eres un evaluador técnico senior de infraestructura TI. Evalúa las siguientes respuestas de un candidato para el rol de Analista de Observabilidad Junior.

ESCALA DE VALORACIÓN (aplica estrictamente):
- 0 (Sin conocimiento): No conoce el concepto ni ha tenido contacto. Respuesta vacía, irrelevante o incorrecta.
- 1 (Básico): Ha escuchado el concepto, puede describirlo vagamente pero no lo ha aplicado. Respuesta parcial.
- 2 (Funcional): Lo ha aplicado en contexto real con supervisión. Respuesta correcta con comprensión básica.
- 3 (Autónomo): Lo aplica sin supervisión y puede explicarlo a otros. Respuesta completa y bien articulada.

IMPORTANTE: NO es un examen de ingeniería. Es una evaluación de comprensión conceptual para soporte NOC.
Sé justo y proporcional. Un candidato que explica correctamente un concepto básico merece al menos un 2.

RESPUESTAS A EVALUAR:

${qaBlock}

Responde ÚNICAMENTE con un JSON array de 5 objetos:
[
  {"subcategory": "A1.1", "label": "Linux", "score": 2, "justification": "Explica correctamente la navegación..."},
  ...
]`

    const raw = await evaluateContentWithRetry(prompt)
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
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
 * Genera 5 preguntas A2 (1 por subcategoría) adaptadas a la herramienta y nivel educativo.
 * A2.5 genera una alerta simulada que el candidato debe interpretar (entry-level).
 */
export type A2Question = { subcategory: string; label: string; question: string }

export async function generateQuestionsA2(tool: string, educationLevel: string): Promise<A2Question[]> {
    const seed = Math.floor(Math.random() * 10000)

    const prompt = `Eres un evaluador técnico de observabilidad para Analistas Junior (entry-level).
Genera exactamente 5 preguntas en español, una por cada subcategoría de A2, adaptadas a la herramienta "${tool}".

IMPORTANTE: El nivel es ENTRY-LEVEL / Junior, sin importar el nivel educativo del candidato (${educationLevel}).
Las preguntas deben ser conceptuales y prácticas básicas, NO de configuración avanzada.

Subcategorías:
1. A2.1 — Monitoreo reactivo vs observabilidad proactiva: ¿cuál es la diferencia?
2. A2.2 — Tres pilares de la observabilidad: Métricas, Logs y Trazas (que pueda definir cada uno)
3. A2.3 — Uso de ${tool}: navegación, lectura de dashboards, filtros básicos
4. A2.4 — Búsqueda de logs: cómo buscar logs, filtrar por campo y rango de tiempo en ${tool} u otra herramienta
5. A2.5 — Interpretación de alertas: Genera una ALERTA SIMULADA realista (ejemplo: "ALERTA: CPU Usage > 90% en servidor web-prod-03 desde hace 15 minutos") y pide al candidato que la interprete. ¿Qué indica? ¿Qué haría como primer paso?

La alerta de A2.5 debe ser realista, técnica pero comprensible para un junior.

Reglas:
- Cada pregunta debe poder responderse en 2-4 oraciones
- Las preguntas deben ser justas para nivel entry-level
- Usa variación (seed: ${seed})
- Responde ÚNICAMENTE con un JSON array de 5 objetos

Formato exacto:
[
  {"subcategory": "A2.1", "label": "Monitoreo vs Observabilidad", "question": "..."},
  {"subcategory": "A2.2", "label": "Tres Pilares", "question": "..."},
  {"subcategory": "A2.3", "label": "Dashboards en ${tool}", "question": "..."},
  {"subcategory": "A2.4", "label": "Búsqueda de Logs", "question": "..."},
  {"subcategory": "A2.5", "label": "Interpretación de Alertas", "question": "ALERTA: ... [alerta simulada]. ¿Qué indica esta alerta y cuáles serían tus primeros pasos?"}
]`

    const raw = await generateContentWithRetry(prompt)
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        return JSON.parse(cleaned)
    } catch {
        return [
            { subcategory: 'A2.1', label: 'Monitoreo vs Observabilidad', question: '¿Cuál es la diferencia entre monitoreo reactivo y observabilidad proactiva? Explique con un ejemplo.' },
            { subcategory: 'A2.2', label: 'Tres Pilares', question: '¿Cuáles son los tres pilares de la observabilidad? Defina cada uno brevemente.' },
            { subcategory: 'A2.3', label: `Dashboards en ${tool}`, question: `¿Cómo navegaría un dashboard en ${tool} para identificar un problema de rendimiento?` },
            { subcategory: 'A2.4', label: 'Búsqueda de Logs', question: '¿Cómo buscaría logs de error de los últimos 30 minutos? ¿Qué filtros usaría?' },
            { subcategory: 'A2.5', label: 'Interpretación de Alertas', question: 'ALERTA: Memory Usage > 95% en servidor app-prod-01 desde hace 20 minutos. ¿Qué indica esta alerta y cuáles serían tus primeros pasos para investigar?' },
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
        `Subcategoría: ${qa.subcategory} (${qa.label})\nPregunta: ${qa.question}\nRespuesta del candidato: ${sanitizePII(qa.answer)}`
    ).join('\n\n---\n\n')

    const prompt = `Eres un evaluador técnico senior de observabilidad. Evalúa las siguientes respuestas de un candidato para el rol de Analista de Observabilidad Junior.

ESCALA DE VALORACIÓN (aplica estrictamente):
- 0 (Sin conocimiento): No conoce el concepto ni ha tenido contacto. Respuesta vacía, irrelevante o incorrecta.
- 1 (Básico): Ha escuchado el concepto, puede describirlo vagamente pero no lo ha aplicado. Respuesta parcial.
- 2 (Funcional): Lo ha aplicado en contexto real con supervisión. Respuesta correcta con comprensión básica.
- 3 (Autónomo): Lo aplica sin supervisión y puede explicarlo a otros. Respuesta completa y bien articulada.

IMPORTANTE: Es evaluación entry-level / junior. Sé justo y proporcional.
Un candidato que explica correctamente un concepto básico merece al menos un 2.

RESPUESTAS A EVALUAR:

${qaBlock}

Responde ÚNICAMENTE con un JSON array de 5 objetos:
[
  {"subcategory": "A2.1", "label": "Monitoreo vs Observabilidad", "score": 2, "justification": "..."},
  ...
]`

    const raw = await evaluateContentWithRetry(prompt)
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
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
 * Genera 4 preguntas A3 (1 por subcategoría) adaptadas al nivel educativo.
 * A3.3 usa el concepto genérico de "herramienta ITSM" (no solo GLPI).
 */
export type A3Question = { subcategory: string; label: string; question: string }

export async function generateQuestionsA3(educationLevel: string): Promise<A3Question[]> {
    const seed = Math.floor(Math.random() * 10000)

    const prompt = `Eres un evaluador técnico para Analistas Junior (entry-level) de Observabilidad.
Genera exactamente 4 preguntas en español, una por cada subcategoría de A3.

CONTEXTO DEL SANDBOX (Terminal):
- Existe una carpeta /scripts con: backup.sh (Bash) y monitor.py (Python).
- El candidato puede explorarlos usando 'cat'.

Subcategorías y Tareas:
1. A3.1 — Git básico: Pregunta sobre un flujo común (ej. qué harías si trabajas en una rama y quieres llevar tus cambios al repositorio remoto).
2. A3.2 — Scripting: Pide al candidato que explore la carpeta /scripts en la terminal, elija el script que mejor se adapte a su experiencia (Python o Bash) y explique brevemente qué entiende que hace el script (sin indicarle qué comandos usar para leerlo).
3. A3.3 — Gestión ITSM: Describe el siguiente problema: "Varios usuarios reportan que no pueden acceder al módulo de facturación (Error 502). El equipo de red ya confirmó que la conectividad es OK." Pide al candidato que registre el incidente. (Nota: Se le proveerá una plantilla de campos en el formulario).
4. A3.4 — Documentación: Pide al candidato que redacte una breve guía de troubleshooting o un "paso a paso" inicial para que otro analista pueda revisar el problema del Error 502 mencionado en A3.3.

Reglas:
- Nivel Junior/Entry (escolaridad: ${educationLevel}).
- A3.3 NO debe ser aleatoria, usa el problema del Error 502.
- A3.4 debe estar correlacionada con A3.3.
- Responde ÚNICAMENTE con un JSON array de 4 objetos:
[
  {"subcategory": "A3.1", "label": "Git Básico", "question": "..."},
  {"subcategory": "A3.2", "label": "Scripting", "question": "..."},
  {"subcategory": "A3.3", "label": "Gestión ITSM", "question": "..."},
  {"subcategory": "A3.4", "label": "Documentación", "question": "..."}
]`

    const raw = await generateContentWithRetry(prompt)
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        return JSON.parse(cleaned)
    } catch {
        return [
            { subcategory: 'A3.1', label: 'Git Básico', question: '¿Para qué sirve Git en el trabajo diario de un equipo técnico? ¿Puedes explicar qué es un "commit" y para qué se usa?' },
            { subcategory: 'A3.2', label: 'Scripting', question: '¿Has ejecutado o leído algún script en Bash o Python? ¿Puedes explicar qué haría un script que lee un archivo y cuenta las líneas?' },
            { subcategory: 'A3.3', label: 'Gestión ITSM', question: '¿Cómo registrarías un incidente de producción en una herramienta de gestión de tickets (GLPI, JIRA, ServiceNow, etc.)? ¿Qué campos completarías?' },
            { subcategory: 'A3.4', label: 'Documentación', question: '¿Has documentado procedimientos técnicos en alguna herramienta como Confluence, wikis, o similares? ¿Qué incluirías en una guía de troubleshooting?' },
        ]
    }
}

/**
 * Evalúa las 4 respuestas de A3 usando la escala 0-3.
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
        `Subcategoría: ${qa.subcategory} (${qa.label})\nPregunta: ${qa.question}\nRespuesta del candidato: ${sanitizePII(qa.answer)}`
    ).join('\n\n---\n\n')

    const prompt = `Eres un evaluador técnico senior. Evalúa las respuestas de un candidato entry-level para el rol de Analista de Observabilidad Junior.

CONTEXTO TÉCNICO (Sandbox):
- El candidato tenía acceso a /scripts/backup.sh y /scripts/monitor.py.
- backup.sh: Respalda logs de /var/log en /mnt/backup usando tar.
- monitor.py: Chequea salud de nginx, postgresql y redis. Nginx se reporta como CRITICAL.

Subcategorías A3:
- A3.1 (Git): Flujo básico.
- A3.2 (Scripting): Capacidad de lectura y comprensión lógica de scripts existentes.
- A3.3 (ITSM): Registro de incidente por Error 502 en facturación. Valora el uso de campos (Títulos, Prioridad, Descripción técnica).
- A3.4 (Documentación): Claridad y coherencia con el fallo del Error 502.

ESCALA DE VALORACIÓN:
- 0 (Sin conocimiento): No conoce el concepto o respuesta irrelevante.
- 1 (Básico): Entiende el concepto pero la respuesta es muy superficial o incompleta.
- 2 (Funcional): Respuesta correcta y coherente que demuestra capacidad operativa básica.
- 3 (Autónomo): Respuesta detallada, precisa o que aporta valor extra sobre el proceso.

QA A EVALUAR:
${qaBlock}

Responde ÚNICAMENTE con un JSON array de 4 objetos:
[
  {"subcategory": "A3.1", "label": "Git Básico", "score": 2, "justification": "..."},
  ...
]`

    const raw = await evaluateContentWithRetry(prompt)
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
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
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        return JSON.parse(cleaned)
    } catch {
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
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        return JSON.parse(cleaned)
    } catch {
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

// ============================
// UTILIDADES
// ============================

function parseJsonArray(raw: string): string[] {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
        const parsed = JSON.parse(cleaned)
        if (Array.isArray(parsed)) return parsed.map(String)
        return ['Error generando preguntas']
    } catch {
        // Intento de extraer preguntas del texto libre
        const lines = cleaned.split('\n').filter(l => l.trim().startsWith('"') || l.trim().match(/^\d/))
        if (lines.length >= 3) return lines.slice(0, 3).map(l => l.replace(/^[\d.)\-\s"]+/, '').replace(/"[,\]]?$/, '').trim())
        return ['Error generando preguntas. Intente nuevamente.']
    }
}
