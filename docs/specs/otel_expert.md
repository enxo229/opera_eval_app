Marco Metodológico y Estructura de Examen de Certificación

Observabilidad Avanzada: OpenTelemetry y Grafana Cloud

1. Niveles de Profundidad y Taxonomía de Evaluación

Para evitar un examen meramente memorístico, la evaluación se basa en la Taxonomía de Bloom adaptada a la Ingeniería de Sistemas. El nivel del candidato no se define por las preguntas que acierta, sino por el tipo de problema que es capaz de resolver y justificar.

Nivel	Categoría	Tipo de Capacidad Evaluada	Formato de Pregunta
Nivel 1	Fundacional	Identificación de conceptos, sintaxis básica, diferencia entre métricas, logs y trazas.	Opción múltiple directa, emparejamiento de conceptos.
Nivel 2	Operativo / Diagnóstico	Análisis de causa raíz, depuración de pipelines, configuración de componentes y lectura de trazas/dashboards.	Análisis de snippets de código/YAML, casos de estudio breves con logs/trazas adjuntos.
Nivel 3	Arquitectura y Optimización	Diseño de sistemas de telemetría a escala, mitigación de costos/cardinalidad, estrategias de muestreo (sampling) y cumplimiento de SLOs.	Escenarios de arquitectura compleja, evaluación de trade-offs, optimización de pipelines.

2. Dominios de Conocimiento y Ponderación

El examen se divide en 4 dominios interconectados:

+-------------------------------------------------------------------------+
|                    DOMINIOS DE LA CERTIFICACIÓN                         |
+-------------------------------------------------------------------------+
| [D1] Estándar OpenTelemetry (OTel)                    | 30% del examen  |
| [D2] Plataforma y Ecosistema Grafana Cloud            | 30% del examen  |
| [D3] Arquitectura de Telemetría, Cardinalidad y Costos| 20% del examen  |
| [D4] Prácticas SRE: SLOs, Alertas y Diagnóstico       | 20% del examen  |
+-------------------------------------------------------------------------+


3. Matriz Detallada de Temáticas por Dominio

Dominio 1: Estándar OpenTelemetry (OTel) — [Ponderación: 30%]

• 1.1 API vs. SDK: Separación de conceptos, inyección de dependencias, instrumentación automática vs. manual.

• 1.2 Propagación de Contexto: Formatos W3C Trace Context, B3, propagación in-process e inter-process, inyección y extracción de encabezados HTTP/gRPC.

• 1.3 Arquitectura de OTel Collector:

	• Componentes: Receivers, Processors, Exporters, Extensions.

	• Pipelines de datos (métricas, trazas, logs).

	• Processors clave: batch, memory_limiter, transform (OTTL), attributes, tail_sampling.

• 1.4 Protocolo OTLP: Estructura de paquetes gRPC vs. HTTP/JSON, serialización Protobuf, reintentos y backoff.

• 1.5 Perfiles de Telemetría (Profiling): Integración de OpenTelemetry eebpf/profiling (OpenProfile).

Dominio 2: Ecosistema Grafana Cloud — [Ponderación: 30%]

• 2.1 Grafana Alloy / Grafana Agent: Arquitectura orientada a componentes, flujo de datos (Flow mode), integración con OTel y Prometheus.

• 2.2 Motor de Métricas (Grafana Mimir / Prometheus):

	• PromQL avanzado (funciones de tasa, agregación sobre tiempo, vectores instantáneos vs. de rango).

	• Prometheus Remote Write (v1 y v2).

• 2.3 Motor de Logs (Grafana Loki):

	• LogQL (filtros de etiquetas, parsing JSON/Logfmt, métricas derivadas de logs).

	• Modelo de indexación (labels vs. texto plano) y su impacto en rendimiento.

• 2.4 Motor de Trazas (Grafana Tempo):

	• Búsqueda mediante TraceQL.

	• Ingesta masiva, generación de métricas desde trazas (Span Metrics / Service Graphs).

• 2.5 Profiling Continuo (Grafana Pyroscope): Lectura e interpretación de Flamegraphs (CPU, Allocations, Mutex).

Dominio 3: Arquitectura, Muestreo y Gestión de Cardinalidad — [Ponderación: 20%]

• 3.1 Control de Cardinalidad de Métricas:

	• Identificación de etiquetas explosivas (high-cardinality metrics).

	• Reglas de agregación y filtrado en OTel Collector y Mimir (Relabeling).

• 3.2 Estrategias de Muestreo de Trazas (Sampling):

	• Head-based Sampling (SDK): Ventajas, limitaciones y algoritmos (Probabilistic, Rate Limiting).

	• Tail-based Sampling (Collector): Configuración, aglutinamiento de trazas completas (trace ID routing), reglas complejas por error/latencia.

• 3.3 Optimización de Costos en Cloud: Estrategias de retención de logs, métricas sintéticas y compresión de datos.

Dominio 4: SRE, SLOs y Respuesta a Incidentes — [Ponderación: 20%]

• 4.1 Métricas de Servicio: SLI (Indicadores), SLO (Objetivos), SLA (Acuerdos) y Error Budgets.

• 4.2 Cálculo de Burn Rate: Alertas basadas en la velocidad de consumo del presupuesto de error (Multi-window, Multi-burn-rate).

• 4.3 Alertas Unificadas en Grafana: Integración de Grafana Alerting con Alertmanager, agrupamiento, silencio, enrutamiento de notificaciones.

• 4.4 Diagnóstico Cruzado (Correlación): Navegación fluida Trace -> Log -> Metric -> Flamegraph utilizando derivados y vínculos (Data Links / Derived Fields).

4. Rúbrica Global de Evaluación de Candidatos

La calificación final no solo otorga un puntaje porcentual, sino una clasificación de perfil técnico:

[0% - 59%]   ---> No Acreditado (Carece de fundamentos teóricos o prácticos básicos)
[60% - 74%]  ---> Nivel Junior / Asociado (Ejecuta configuraciones guiadas, opera dashboards)
[75% - 89%]  ---> Nivel Especialista / Senior (Diseña pipelines, depura problemas complejos, gestiona SLOs)
[90% - 100%] ---> Nivel Arquitecto / Principal (Optimiza arquitectura global, controla costos a gran escala, escala OTel/Grafana)


Rúbrica Detallada por Criterio de Dominio:

Criterio / Nivel	Insuficiente (<60%)	Junior (60%-74%)	Senior (75%-89%)	Arquitecto (90%-100%)
OpenTelemetry (OTel)	Confunde la API con el SDK. No comprende la estructura de un pipeline en OTel Collector.	Configura receivers y exporters básicos. Entiende la propagación de contexto pero le cuesta depurar pérdidas de trazas.	Escribe reglas complejas de OTTL (Transform Processor). Configura Tail Sampling distribuido correctamente.	Diseña la topología de desplegado de Collectors (Agent vs. Gateway) para soportar millones de eventos/seg.
Grafana Cloud	Solo crea paneles estáticos. No comprende la sintaxis de PromQL o LogQL.	Construye dashboards funcionales. Escribe consultas PromQL básicas y filtrados simples en LogQL.	Utiliza TraceQL para correlacionar problemas. Construye métricas a partir de logs y trazas (Span Metrics).	Optimiza la estructura de indexación en Loki/Mimir. Reduce costos reestructurando ingestion pipelines.
Cardinalidad y Muestreo	Desconoce el impacto de agregar variables de alta cardinalidad como etiquetas.	Entiende qué es la alta cardinalidad pero no sabe cómo mitigarla técnicamente en los colectores.	Aplica reglas de relabeling y drop de métricas. Implementa Head-based y Tail-based sampling.	Diseña políticas globales de retención, muestreo dinámico y agregación de métricas en borde antes de la ingesta.
SRE y Diagnóstico	Confunde SLI con SLO. Crea alertas basadas únicamente en umbrales estáticos simples.	Configura SLOs básicos. Entiende el concepto de Error Budget.	Configura alertas de Burn Rate multi-ventana. Crea correlaciones complejas mediante Data Links.	Define la estrategia global de observabilidad de la organización, integrando monitoreo sintético, RUM y profiling.

5. Ejemplos de Preguntas Diseñadas por Nivel de Profundidad

Para ilustrar cómo se diferencia la profundidad del conocimiento, se presenta el siguiente problema evaluado en tres niveles:

Temática: Muestreo de Trazas (Tail-based Sampling vs. Head-based Sampling)

Pregunta Nivel 1 (Fundacional)

> ¿En qué componente de una arquitectura de observabilidad basada en OpenTelemetry se ejecuta típicamente el Tail-based Sampling?

> A) En el SDK de OpenTelemetry dentro de la aplicación.
B) En el balanceador de carga de la infraestructura Cloud.
C) En el OpenTelemetry Collector (modo Gateway).
D) En el motor de almacenamiento (Grafana Tempo).

> Respuesta correcta: C
Evaluación: Mide la comprensión teórica de la ubicación del componente dentro de la arquitectura.

Pregunta Nivel 2 (Operativo / Diagnóstico)

> Un microservicio crítico experimenta un pico de latencia en el 1% de sus peticiones HTTP. La aplicación está configurada con un SDK de OTel usando TraceIdRatioBasedSampler(0.1) (10%). Al revisar Grafana Tempo, el equipo no logra encontrar las trazas asociadas a las peticiones lentas.

> ¿Por qué ocurre este problema y cuál es la solución operativa recomendada?

> A) El motor Grafana Tempo está descartando las trazas por falta de memoria; se debe aumentar el buffer de ingesta.
B) El muestreo Head-based en el SDK tomó la decisión de descarte al inicio de la traza sin saber que la petición sería lenta. Se debe migrar a Tail-based Sampling en el OTel Collector evaluando la duración del span.
C) El protocolo OTLP/gRPC perdió los paquetes por saturación de red; se debe cambiar la exportación a HTTP/JSON.
D) El SDK no propagó el encabezado traceparent; se debe forzar el uso del formato B3.

> Respuesta correcta: B
Evaluación: Mide la capacidad de diagnosticar por qué una configuración de muestreo específica falla en un escenario real de fallos intermitentes.

Pregunta Nivel 3 (Arquitectura y Optimización)

> Dada la siguiente configuración del tail_sampling processor en un OpenTelemetry Collector:

> [yaml]
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


> Al desplegar esta configuración en un cluster de Kubernetes con 5 réplicas del OTel Collector colocadas detrás de un Service (Round-Robin), el equipo observa que las trazas distribuidas entre múltiples microservicios aparecen "incompletas" o "rotas" en Grafana Tempo.

> Identifique la falla arquitectónica fundamental y la solución requerida para corregir el pipeline.

> A) El parámetro num_traces es demasiado bajo para el volumen de datos; debe incrementarse a 100,000.
B) El procesador tail_sampling no soporta la evaluación del atributo status_code; se debe usar un script en OTTL.
C) Las peticiones se están distribuyendo aleatoriamente entre los 5 Collectors. Como un único Collector no recibe todos los spans de una misma traza, el Tail-based Sampling toma decisiones con información incompleta. Se debe implementar un Load-balancing Exporter previo que enrute las trazas por trace_id hacia el mismo Collector.
D) La política drop_healthchecks tiene invert_match: true, lo que causa que se descarten todas las peticiones excepto las de salud. Se debe cambiar a false.

> Respuesta correcta: C
Evaluación: Mide la capacidad del candidato para entender las implicaciones de estado (stateful vs stateless) en arquitecturas distribuidas de telemetría y escalar correctamente un pipeline de OTel.