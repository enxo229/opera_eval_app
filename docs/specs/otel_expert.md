# ESPECIFICACIÓN TÉCNICA Y MARCO METODOLÓGICO: TRACK SRE EXPERTO EN OPENTELEMETRY & GRAFANA CLOUD

> **Proyecto**: OTP (Observability Talent Pivot)  
> **Perfil Evaluativo**: `otel_expert`  
> **Área**: SRE, Observabilidad Enterprise & Telemetría Distribuida  
> **Fuente de Verdad**: `docs/specs/otel_expert.md`

---

## 1. Propósito y Enfoque de Evaluación

Este documento establece la estructura metodológica, rúbricas y matriz de contenidos para el track de evaluación **"SRE Experto en OpenTelemetry & Grafana Cloud"** dentro de la plataforma OTP.

La evaluación se basa en la **Taxonomía de Bloom** adaptada a la ingeniería de sistemas:
- **Nivel 1 (Fundacional)**: Identificación de conceptos clave, arquitectura básica y sintaxis.
- **Nivel 2 (Operativo / Diagnóstico)**: Análisis de causa raíz, depuración de pipelines OTel, sintaxis PromQL/LogQL/TraceQL y lectura de dashboards.
- **Nivel 3 (Arquitectura y Optimización)**: Diseño de pipelines a escala, estrategias de sampling (Head vs. Tail), control de cardinalidad, optimización de costos en Grafana Cloud y gestión de SLOs/Error Budgets.

---

## 2. Dominios de Conocimiento y Ponderación Metodológica

El conocimiento técnico de este perfil se organiza en 4 dominios interconectados:

| Dominio | Ponderación | Temáticas Clave |
|---|---|---|
| **[D1] Estándar OpenTelemetry (OTel)** | 30% | API vs. SDK, W3C Trace Context, OTel Collector (Receivers, Processors, Exporters), OTLP, Profiling eBPF |
| **[D2] Plataforma y Ecosistema Grafana Cloud** | 30% | Grafana Alloy (Flow mode), Mimir (PromQL), Loki (LogQL), Tempo (TraceQL), Pyroscope (Flamegraphs) |
| **[D3] Arquitectura, Muestreo y Cardinalidad** | 20% | High-cardinality relabeling, Head vs. Tail Sampling, OTTL (Transform Processor), Optimización de costos Cloud |
| **[D4] Prácticas SRE, SLOs y Alertas** | 20% | SLI/SLO/SLA, Error Budget Burn Rate multi-ventana, Grafana Alerting, Correlación cruzada (Metric-Log-Trace-Profile) |

---

## 3. Estrategia de Evaluación, Dimensiones (A, B, C) y Presupuesto de Tiempo (60 min)

La evaluación se completa en un tiempo exacto de **60 minutos**, consta **únicamente de preguntas con respuesta abierta / justificada** (0 selección múltiple) y omite la Dimensión D (IA) para concentrarse en las 3 dimensiones principales:

### Ponderación de Dimensiones (100 Puntos Totales)
- **Dimensión A — Evaluación Técnica (50 Puntos / 50%)**: Módulos A1, A2, A3, A4.
- **Dimensión B — Competencias Blandas & Incidentes (30 Puntos / 30%)**: Módulos B1-B6.
- **Dimensión C — Fit Cultural & Filosofía SRE (20 Puntos / 20%)**: Módulos C1-C4.

---

### Presupuesto de Tiempo Humano Realista (60 Minutos)

Basado en la tasa estándar de redacción técnica (~35 palabras/minuto), un ingeniero humano redacta una respuesta justificada (~60–90 palabras) en ~3.5 a 4.0 minutos. El tiempo se distribuye así:

| Módulo OTP | Formato de Evaluación | Cantidad / Ítems | Tiempo Sugerido | Justificación Humana |
|---|---|---|---|---|
| **A1: Fundamentos OTel & Grafana** | Respuestas abiertas redactadas | 4 preguntas abiertas | 14 min | ~3.5 min/pregunta (API vs SDK, W3C, Collector). |
| **A2: Herramientas Grafana Stack** | Respuestas abiertas situacionales | 3 preguntas abiertas | 12 min | ~4 min/pregunta (PromQL, LogQL, TraceQL, Alloy). |
| **A3: Configuración & CLI** | Análisis YAML / OTTL + CLI | 1 ejercicio con 2 preguntas | 10 min | Inspección de pipeline `tail_sampling` / OTTL en editor. |
| **A4: Caso Práctico Incidente** | Chat interactivo de causa raíz | 1 caso con chatbot | 10 min | Lectura de telemetría y diagnóstico conversacional. |
| **B1: Ticket de Incidente SRE** | Redacción de Ticket & Handoff | 1 formulario de ticket | 7 min | Impacto en SLO, causa raíz y mitigación. |
| **B2-B6 & C1-C4** | Fit Cultural & Colaboración | Secciones de validación | 5 min | Colaboración Blameless y cultura de SLOs. |
| **Margen Inicial / Setup** | Onboarding & Instrucciones | — | 2 min | Inicio del examen. |
| **TOTAL** | **Respuestas 100% Abiertas** | **~10 Actividades** | **60 MINUTOS** | **~5.8 min/ítem principal**, garantizando finalización humana holgada. |

---

## 4. Detección de Contenido Generado por IA y Seguridad Anti-Copiar/Pegar

### 4.1 Motor de Probabilidad de IA (AI Likelihood 0% - 100%)
- Cada respuesta abierta del candidato es analizada en segundo plano por el motor de evaluación para calcular el porcentaje de probabilidad (`0% a 100%`) de que la respuesta haya sido redactada por un modelo de lenguaje (LLM).
- **Regla de Presentación**: El puntaje de probabilidad de IA se renderizará **exclusivamente en la interfaz gráfica del Dashboard del Evaluador** con insignias (*Badges*):
  - `0% - 29%`: **Probabilidad IA Baja** (Verde)
  - `30% - 69%`: **Probabilidad IA Media** (Amarillo)
  - `70% - 100%`: **⚠️ Probabilidad IA Alta** (Rojo animado)
- **Exclusión**: Este puntaje **NO** se incluye en el reporte ejecutivo oficial en PDF.

### 4.2 Restricciones de Seguridad & Contador de Bypass (`bypass_paste_count`)
- Las tarjetas con enunciados de preguntas aplican la clase CSS `select-none` y bloquean la copia.
- Los campos de texto del candidato bloquean los eventos `onPaste`, `onCopy`, `onCut` y `onContextMenu`.
- Cada intento de pegar o usar combinaciones de teclado bloqueadas se registra como evento telemétrico `SECURITY_AUDIT` en `dynamic_tests` e incrementa atómicamente el contador `bypass_paste_count` en `evaluations`.
- El encabezado del candidato en la vista del evaluador muestra en vivo el total acumulado (`Intentos de Pegado Detectados`) para auditar la conducta técnica.

### 4.3 Auditoría de Evidencias Post-Examen & Herramientas del Evaluador
- **Visibilidad Integral en Reporte Final (`/evaluator/report/[id]`)**: El informe final presenta la redacción completa del ticket B1 (incluyendo el caso de incidente asignado, la justificación de impacto en SLO y la probabilidad de IA), así como las respuestas situacionales de B2 y las reflexiones culturales de Dimensión C (C1, C2) bajo cada fila de rúbrica.
- **Herramientas de Evaluación Reactivas por Sección**: Tanto en Dimensión B como en Dimensión C, el evaluador cuenta con controles in-place de:
  - **Refrescar**: Consulta y sincroniza las respuestas del candidato sin recargar la página.
  - **Re-evaluar con IA**: Invoca rúbricas especializadas en SRE/OTel y actualiza las sugerencias de puntaje y feedback.
  - **Aplicar Sugerencias IA**: Carga automáticamente las sugerencias de la IA en los selectores de puntaje de la rúbrica.
  - **Resetear Sección**: Permite reiniciar respuestas o re-intentar submódulos de manera aislada sin afectar otras dimensiones.

---

## 5. Matriz Detallada de Temáticas por Dominio

### Dominio 1: Estándar OpenTelemetry (OTel) [Ponderación: 30%]
- **1.1 API vs. SDK**: Separación conceptual, inyección de dependencias, instrumentación automática vs. manual.
- **1.2 Propagación de Contexto**: Formatos W3C Trace Context, B3, propagación in-process e inter-process, encabezados HTTP/gRPC.
- **1.3 Arquitectura de OTel Collector**: Receivers, Processors (`batch`, `memory_limiter`, `transform`/OTTL, `attributes`, `tail_sampling`), Exporters, Extensions.
- **1.4 Protocolo OTLP**: gRPC vs. HTTP/JSON, serialización Protobuf, reintentos y backoff exponencial.
- **1.5 Perfiles de Telemetría (Profiling)**: OpenTelemetry eBPF profiling (OpenProfile).

### Dominio 2: Ecosistema Grafana Cloud [Ponderación: 30%]
- **2.1 Grafana Alloy / Agent**: Arquitectura orientada a componentes (Flow mode), integración OTel/Prometheus.
- **2.2 Motor de Métricas (Grafana Mimir / Prometheus)**: PromQL avanzado (rate, irate, vector instantáneo vs. rango, agregación temporal), Remote Write v1/v2.
- **2.3 Motor de Logs (Grafana Loki)**: LogQL (label filters, parsers `json`/`logfmt`, unwrap, métricas derivadas), estrategias de indexación.
- **2.4 Motor de Trazas (Grafana Tempo)**: TraceQL, generación de métricas desde trazas (Span Metrics / Service Graphs).
- **2.5 Profiling Continuo (Grafana Pyroscope)**: Lectura e interpretación de Flamegraphs (CPU, Allocations, Mutex).

### Dominio 3: Arquitectura, Muestreo y Gestión de Cardinalidad [Ponderación: 20%]
- **3.1 Control de Cardinalidad**: Identificación de etiquetas de alta cardinalidad, relabeling y drop de métricas en Collector/Mimir.
- **3.2 Estrategias de Muestreo (Sampling)**:
  - *Head-based Sampling (SDK)*: Algoritmos probabilísticos y rate limiting.
  - *Tail-based Sampling (Collector)*: Aglutinamiento de trazas completas (trace ID routing), evaluación de decisiones por latencia/error.
- **3.3 Optimización de Costos Cloud**: Políticas de retención, métricas sintéticas y compresión.

### Dominio 4: Prácticas SRE, SLOs y Respuesta a Incidentes [Ponderación: 20%]
- **4.1 Métricas de Servicio**: SLI, SLO, SLA y Error Budgets.
- **4.2 Cálculo de Burn Rate**: Alertas por consumo de error budget (Multi-window, Multi-burn-rate).
- **4.3 Alertas Unificadas**: Grafana Alerting, Alertmanager, agrupamiento, silencios y enrutamiento.
- **4.4 Diagnóstico Cruzado**: Navegación fluida Trace → Log → Metric → Flamegraph mediante Derived Fields / Data Links.

---

## 6. Rúbrica Global de Clasificación Técnica (Escala Oficial 100 Puntos)

| Rango de Puntaje | Clasificación Final | Código Color | Descripción del Perfil Técnico |
|---|---|---|---|
| **$\ge 80$ pts** | **Nivel Experto / Staff SRE** | `#10B981` (Verde) | Diseña topologías globales de telemetría (Agent/Gateway), optimiza pipelines Alloy/Collector, domina PromQL/LogQL/TraceQL, configura Tail Sampling distribuido, lidera incidentes P1 y defiende SLOs/Error Budgets con cultura blameless. |
| **$60 - 79$ pts** | **Nivel Avanzado / SRE Autónomo** | `#F59E0B` (Amarillo) | Sólida solvencia práctica para operar el stack LGTM y OTel; resuelve fallas e incidentes con autonomía y requiere acompañamiento menor en optimizaciones complejas de cardinalidad o tuning fino. |
| **$40 - 59$ pts** | **Nivel Intermedio / SRE en Desarrollo** | `#F97316` (Naranja) | Comprende fundamentos conceptuales de observabilidad y métricas de servicio, pero evidencia brechas en resolución de fallas en producción, sintaxis OTTL o correlación multidimensional. |
| **$< 40$ pts** | **No Cumple Perfil Experto** | `#EF4444` (Rojo) | Brechas críticas en los pilares fundamentales del stack (OpenTelemetry, Grafana Cloud, SRE). No demuestra los conocimientos mínimos requeridos para el cargo. |

---

## 7. Rúbrica Detallada por Criterio de Dominio

| Criterio | Insuficiente (<60%) | Junior (60%-74%) | Senior (75%-89%) | Arquitecto (90%-100%) |
|---|---|---|---|---|
| **OpenTelemetry (OTel)** | Confunde API con SDK. Desconoce la estructura de un pipeline OTel. | Configura receivers/exporters básicos. Entiende propagación de contexto. | Escribe reglas complejas en OTTL. Configura Tail Sampling distribuido. | Diseña la topología multi-cluster (Agent vs Gateway) para millones de eventos/seg. |
| **Grafana Cloud** | Paneles estáticos únicamente. No conoce PromQL ni LogQL. | Dashboards funcionales. PromQL básico y filtrados simples en LogQL. | Usa TraceQL para correlación. Crea Span Metrics desde trazas. | Optimiza la indexación en Loki/Mimir y reduce costos reestructurando pipelines. |
| **Cardinalidad y Muestreo** | Ignora el impacto de alta cardinalidad en etiquetas. | Entiende el concepto de alta cardinalidad pero no sabe mitigarla en colectores. | Aplica reglas de relabeling/drop. Implementa Head y Tail sampling. | Diseña políticas globales de retención y agregación en borde antes de ingesta. |
| **SRE y Diagnóstico** | Confunde SLI con SLO. Alertas estáticas simples. | Configura SLOs básicos y entiende el concepto de Error Budget. | Alertas Burn Rate multi-ventana. Correlación fluida con Data Links. | Define la estrategia global de observabilidad integrando RUM, Sintéticos y Profiling. |