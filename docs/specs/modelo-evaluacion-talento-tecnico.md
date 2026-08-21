# Modelo de Evaluación de Talento Técnico
## Pivote Técnico / Soporte → Analista de Observabilidad Junior
### CoE de Observabilidad | Equipo de Delivery MSP

---

## 1. PROPÓSITO DEL MODELO

Este modelo tiene como objetivo evaluar a los integrantes de los equipos técnicos (Soporte Nivel 1 / NOC / Infraestructura) para determinar su **aptitud y preparación para pivotar al rol de Analista de Observabilidad Junior** en el equipo de Delivery. La evaluación considera tres dimensiones: técnica, habilidades blandas y actitunidal; además de una sección complementaria de IA. El resultado clasifica a cada persona en una de cuatro categorías de decisión y genera un informe ejecutivo automatizado.

---

## 2. CRITERIOS DE ELEGIBILIDAD BASE (Filtro Previo)

Antes de aplicar la evaluación, el candidato debe cumplir al menos uno de los siguientes requisitos de formación académica:

| Nivel | Descripción | ¿Elegible? |
|---|---|---|
| Técnico SENA | Sistemas, Redes, Infraestructura o afín | ✅ Mínimo requerido |
| Tecnólogo | Cualquier área TI | ✅ |
| Profesional / Ingeniería | Sistemas, Electrónica, Telecomunicaciones o afín | ✅ |
| Bachiller sin formación TI | — | ❌ No elegible en esta convocatoria |

> **Nota:** La experiencia práctica en su rol actual puede compensar el nivel académico mínimo si el evaluador lo justifica documentadamente.

---

## 3. ESTRUCTURA DE LA EVALUACIÓN

| Dimensión | Peso | Descripción |
|---|---|---|
| **A. Técnica** | 50% | Conocimientos y habilidades operativas en infraestructura, sistemas y herramientas |
| **B. Habilidades Blandas** | 30% | Comunicación, documentación, trabajo en equipo y orientación al cliente |
| **C. Actitudinal** | 20% | Adaptabilidad, aprendizaje autónomo y disposición al cambio de rol |

**Puntaje Total Máximo: 100 puntos**

---

## 4. DIMENSIÓN A — TÉCNICA (50 puntos)

### Escala de Valoración por Competencia (A1, A2, A3)

| Nivel | Puntaje | Descripción |
|---|---|---|
| 0 — Sin conocimiento | 0 | No conoce el concepto ni ha tenido contacto |
| 1 — Básico | 1 | Ha escuchado el concepto, puede describirlo pero no lo ha aplicado |
| 2 — Funcional | 2 | Lo ha aplicado en contexto real con supervisión |
| 3 — Autónomo | 3 | Lo aplica sin supervisión y puede explicarlo a otros |

---

### A1. Linux & Cloud Computing AWS (15 puntos)

| # | Competencia | 0 | 1 | 2 | 3 | Evidencia / Comentario |
|---|---|---|---|---|---|---|
| A1.1 | **Linux Filesystem & Permisos**: Navegación (`ls`, `cd`, `find`), permisos (`chmod`, `chown`, octales) y gestión de archivos | | | | | |
| A1.2 | **Linux Procesos & Servicios**: Monitoreo de procesos (`ps`, `top`, `kill`, `htop`) y gestión de servicios (`systemctl`, `journalctl`) | | | | | |
| A1.3 | **Linux Logs & Troubleshooting**: Análisis de logs del sistema (`/var/log/messages`, `/var/log/syslog`, `dmesg`, `grep`, `tail -f`) | | | | | |
| A1.4 | **Fundamentos de Cloud Computing**: Modelos IaaS / PaaS / SaaS, alta disponibilidad, escalabilidad y elasticidad | | | | | |
| A1.5 | **AWS Core Services & Seguridad**: Servicios principales (EC2, S3, CloudWatch), Modelo de Responsabilidad Compartida y regiones/AZs | | | | | |
| **Subtotal A1** | | | | | **/15** | |

---

### A2. Observabilidad, SRE & APM (15 puntos)

| # | Competencia | 0 | 1 | 2 | 3 | Evidencia / Comentario |
|---|---|---|---|---|---|---|
| A2.1 | **Pilares de Observabilidad**: Métricas, Logs y Trazas; transición del monitoreo reactivo a la observabilidad proactiva | | | | | |
| A2.2 | **SRE Fundamentals**: Definición y cálculo de SLI (Service Level Indicator), SLO (Objective), SLA (Agreement) y Error Budget | | | | | |
| A2.3 | **Dynatrace APM & IA**: Monitoreo de servicios/transacciones, topología Smartscape y detección automatizada de anomalías | | | | | |
| A2.4 | **Grafana Dashboards & Visualización**: Creación y lectura de paneles, variables/filtros, fuentes de datos y dashboards unificados | | | | | |
| A2.5 | **Interpretación y Gestión de Alertas**: Análisis de severidad, correlación de eventos y umbrales proactivos | | | | | |
| **Subtotal A2** | | | | | **/15** | |

---

### A3. Control de Versiones Git & Análisis de Datos con Pandas (10 puntos)

| # | Competencia | 0 | 1 | 2 | 3 | Evidencia / Comentario |
|---|---|---|---|---|---|---|
| A3.1 | **Git & Colaboración Técnica**: Clonar repositorios, ramificación (`git checkout -b`), commits estructurados, push y resolución básica | | | | | |
| A3.2 | **Pandas: Carga y Filtrado de Series de Tiempo**: Importar datos de observabilidad (`read_csv`, `read_json`), filtrado temporal y selección de columnas | | | | | |
| A3.3 | **Pandas: Agregaciones y Detección de Anomalías**: Uso de `groupby`, `describe`, percentiles (P95/P99) y detección de picos de latencia / tasas de error | | | | | |
| **Subtotal A3** | *(Puntaje obtenido / 9) × 10* | | | | **/10** | |

---

### A4. Pensamiento Analítico Técnico / Troubleshooting (10 puntos)

*Esta sección se evalúa mediante una situación práctica presentada en la plataforma.*

**Caso práctico:**
> "Se recibe una alerta crítica de degradación de servicio en una aplicación web monitoreada con Dynatrace y Grafana. Los usuarios reportan lentitud y aumento en la tasa de errores HTTP 500. ¿Cuáles serían tus pasos estructurados para aislar la causa raíz utilizando dashboards de métricas, transacciones APM y logs?"

| Criterio de evaluación | 0 | 2 | 4 | 5 | Comentario |
|---|---|---|---|---|---|
| Identifica fuentes de información relevantes (métricas de servicio, traces APM, logs de excepciones) | | | | | |
| Propone una secuencia lógica y estructurada de investigación (aislar componente degradado) | | | | | |
| Diferencia con precisión entre el síntoma (lentitud) y la causa raíz técnica | | | | | |
| **Subtotal A4** | *(Normalizado a 10 puntos)* | | | **/10** | |

---

## 5. DIMENSIÓN B — HABILIDADES BLANDAS (30 puntos)

### B1. Comunicación Técnica Escrita — Registro de Incidente (10 puntos)

**Escenario para el candidato:**
> Son las 2:47 a.m. del martes. Recibes una alerta crítica: *"CRITICAL – High Latency & HTTP 500 Spike – srv-prod-payments-01"*.
> 
> En Grafana observas que la latencia P99 subió a 4.8s y en Dynatrace el servicio `payment-gateway` registra excepciones de timeout hacia la base de datos PostgreSQL. Tras escalar al ingeniero de turno, este confirma que a las 3:15 a.m. ejecutó un reinicio del pool de conexiones y el servicio se restableció con normalidad.
> 
> **Tu tarea:** Documenta este incidente de la forma más completa y estructurada posible (Descripción, Impacto, Cronología, Causa Inmediata y Solución).

**Rúbrica B1 (10 puntos):**
- **Estructura y Campos Clave (0–3 pts)**: Claridad, secciones completas y cronología.
- **Precisión Técnica (0–3 pts)**: Identificación de servicios, métricas, latencia y tiempos.
- **Impacto y Acciones Documentadas (0–4 pts)**: Afectación de negocio descrita con exactitud y trazabilidad de acciones tomadas.

---

### B2. Comunicación Verbal Técnica & Stakeholders (10 puntos)

**Instrucción:** Pide al candidato explicar verbalmente el incidente anterior como si tú fueras el Gerente de Operaciones del cliente afectado (sin tecnicismos excesivos, enfocado en impacto, acciones y estado actual).

**Rúbrica B2 (10 puntos):**
- **Claridad y Traducción a Negocio (0–3 pts)**: Explica los hechos sin jerga innecesaria.
- **Estructura Narrativa (0–4 pts)**: Inicio (qué pasó), desarrollo (qué se hizo) y estado actual/mitigaciones.
- **Tranquilidad y Transmisión de Certeza (0–3 pts)**: Transmite control y profesionalismo.

---

### B3. Colaboración, Priorización de Alertas & Manejo Bajo Presión (10 puntos)

**Instrucción:** Conversación estructurada sobre turnos de alta demanda, priorización de alertas simultáneas y trabajo en equipo.

**Preguntas guía:**
1. *"Cuando recibes múltiples alertas al mismo tiempo (ej: una de CPU alto y otra de caída de servicio crítico), ¿cuál es tu criterio para priorizar?"*
2. *"Cuéntame de una ocasión en que apoyaste a un compañero de turno con una incidencia compleja que no era de tu área directa."*

**Rúbrica B3 (10 puntos):**
- **Criterio de Priorización por Impacto (0–5 pts)**: Distingue criticidad de servicio vs severidad de alerta.
- **Trabajo en Equipo y Cooperación (0–5 pts)**: Actitud proactiva, colaboración y comunicación efectiva en momentos de alta carga.

---

### Consolidación Dimensión B

| Competencia | Puntaje Obtenido | Máximo |
|---|---|---|
| B1. Comunicación Escrita (Registro de Incidente) | | 10 |
| B2. Comunicación Verbal & Stakeholders | | 10 |
| B3. Colaboración, Priorización y Manejo Bajo Presión | | 10 |
| **Total B** | | **/30** |

---

## 6. DIMENSIÓN C — ACTITUDINAL (20 puntos)

*Evaluada mediante conversación estructurada de desarrollo profesional.*

### C1. Disposición al Aprendizaje Autónomo & Curiosidad Técnica (0–7 puntos)

**Pregunta de apertura:**
> *"Fuera de tus tareas rutinarias, ¿hay algún tema tecnológico (Linux, automatización, cloud, observabilidad) que hayas estudiado o practicado por tu cuenta recientemente? ¿Qué te motivó y cómo lo aplicaste?"*

**Rúbrica C1 (7 puntos):**
- **Hábito y Motivación Propia (0–4 pts)**: Aprendizaje autodirigido, fuentes técnicas sólidas y curiosidad continua.
- **Aplicación Práctica y Compartir (0–3 pts)**: Aplicación real o en laboratorios, y disposición para enseñar a otros.

---

### C2. Adaptabilidad al Cambio & Resiliencia Operativa (0–7 puntos)

**Pregunta de apertura:**
> *"En los turnos de soporte o infraestructura es común que cambien los procesos, herramientas o prioridades de emergencia. Cuéntame de un cambio reciente o un incidente inesperado difícil y cómo te adaptaste."*

**Rúbrica C2 (7 puntos):**
- **Actitud Proactiva ante el Cambio (0–4 pts)**: Asume la transición con madurez, sin resistencia pasiva ni quejas.
- **Resolución ante la Incertidumbre (0–3 pts)**: Investiga antes de escalar, documenta y aprende de la experiencia.

---

### C3. Aspiraciones y Proyección hacia SRE & Observabilidad (0–6 puntos)

**Pregunta de apertura:**
> *"Si proyectas tu carrera en tecnología a 1 o 2 años, ¿hacia qué áreas (SRE, observabilidad, cloud, ingeniería de confiabilidad) te gustaría evolucionar y qué pasos estás dando para lograrlo?"*

**Rúbrica C3 (6 puntos):**
- **Claridad de Vector Profesional (0–3 pts)**: Visión compatible con la observabilidad y gestión de plataformas críticas.
- **Iniciativa y Conexión con el Rol Actual (0–3 pts)**: Relaciona su experiencia de soporte con el valor del nuevo rol.

---

### Consolidación Dimensión C

| Competencia | Puntaje Obtenido | Máximo |
|---|---|---|
| C1. Disposición al Aprendizaje Autónomo | | 7 |
| C2. Adaptabilidad al Cambio y Resiliencia | | 7 |
| C3. Aspiraciones y Proyección hacia SRE/Observabilidad | | 6 |
| **Total C** | | **/20** |

---

## 7. SECCIÓN COMPLEMENTARIA — USO E INCORPORACIÓN DE IA (10 puntos)

> Esta sección **no afecta los pesos de las dimensiones A, B y C**. Su puntaje se reporta de forma independiente en la ficha individual y se usa como **criterio de desempate** y diagnóstico para el onboarding.

---

### IA-1. Actitud y Criterio frente a la IA (0–5 puntos)

**Pregunta de apertura:**
> *"¿Usas herramientas de inteligencia artificial en tu trabajo o aprendizaje técnico? ¿Cómo verificas si la respuesta que te entrega es correcta o si contiene alucinaciones?"*

**Rúbrica IA-1 (5 puntos):**
- **Uso Regular & Asistencia (0–3 pts)**: Utiliza IA como acelerador para análisis, consultas o sintaxis.
- **Pensamiento Crítico y Validación (0–2 pts)**: Valida y no acepta respuestas sin filtro técnico.

---

### IA-2. Prompt Engineering Aplicado a Observabilidad (0–5 puntos)

**Ejercicio práctico (5 minutos):**

Entrega al candidato el siguiente enunciado e ingresa el prompt en el editor integrado:

> *"Usando la herramienta de IA que prefieras, formúlale una instrucción para obtener la consulta en Grafana Loki (LogQL) que filtre los logs de error con código HTTP 500 del servicio `payments-service` del día de ayer, o cómo aislar la traza de mayor latencia en Dynatrace. Cuando tengas la respuesta, copia tu prompt exacto aquí."*

**Guía de puntuación IA-2 (Ingeniería de Contexto):**
1. **Asignación de Rol** (0-1 pt): Rol experto (ej: *"Actúa como un SRE experto en Grafana Loki / Dynatrace..."*).
2. **Contexto Técnico** (0-1 pt): Parámetros precisos (servicio, código de error/latencia, marco temporal).
3. **Formato de Salida** (0-1 pt): Especifica formato (LogQL con comentarios, formato JSON, paso a paso).
4. **Restricciones / Guardrails** (0-1 pt): Delimita campos (`{app="payments-service"} |= "status=500"`, rango de tiempo).
5. **Sofisticación** (0-1 pt): Solicita explicación, optimización o validación de sintaxis.

**Puntaje IA-2:** _______ / 5

---

### Consolidación Sección IA

| Competencia | Puntaje Obtenido | Máximo |
|---|---|---|
| IA-1. Actitud y Criterio frente a la IA | | 5 |
| IA-2. Prompt Engineering Aplicado | | 5 |
| **Total IA (Complementario)** | | **/10** |

**Interpretación del puntaje IA:**

| Rango | Lectura |
|---|---|
| **8 – 10** | Ya tiene hábitos de uso. Onboarding de IA puede ser acelerado. Candidato diferenciador. |
| **5 – 7** | Base suficiente. El plan de formación debe incluir IA desde el mes 1 con acompañamiento. |
| **0 – 4** | Requiere introducción desde cero. Priorizar en el plan de formación antes de tareas autónomas. |

---

## 8. CONSOLIDACIÓN DE RESULTADOS

### Tabla de Puntaje Final

| Dimensión | Peso | Puntaje Obtenido | Puntaje Ponderado |
|---|---|---|---|
| A. Técnica | 50% | _____ / 50 | _____ |
| B. Habilidades Blandas | 30% | _____ / 30 | _____ |
| C. Actitudinal | 20% | _____ / 20 | _____ |
| **TOTAL** | 100% | | **_____ / 100** |

---

### Escala de Decisión

| Rango | Clasificación | Decisión |
|---|---|---|
| **80 – 100** | 🟢 **Listo para pivotar** | Puede incorporarse al equipo de Delivery con onboarding estándar del CoE |
| **60 – 79** | 🟡 **Pivote con plan de nivelación** | Puede iniciar el pivote, pero requiere un plan de cierre de brechas específico antes del mes 2 |
| **40 – 59** | 🟠 **En preparación** | No está listo aún. Se define un plan de formación de 2–3 meses y se re-evalúa |
| **< 40** | 🔴 **Continúa en su rol actual** | El perfil actual no es compatible con el pivote en esta convocatoria. Se revisa en 6 meses |

---

## 9. INFORME EJECUTIVO Y NARRATIVA IA

Al finalizar la evaluación, el sistema utiliza un modelo de alta capacidad analítica y síntesis ejecutiva (**Gemini 3.7 Flash**) para procesar todos los datos recolectados (scores, logs de chat, tickets y comentarios del evaluador) y generar una narrativa resumida.

### Componentes del Informe

1.  **Resumen Narrativo:** Un dictamen de 2-3 párrafos que explica el perfil del candidato, integrando sus capacidades técnicas con su potencial de crecimiento.
2.  **Fortalezas Identificadas:** Listado automático de los puntos donde el candidato sobresalió según los percentiles de la evaluación.
3.  **Brechas Técnicas y Actitudinales:** Identificación de áreas críticas que requieren un plan de formación o nivelación antes de asumir el nuevo rol.

### Mecanismo de Resiliencia
En caso de fallo en la generación automática, la plataforma dispone de un botón de **"Regeneración Manual de Respaldo"** que fuerza la creación del informe usando modelos **Gemini Flash Lite** (`gemini-3.5-flash-lite` / `gemini-2.5-flash-lite`), garantizando que el evaluador siempre obtenga un dictamen procesable.

---

## 8. FICHA DE EVALUACIÓN INDIVIDUAL

**Nombre del Evaluado:** ___________________________
**Evaluador:** ___________________________
**Fecha:** ___________________________
**Nivel Académico:** ___________________________
**Años de experiencia en NOC / Soporte:** ___________________________
**Turno actual:** ___________________________

| Dimensión | Puntaje |
|---|---|
| A1. Infraestructura y Sistemas | / 15 |
| A2. Observabilidad y Monitoreo | / 15 |
| A3. Herramientas y Automatización | / 10 |
| A4. Pensamiento Analítico | / 10 |
| **Subtotal Técnico** | **/ 50** |
| B1. Comunicación escrita | / 7 |
| B2. Comunicación verbal | / 7 |
| B3. Orientación al cliente | / 4 |
| B4. Trabajo en equipo | / 4 |
| B5. Gestión del tiempo | / 4 |
| B6. Documentación y orden | / 4 |
| **Subtotal Habilidades Blandas** | **/ 30** |
| C1. Aprendizaje autónomo | / 5 |
| C2. Adaptabilidad al cambio | / 5 |
| C3. Aspiraciones de crecimiento | / 5 |
| C4. Tolerancia a la incertidumbre | / 5 |
| **Subtotal Actitudinal** | **/ 20** |
| IA-1. Actitud frente a la IA | / 5 |
| IA-2. Uso práctico | / 5 |
| **IA Complementario** | **/ 10** |
| **PUNTAJE TOTAL** | **/ 100** |

**Clasificación:** 🟢 Listo / 🟡 Con nivelación / 🟠 En preparación / 🔴 Continúa en su rol actual

**Puntaje IA (Complementario):** _______ / 10
**Interpretación IA:** 🔵 Acelerado / 🟣 Con acompañamiento / ⚪ Desde cero

**Fortalezas identificadas:**


**Brechas críticas a cerrar:**


**Recomendación del evaluador:**


**Firma evaluador:** ___________________________

---

## 9. CONSIDERACIONES PARA EL EVALUADOR

- La evaluación **no es un examen de conocimientos teóricos**. Prioriza evidencia de aplicación práctica sobre definiciones memorizadas.
- El candidato **no sabe que está siendo evaluado para un cambio de rol**. Mantén un tono de conversación de desarrollo profesional durante toda la entrevista.
- Las brechas técnicas en observabilidad son **esperadas y normales**. Lo que define el potencial es la base de infraestructura y la actitud.
- Un candidato con puntaje técnico bajo pero actitudinal alto **puede ser más valioso** a largo plazo que uno con alto puntaje técnico y baja disposición al cambio.
- Documenta siempre la evidencia concreta que sustenta cada puntaje asignado.
- Para B1, **revisa tickets reales en GLPI antes de la entrevista** si tienes acceso. Eso te dará contexto real antes del ejercicio escrito.
- Si el evaluador detecta potencial no capturado por el modelo, puede incluir una nota justificada en el campo de recomendación.
