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

## 3. Mapeo a la Estructura de Evaluación de OTP (Dimensiones A, B, C, D)

Para mantener coherencia con el motor de calificación de OTP, las temáticas de OTel & Grafana Cloud se distribuyen en las 4 dimensiones de la plataforma:

### Dimensión A — Evaluación Técnica (50 Puntos Máx.)

| Módulo OTP | Formato de Evaluación | Temáticas OTel / Grafana Cloud Evaluadas | Puntaje |
|---|---|---|---|
| **A1: Fundamentos OTel & Grafana** | 5 Preguntas Q&A dinámicas asistidas por IA | Conceptos API vs SDK, W3C Trace Context, Componentes Collector, PromQL/LogQL sintáctico | 15 pts |
| **A2: Herramientas de Ecosistema** | Preguntas sobre stack seleccionado | Configuración de Grafana Alloy, Mimir, Loki, Tempo y Pyroscope | 15 pts |
| **A3: Configuración & CLI simulada** | Editor de código / YAML + Terminal CLI | Pipeline OTTL (Transform Processor), configuración `tail_sampling`, reglas de relabeling y PromQL/TraceQL queries | 10 pts (raw 12) |
| **A4: Caso Práctico de Incidente** | Chat interactivo de investigación de causa raíz | Incidente distribuido con trazas rotas/incompletas, alta cardinalidad o picos de latencia intermitentes | 10 pts (raw 9) |

### Dimensión B — Competencias Blandas & Incidentes (30 Puntos Máx.)

| Módulo OTP | Formato | Enfoque SRE | Puntaje |
|---|---|---|---|
| **B1: Ticket de Incidente SRE** | Redacción de Ticket & Handoff | Gestión de incidente crítico de observabilidad, reporte de impacto en SLO y plan de mitigación | 7 pts (raw 16) |
| **B2 - B6: Gestión de Incidentes** | Evaluación de Handoff & Colaboración | Asertividad, colaboración asíncrona, gestión de bloqueos en producción | 23 pts |

### Dimensión C — Fit Cultural & Filosofía SRE (20 Puntos Máx.)

- **C1 - C4**: Cultura Blameless Post-mortem, orientación a SLOs/Error Budgets, automatización y reducción de Toill.

### Dimensión D — Competencia en Inteligencia Artificial (10 Puntos Desempate)

- **IA-1 e IA-2**: Capacidad del candidato para construir prompts estructurados (Role, Context, Constraints, Format) aplicados al diagnóstico de telemetría distribuida.

---

## 4. Matriz Detallada de Temáticas por Dominio

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
- **2.5 Profiling Continuo (Grafana Pyroscope)**: Lectura e interpretation de Flamegraphs (CPU, Allocations, Mutex).

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

## 5. Rúbrica Global de Clasificación Técnica

| Rango de Puntaje | Clasificación Final | Descripción del Perfil Técnico |
|---|---|---|
| **90% - 100%** | **Arquitecto / Principal** | Diseña topologías globales de telemetría (Agent/Gateway), optimiza pipelines en borde, controla costos masivos y define la estrategia de observabilidad enterprise. |
| **75% - 89%** | **Especialista / Senior** | Construye consultas complejas (PromQL, LogQL, TraceQL), escribe reglas OTTL, configura Tail Sampling distribuido y gestiona alertas de Burn Rate. |
| **60% - 74%** | **Junior / Asociado** | Opera dashboards, configura receivers/exporters básicos, entiende conceptos de propagación y SLOs básicos. |
| **0% - 59%** | **No Acreditado** | Carece de fundamentos teóricos o prácticos sobre la arquitectura de OTel o el stack de Grafana Cloud. |

---

## 6. Rúbrica Detallada por Criterio de Dominio

| Criterio | Insuficiente (<60%) | Junior (60%-74%) | Senior (75%-89%) | Arquitecto (90%-100%) |
|---|---|---|---|---|
| **OpenTelemetry (OTel)** | Confunde API con SDK. Desconoce la estructura de un pipeline OTel. | Configura receivers/exporters básicos. Entiende propagación de contexto. | Escribe reglas complejas en OTTL. Configura Tail Sampling distribuido. | Diseña la topología multi-cluster (Agent vs Gateway) para millones de eventos/seg. |
| **Grafana Cloud** | Paneles estáticos únicamente. No conoce PromQL ni LogQL. | Dashboards funcionales. PromQL básico y filtrados simples en LogQL. | Usa TraceQL para correlación. Crea Span Metrics desde trazas. | Optimiza la indexación en Loki/Mimir y reduce costos reestructurando pipelines. |
| **Cardinalidad y Muestreo** | Ignora el impacto de alta cardinalidad en etiquetas. | Entiende el concepto de alta cardinalidad pero no sabe mitigarla en colectores. | Aplica reglas de relabeling/drop. Implementa Head y Tail sampling. | Diseña políticas globales de retención y agregación en borde antes de ingesta. |
| **SRE y Diagnóstico** | Confunde SLI con SLO. Alertas estáticas simples. | Configura SLOs básicos y entiende el concepto de Error Budget. | Alertas Burn Rate multi-ventana. Correlación fluida con Data Links. | Define la estrategia global de observabilidad integrando RUM, Sintéticos y Profiling. |

---

## 7. Ejemplos de Preguntas y Evaluación por Nivel

### Ejemplo 1: Nivel 1 (Fundacional)
> **Pregunta**: ¿En qué componente de una arquitectura de observabilidad basada en OpenTelemetry se ejecuta típicamente el Tail-based Sampling?  
> - A) En el SDK de OpenTelemetry dentro de la aplicación.  
> - B) En el balanceador de carga de la infraestructura Cloud.  
> - C) En el OpenTelemetry Collector (modo Gateway). *(Correcta)*  
> - D) En el motor de almacenamiento (Grafana Tempo).  
>
> **Evaluación**: Valida la comprensión teórica de la ubicación del componente dentro de la arquitectura de telemetría.

---

### Ejemplo 2: Nivel 2 (Operativo / Diagnóstico)
> **Escenario**: Un microservicio crítico presenta un pico de latencia en el 1% de sus peticiones HTTP. La aplicación está instrumentada con un SDK de OTel usando `TraceIdRatioBasedSampler(0.1)` (10%). Al revisar Grafana Tempo, el equipo no encuentra las trazas asociadas a las peticiones lentas.  
>
> **Pregunta**: ¿Por qué ocurre este problema y cuál es la solución operativa recomendada?  
> - A) Grafana Tempo descarta trazas por falta de memoria; se debe aumentar el buffer.  
> - B) El muestreo Head-based en el SDK tomó la decisión de descarte al inicio de la petición sin saber que sería lenta. Se debe migrar a Tail-based Sampling en el OTel Collector evaluando la duración del span. *(Correcta)*  
> - C) El protocolo OTLP/gRPC perdió paquetes por saturación de red; se debe cambiar a HTTP/JSON.  
> - D) El SDK no propagó el encabezado `traceparent`; se debe forzar el uso de B3.  
>
> **Evaluación**: Valida la capacidad de diagnosticar fallos causados por decisiones de sampling inadecuadas en producción.

---

### Ejemplo 3: Nivel 3 (Arquitectura y Optimización)
> **Escenario**: Dada la siguiente configuración del procesador `tail_sampling` en un OpenTelemetry Collector:
```yaml
processors:
  tail_sampling:
    decision_wait: 10s
    num_traces: 10000
    expected_new_traces_per_sec: 2000
    policies:
      [
        {
          name: drop_healthchecks,
          type: string_attribute,
          string_attribute: { key: http.target, values: [ "/health", "/metrics" ], enabled_regex_matching: false, invert_match: true }
        },
        {
          name: sample_errors,
          type: status_code,
          status_code: { status_codes: [ ERROR ] }
        }
      ]
```
> Al desplegar esta configuración en un clúster de Kubernetes con 5 réplicas del OTel Collector colocadas detrás de un Service K8s (Round-Robin), el equipo observa que las trazas distribuidas entre múltiples microservicios aparecen incompletas o fragmentadas en Grafana Tempo.  
>
> **Pregunta**: Identifique la falla arquitectónica fundamental y la solución requerida para corregir el pipeline.  
> - A) El parámetro `num_traces` es muy bajo; debe incrementarse a 100,000.  
> - B) El procesador `tail_sampling` no evalúa `status_code`; se debe usar OTTL.  
> - C) Las peticiones se distribuyen aleatoriamente entre los 5 Collectors. Como un único Collector no recibe todos los spans de una misma traza, el Tail-based Sampling toma decisiones con información incompleta. Se debe implementar un Load-balancing Exporter previo que enrute las trazas por `trace_id` hacia el mismo Collector. *(Correcta)*  
> - D) La política `drop_healthchecks` tiene `invert_match: true`, lo cual descarta todo excepto `/health`.  
>
> **Evaluación**: Evalúa la capacidad de comprender la naturaleza con estado (*stateful*) del Tail-based Sampling y escalar topologías distribuidas de colectores.