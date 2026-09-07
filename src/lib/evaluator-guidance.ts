/**
 * Guía estática de referencia para el evaluador en Dimensión A (A1, A2, A3 y A4).
 * Incluye conceptos clave, respuestas esperadas ("✅ Esperado:") y rúbrica 0-3
 * tanto para el perfil general (Junior Observabilidad) como para el perfil otel_expert (SRE Experto).
 * 
 * Separado de ai.ts porque archivos 'use server' solo pueden exportar funciones async.
 */

// ==========================================
// A1: FUNDAMENTOS / ARQUITECTURA OTEL
// ==========================================

export const A1_EVALUATOR_GUIDANCE: Record<string, { title: string; content: string }> = {
  'A1.1': {
    title: '📋 Guía para el evaluador — Linux Filesystem & Permisos',
    content: `Criterios esperados en navegación, permisos y estructura de directorios:
• Estructura estándar:
  ✅ Esperado: Conoce rutas críticas como /var/log (logs del sistema/servicios), /etc (archivos de configuración) y /tmp.
• Permisos y Comandos:
  ✅ Esperado: Identifica comandos esenciales: ls -la, chmod (cambio de permisos rwx numérico 755/644 o simbólico u+x), chown (cambio de usuario/propietario y grupo).
• Comprensión operativa:
  Explica cómo verificar permisos y solucionar problemas típicos de 'Permission denied'.

Escala:
- 1 (Básico): Menciona comandos de forma aislada sin explicar bien la lógica de permisos.
- 2 (Funcional): Explica permisos rwx y sabe cómo verificar y cambiar permisos/rutas.
- 3 (Autónomo): Precisión técnica total en estructura, permisos octales/simbólicos y buenas prácticas de seguridad.`,
  },
  'A1.2': {
    title: '📋 Guía para el evaluador — Linux Procesos & Servicios',
    content: `Criterios esperados en gestión de procesos y servicios del sistema:
• Monitoreo y Localización:
  ✅ Esperado: Uso de ps aux, top o htop para identificar procesos que consumen recursos excesivos y ubicar su PID.
• Señales de Terminación:
  ✅ Esperado: Diferencia entre terminación limpia (kill / SIGTERM -15) y forzada (kill -9 / SIGKILL).
• Gestión de Servicios (systemd):
  ✅ Esperado: Uso de systemctl (status, start, stop, restart) para diagnosticar servicios caídos.

Escala:
- 1 (Básico): Conoce top o kill pero no distingue entre señales ni comandos de servicios.
- 2 (Funcional): Identifica procesos por PID y sabe cómo reiniciar servicios de forma controlada.
- 3 (Autónomo): Domina el ciclo de vida del proceso, señales de Linux y diagnóstico con systemd.`,
  },
  'A1.3': {
    title: '📋 Guía para el evaluador — Linux Logs & Troubleshooting',
    content: `Criterios esperados en inspección y filtrado de logs:
• Ubicación y Fuentes:
  ✅ Esperado: Conoce /var/log (syslog, messages, auth.log) y el daemon journalctl.
• Filtrado y Seguimiento en Vivo:
  ✅ Esperado: Uso de tail -f para seguimiento en tiempo real, combinado con tuberías (pipes) y grep -i "error" para aislar incidentes.
• Paginación e Inspección:
  Manejo de less, cat o journalctl -u <servicio> -f con filtros temporales.

Escala:
- 1 (Básico): Menciona /var/log pero tiene dificultades para explicar el filtrado con comandos.
- 2 (Funcional): Utiliza tail -f y grep de forma efectiva para diagnosticar un fallo.
- 3 (Autónomo): Articulación experta combinando journalctl, expresiones de búsqueda y correlación de marcas de tiempo.`,
  },
  'A1.4': {
    title: '📋 Guía para el evaluador — Fundamentos Cloud Computing',
    content: `Criterios esperados en modelos cloud y arquitecturas distribuidas:
• Modelos de Servicio:
  ✅ Esperado: Distinción clara:
  - IaaS: Infraestructura como servicio (VMs, redes, almacenamiento administrado por el cliente, ej. EC2).
  - PaaS: Plataforma administrada para código y bases de datos (ej. Elastic Beanstalk, RDS).
  - SaaS: Software final terminado listo para consumo (ej. Office 365, Salesforce).
• Escalabilidad y Resiliencia:
  ✅ Esperado: Diferencia entre escalamiento vertical (añadir CPU/RAM a una instancia) y horizontal (sumar más instancias detrás de un balanceador).

Escala:
- 1 (Básico): Confunde IaaS con PaaS o da definiciones muy abstractas.
- 2 (Funcional): Explica correctamente los 3 modelos con ejemplos prácticos y entiende el escalado.
- 3 (Autónomo): Análisis profundo de ventajas, trade-offs de costos y resiliencia en nube.`,
  },
  'A1.5': {
    title: '📋 Guía para el evaluador — AWS Core Services & Seguridad',
    content: `Criterios esperados en servicios esenciales de AWS y modelo de seguridad:
• Servicios Fundamentales:
  ✅ Esperado: Conoce el propósito de cómputo (EC2), almacenamiento de objetos durable (S3) y observabilidad/alarmas (CloudWatch).
• Modelo de Responsabilidad Compartida:
  ✅ Esperado: "AWS es responsable de la seguridad DE la nube (hardware, centros de datos, red física); el cliente es responsable de la seguridad EN la nube (datos, parches de sistema operativo, Security Groups, accesos IAM)."

Escala:
- 1 (Básico): Conoce nombres de servicios de AWS pero no el modelo de responsabilidad compartida.
- 2 (Funcional): Explica con acierto el rol de EC2, S3, CloudWatch y los límites de responsabilidad.
- 3 (Autónomo): Claridad impecable en arquitectura AWS, políticas de seguridad y monitoreo con CloudWatch.`,
  },
}

export const A1_EVALUATOR_GUIDANCE_OTEL: Record<string, { title: string; content: string }> = {
  'A1.1': {
    title: '📋 Guía para el evaluador — Arquitectura OTel & Contexto',
    content: `A1.1 evalúa la comprensión conceptual de OpenTelemetry y propagación distribuida.
• API vs. SDK:
  ✅ Esperado: "La API de OTel provee las interfaces abstractas y no-op para instrumentar código sin acoplarse al backend; el SDK implementa la recolección, batching, muestreo y exportación de telemetría."
• Context Propagation:
  ✅ Esperado: "La propagación de contexto (W3C TraceContext) inyecta y extrae 'traceparent' y 'tracestate' en cabeceras HTTP o metadatos gRPC para correlacionar spans entre microservicios independientes."

Criterios:
- 1 (Básico): Menciona OTel pero confunde el rol de la API frente al SDK.
- 2 (Funcional): Diferencia API de SDK y explica la correlación de trazas por cabeceras.
- 3 (Experto): Dominio total de la especificación W3C, inyección/extracción de contexto y ciclo de vida de los spans.`,
  },
  'A1.2': {
    title: '📋 Guía para el evaluador — Collector & OTTL Pipelines',
    content: `A1.2 evalúa la arquitectura de pipelines en OpenTelemetry Collector.
• Componentes del Pipeline:
  ✅ Esperado: "Un pipeline se compone secuencialmente de: Receivers (ingesta de datos), Processors (filtrado, transformación, batch) y Exporters (envío hacia backends)."
• Procesamiento y Control de Cardinalidad:
  ✅ Esperado: "Para filtrar logs o métricas de error y reducir alta cardinalidad se usa filterprocessor o transformprocessor con sentencias OTTL en la sección processors."

Criterios:
- 1 (Básico): Conoce que existe un Collector pero confunde el orden o rol de los processors.
- 2 (Funcional): Identifica el pipeline correcto y señala el uso de processors para filtrar.
- 3 (Experto): Explica con precisión el comportamiento de buffers, batch processor y sintaxis OTTL para saneamiento de cardinalidad.`,
  },
  'A1.3': {
    title: '📋 Guía para el evaluador — Protocolo OTLP & Transportes',
    content: `A1.3 evalúa el protocolo estándar OpenTelemetry Protocol (OTLP).
• OTLP/gRPC vs. HTTP/JSON:
  ✅ Esperado: "gRPC utiliza HTTP/2 multiplexado y serialización binaria con Protocol Buffers (Protobuf), lo que reduce drásticamente el consumo de CPU, ancho de banda y latencia frente a HTTP/JSON."
• Resiliencia y Reintentos:
  ✅ Esperado: Manejo de backoff exponencial, códigos de estado gRPC estándar y backpressure automático.

Criterios:
- 1 (Básico): Menciona gRPC pero sin justificar el beneficio de rendimiento o serialización.
- 2 (Funcional): Explica ventajas de Protobuf, multiplexación HTTP/2 y manejo de reintentos.
- 3 (Experto): Análisis exhaustivo sobre compresión gzip/zstd, límites de buffers y conexiones streaming persistentes.`,
  },
  'A1.4': {
    title: '📋 Guía para el evaluador — Profiling & eBPF Telemetry',
    content: `A1.4 evalúa instrumentación kernel con eBPF y profiling continuo.
• Instrumentación eBPF:
  ✅ Esperado: "eBPF ejecuta programas seguros en el espacio del kernel de Linux, capturando métricas de red, sockets y CPU sin modificar el código fuente de las aplicaciones ni requerir agentes en tiempo de ejecución."
• Profiling Continuo:
  ✅ Esperado: Permite inspeccionar call-stacks (árboles de llamadas) y generar Flamegraphs continuos para optimizar cuellos de botella en producción sin degradar el rendimiento.

Criterios:
- 1 (Básico): Reconoce que eBPF corre en el kernel pero sin explicar la ventaja de no modificar código.
- 2 (Funcional): Explica el concepto de observabilidad sin código y el valor del profiling continuo.
- 3 (Experto): Demuestra conocimiento profundo de overhead, compatibilidad de kernel Linux y correlación entre Flamegraphs y spans.`,
  },
}

// ==========================================
// A2: OBSERVABILIDAD / GRAFANA STACK
// ==========================================

export const A2_EVALUATOR_GUIDANCE: Record<string, { title: string; content: string }> = {
  'A2.1': {
    title: '📋 Guía para el evaluador — Pilares de Observabilidad',
    content: `Criterios esperados en los fundamentos de observabilidad:
• Los Tres Pilares:
  ✅ Esperado:
  - Métricas: Valores numéricos agregables en el tiempo para tendencias y alertas rápidas.
  - Logs: Registros de eventos discretos con marca de tiempo y contexto textual.
  - Trazas: Recorrido distribuido de una transacción entre múltiples servicios mediante spans.
• Reactivo vs. Proactivo:
  ✅ Esperado: Monitoreo tradicional avisa cuando algo cayó (reactivo); observabilidad permite inferir el estado interno y entender la causa de fallos desconocidos (proactivo).

Escala:
- 1 (Básico): Lista métricas, logs y trazas pero sin contrastar claramente sus casos de uso.
- 2 (Funcional): Define los 3 pilares con claridad y distingue monitoreo de observabilidad.
- 3 (Autónomo): Explicación pedagógica excelente sobre correlación entre los 3 pilares.`,
  },
  'A2.2': {
    title: '📋 Guía para el evaluador — SRE Fundamentals (SLI / SLO / SLA)',
    content: `Criterios esperados en conceptos de Site Reliability Engineering:
• Diferencias Clave:
  ✅ Esperado:
  - SLI (Service Level Indicator): Métrica cuantitativa real (ej. % de requests con latencia < 300ms).
  - SLO (Service Level Objective): Meta interna acordada por el equipo (ej. 99.5% de cumplimiento del SLI).
  - SLA (Service Level Agreement): Contrato formal con el cliente con penalidades financieras.
• Error Budget:
  ✅ Esperado: Margen de fallo tolerable (100% - SLO), utilizado para balancear nuevos lanzamientos frente a estabilidad.

Escala:
- 1 (Básico): Confunde SLI con SLO o no comprende el Error Budget.
- 2 (Funcional): Diferencia con acierto los 3 términos y define el Error Budget como saldo disponible.
- 3 (Autónomo): Dominio total de la metodología SRE y gestión de incidentes con Error Budget.`,
  },
  'A2.3': {
    title: '📋 Guía para el evaluador — Dynatrace APM & Davis AI',
    content: `Criterios esperados en Application Performance Monitoring (APM):
• Detección y Monitoreo Automático:
  ✅ Esperado: OneAgent inyecta instrumentación a nivel de proceso y host sin configuración manual de código.
• Davis AI Engine:
  ✅ Esperado: Davis analiza la topología de dependencias (Smartscape) y correlaciona anomalías de métricas para aislar la causa raíz exacta de un incidente, evitando tormentas de falsas alertas.

Escala:
- 1 (Básico): Sabe que Dynatrace monitorea pero desconoce el funcionamiento de OneAgent o la IA.
- 2 (Funcional): Explica el beneficio de la detección de causa raíz y la visualización de dependencias.
- 3 (Autónomo): Detalla con fluidez cómo APM traza transacciones entre servicios y base de datos.`,
  },
  'A2.4': {
    title: '📋 Guía para el evaluador — Grafana Dashboards & Visualización',
    content: `Criterios esperados en construcción y análisis de tableros Grafana:
• Componentes y Paneles:
  ✅ Esperado: Selección de paneles adecuados (time-series para tendencias, stat para KPIs, table para desgloses).
• Variables y Filtros:
  ✅ Esperado: Uso de variables dinámicas ($environment, $service) para filtrar datos en tiempo real sin crear dashboards duplicados.
• Métricas Estadísticas:
  Comprensión de percentiles (P95, P99) frente a la media para detectar degradaciones que afectan a pocos usuarios.

Escala:
- 1 (Básico): Conoce Grafana pero no explica el uso de variables ni rangos temporales.
- 2 (Funcional): Explica cómo filtrar un tablero por microservicio y cómo interpretar percentiles.
- 3 (Autónomo): Dominio avanzado de visualización, correlación de paneles y fuentes de datos.`,
  },
  'A2.5': {
    title: '📋 Guía para el evaluador — Interpretación de Alertas',
    content: `Criterios esperados ante un escenario de alerta de producción:
• Identificación de la Alerta:
  ✅ Esperado: Reconoce el servicio afectado, la severidad y el indicador violado (ej: tasa de error 500 > 5%, latencia P95 > 3s).
• Pasos de Diagnóstico Metódico:
  ✅ Esperado:
  1) Confirmar el impacto en el dashboard del servicio y microservicios downstream.
  2) Inspeccionar logs de error filtrados en el intervalo temporal exacto de la alerta.
  3) Verificar si hubo un deploy reciente, cambio de configuración o degradación de infraestructura.

Escala:
- 1 (Básico): Da sugerencias desordenadas o propone reiniciar servidores sin investigar logs.
- 2 (Funcional): Propone un flujo ordenado de consulta de dashboards, logs y dependencias.
- 3 (Autónomo): Diagnóstico sistemático, priorización del impacto al usuario y propuesta preventiva.`,
  },
}

export const A2_EVALUATOR_GUIDANCE_OTEL: Record<string, { title: string; content: string }> = {
  'A2.1': {
    title: '📋 Guía para el evaluador — Grafana Alloy Flow Mode',
    content: `A2.1 evalúa la arquitectura declarativa de Grafana Alloy.
• Arquitectura Flow Mode:
  ✅ Esperado: "Alloy en Flow mode utiliza una sintaxis declarativa inspirada en HCL donde los componentes se conectan explícitamente mediante un grafo acíclico dirigido (DAG), permitiendo pipelines modulares y recarga dinámica sin reiniciar el agente."
• Ventajas Operativas:
  ✅ Esperado: Menor consumo de memoria, configuración granular y reutilización directa de pipelines OTel/Prometheus.

Criterios:
- 1 (Básico): Menciona Alloy pero sin detallar el modo Flow ni la conexión declarativa de componentes.
- 2 (Funcional): Explica el concepto de componentes exportados/importados y la recarga en caliente.
- 3 (Experto): Análisis profundo del diseño DAG, pipelines mixtos (OTel + Prometheus) y depuración en la UI de Alloy.`,
  },
  'A2.2': {
    title: '📋 Guía para el evaluador — Mimir & Loki (PromQL / LogQL)',
    content: `A2.2 evalúa consultas analíticas sobre métricas y logs en el stack de Grafana.
• PromQL y Contadores:
  ✅ Esperado: "Para calcular tasa de eventos por segundo se utiliza rate() sobre métricas de contador, ej: sum by (service) (rate(http_requests_total[5m]))."
• LogQL vs. SQL:
  ✅ Esperado: "LogQL no indexa el texto completo como un motor SQL tradicional; indexa streams por etiquetas ({app='billing'}) y aplica filtrado por expresiones regulares o parsers (| json, | logfmt) en tiempo de consulta, reduciendo costos de almacenamiento."

Criterios:
- 1 (Básico): Confunde rate() con increase() o desconoce los parsers de LogQL.
- 2 (Funcional): Formula la lógica de rate() y explica cómo LogQL filtra streams y extrae campos JSON.
- 3 (Experto): Dominio de agregaciones dimensionales en PromQL, optimización de queries y métricas a partir de logs en Loki.`,
  },
  'A2.3': {
    title: '📋 Guía para el evaluador — Tempo & Pyroscope (TraceQL / Profiling)',
    content: `A2.3 evalúa trazabilidad distribuida y profiling continuo.
• TraceQL en Tempo:
  ✅ Esperado: "TraceQL permite realizar búsquedas estructurales de trazas con operadores relacionales, ej: { status = error && duration > 2s } para aislar transacciones degradadas."
• Continuous Profiling & Flamegraphs:
  ✅ Esperado: "Pyroscope genera Flamegraphs continuos que muestran qué funciones o líneas de código consumen mayor tiempo de CPU o memoria, optimizando recursos cloud sin recrear cuellos de botella en laboratorio."

Criterios:
- 1 (Básico): Sabe que Tempo almacena trazas pero no conoce TraceQL ni el valor de un Flamegraph.
- 2 (Funcional): Explica consultas en TraceQL y cómo un Flamegraph ayuda a aislar consumo de CPU.
- 3 (Experto): Integración completa entre trazas (Span Metrics), perfiles de CPU y reducción de costes cloud.`,
  },
}

// ==========================================
// A3: GIT, ANALÍTICA PANDAS / OTTL PIPELINES
// ==========================================

export const A3_EVALUATOR_GUIDANCE: Record<string, { title: string; content: string }> = {
  'A3.1': {
    title: '📋 Guía para el evaluador — Control de Versiones Git',
    content: `Flujo básico esperado en Git:
• git clone <url>         → Clonar un repositorio remoto
• git checkout -b fix/xxx → Crear y cambiar a una nueva rama de trabajo
• git add <archivos>      → Pasar cambios al área de preparación (staging)
• git commit -m "..."     → Guardar un punto de control con mensaje descriptivo
• git push origin <rama>  → Publicar los commits locales en el repositorio remoto

Para nivel Junior/Entry: Es suficiente con comprender el ciclo de vida de una rama y cómo colaborar sin sobreescribir la rama principal (main).

Escala:
- 1 (Básico): Menciona comandos incompletos o ignora la creación de ramas.
- 2 (Funcional): Describe la secuencia lógica de ramas, add, commit y push.
- 3 (Autónomo): Explicación impecable del flujo colaborativo y buenas prácticas de commits.`,
  },
  'A3.2': {
    title: '📋 Guía para el evaluador — Pandas: Análisis de Datos (Interpretación de Código)',
    content: `Criterios esperados en la interpretación del script de Pandas:
• Identificación del objetivo:
  El candidato explica con claridad que el script carga métricas y aísla transacciones lentas o con error.
• Comprensión de parámetros y filtros:
  Identifica las columnas del DataFrame (ej. latency_ms, status_code) y la lógica booleana del filtro.
• Deducción del resultado:
  Calcula o deduce correctamente la salida ante los datos de prueba presentados.

Escala:
- 1 (Básico): Identifica que usa Pandas pero su explicación de las salidas es confusa.
- 2 (Funcional): Explica el objetivo y deduce las salidas con sentido común y lógica.
- 3 (Autónomo): Explicación impecable del flujo, parámetros y deducción exacta del resultado.`,
  },
  'A3.3': {
    title: '📋 Guía para el evaluador — Python: Automatización de Observabilidad',
    content: `Criterios esperados en la interpretación de la función de automatización:
• Comprensión del flujo lógico:
  Explica qué evalúa la función (umbrales de CPU/memoria o tasa de error) y cómo clasifica el estado.
• Identificación de condiciones de alerta:
  Reconoce la regla exacta que dispara el estado CRITICAL o WARNING.
• Deducción del valor retornado:
  Indica con precisión el diccionario o mensaje que retorna la función para los datos de prueba.

Escala:
- 1 (Básico): Explicación superficial o duda en la salida.
- 2 (Funcional): Comprende las condiciones if/else y deduce el estado de alerta correcto.
- 3 (Autónomo): Precisión total en la explicación de entradas, condiciones y resultado devuelto.`,
  },
}

export const A3_EVALUATOR_GUIDANCE_OTEL: Record<string, { title: string; content: string }> = {
  'A3.1': {
    title: '📋 Guía para el evaluador — Muestreo & Tail Sampling',
    content: `A3.1 evalúa la comprensión de políticas de muestreo distribuido en OTel Collector.
    
• Head-based vs. Tail-based Sampling:
  ✅ Esperado: "Head sampling decide en el SDK al inicio de la traza; Tail sampling retiene trazas en el Collector hasta completarse para evaluar latencia o errores."

• Criterios de evaluación:
  - Identifica el riesgo de Head Sampling (pérdida de trazas de error poco frecuentes).
  - Reconoce la necesidad de trace ID routing y aglutinamiento de spans en Tail Sampling.

Escala:
- 1 (Básico): Entiende que se filtra pero confunde head de tail sampling.
- 2 (Funcional): Explica que tail sampling evalúa la traza completa antes de decidir retenerla.
- 3 (Experto): Análisis detallado sobre memoria, buffers de espera y políticas probabilísticas de fondo.`,
  },
  'A3.2': {
    title: '📋 Guía para el evaluador — Reglas OTTL & Transform Processor',
    content: `A3.2 evalúa la habilidad para transformar y enriquecer telemetría con OpenTelemetry Transformation Language (OTTL).

• OTTL & Processors:
  ✅ Esperado: "OTTL permite manipular atributos de métricas, logs y trazas mediante sentencias como set(attributes["env"], "production") o replace_all_patterns."

• Criterios de evaluación:
  - Manejo de contexto (span, metric, log).
  - Control de alta cardinalidad mediante eliminación o filtrado de atributos (keep_keys).

Escala:
- 1 (Básico): Entiende que modifica datos pero no identifica los atributos afectados.
- 2 (Funcional): Explica los cambios sobre service.env/http.target y la limpieza de atributos.
- 3 (Experto): Precisión sintáctica en sentencias OTTL, contextos y protección de backends.`,
  },
}

// ==========================================
// A4: PENSAMIENTO ANALÍTICO / CHATBOT SRE
// ==========================================

export const A4_EVALUATOR_GUIDANCE: Record<string, { title: string; content: string }> = {
  'A4.1': {
    title: '📋 Guía para el evaluador — Identificación de Fuentes de Datos',
    content: `A4.1 evalúa si el candidato solicita de forma sistemática y precisa las fuentes de telemetría necesarias:
• Selección de Fuentes:
  ✅ Esperado: El candidato pide fuentes pertinentes según los síntomas: métricas de throughput/latencia del servicio afectado, logs de error HTTP 5xx con stacktraces, trazas distribuidas para identificar el span lento, y estado de recursos del contenedor o base de datos.
• Enfoque Metódico:
  Evita hacer preguntas dispersas o pedir datos irrelevantes al azar.

Escala:
- 0: No investigó o solo envió saludos / mensajes genéricos.
- 1 (Básico): Pide datos dispersos sin justificación ni relación con el problema reportado.
- 2 (Funcional): Solicita logs y métricas correctas del servicio afectado.
- 3 (Autónomo): Identificación exhaustiva y dirigida de logs, trazas y métricas clave.`,
  },
  'A4.2': {
    title: '📋 Guía para el evaluador — Lógica y Metodología de Investigación',
    content: `A4.2 evalúa la coherencia del proceso analítico de resolución de problemas (troubleshooting):
• Secuencia Lógica:
  ✅ Esperado: Sigue una metodología estructurada (ej. método USE o RED): 1) Delimita el alcance temporal y componentes afectados, 2) Valida hipótesis con datos antes de concluir, 3) Descarta capas metódicamente (código vs base de datos vs red/infra).
• Adaptabilidad:
  Ajusta sus hipótesis con base en las respuestas que el sistema simulado le proporciona.

Escala:
- 0: Sin investigación estructurada.
- 1 (Básico): Salta de una idea a otra sin contrastar la evidencia entregada.
- 2 (Funcional): Sigue un flujo coherente de causa-efecto con preguntas lógicas.
- 3 (Autónomo): Investigación ejemplar, correlación temporal de eventos y deducción analítica.`,
  },
  'A4.3': {
    title: '📋 Guía para el evaluador — Diagnóstico y Causa Raíz',
    content: `A4.3 evalúa la precisión técnica de la conclusión y las recomendaciones del candidato:
• Identificación de Causa Raíz:
  ✅ Esperado: Llega a una conclusión válida y respaldada por datos sobre la causa raíz del incidente (ej. agotamiento del pool de conexiones de base de datos, timeout en servicio dependiente, fuga de memoria tras nuevo release).
• Acciones Propuestas:
  ✅ Esperado: Propone medidas de mitigación inmediata (rollback, aumento de pool, reinicio de pods) y acciones preventivas a largo plazo (alertas preventivas, ajuste de timeouts).

Escala:
- 0: Sin diagnóstico o completamente erróneo.
- 1 (Básico): Conclusión tentativa sin aislar la causa raíz real.
- 2 (Funcional): Diagnostica correctamente el componente causante del fallo.
- 3 (Autónomo): Diagnóstico preciso, fundamentado en la evidencia del chat, con solución inmediata y preventiva.`,
  },
}

// ==========================================
// B2: COMPETENCIAS SITUACIONALES SRE (OTEL EXPERT)
// ==========================================

export const B_EVALUATOR_GUIDANCE_OTEL: Record<string, { title: string; content: string }> = {
  'B2.1': {
    title: '📋 Guía para el evaluador — Adaptabilidad & Gestión de Presión ante Incidentes',
    content: `B2.1 evalúa el balance entre la urgencia de restaurar el servicio y la preservación de telemetría para el análisis de causa raíz:
• Negociación Asertiva y Serena:
  ✅ Esperado: No cede ciegamente a la presión de reiniciar sin resguardar evidencia diagnóstica; asume liderazgo técnico y explica el costo de perder la causa raíz.
• Acciones Técnicas de Contención:
  ✅ Esperado: Propone alternativas que no destruyan la telemetría en tránsito:
  1. Aislamiento de Réplica / Drenado de Tráfico: Sacar un pod o nodo afectado del balanceador de carga para mantener su estado (heap dump, profiling o logs en memoria) mientras se reinician o escalan las demás instancias para restaurar el servicio.
  2. Flush de Buffers en OTel / Alloy: Forzar el volcado de memoria antes del reinicio o verificar que la extensión file_storage del Collector persista las colas en disco.
  3. Descarte de Capas: Si el reinicio es inminente, tomar un snapshot o exportar métricas/trazas del span en curso.

Escala:
- 1 (Básico): Cede inmediatamente al reinicio a ciegas sin resguardar datos, o sugiere solo esperar pasivamente.
- 2 (Funcional): Propone una solución intermedia pero imprecisa (ej. "guardar logs rápido antes de reiniciar").
- 3 (Autónomo): Plantea una estrategia equilibrada de mitigación (drenar tráfico, aislar una réplica o forzar flush de telemetría).
- 4 (Experto / Senior): Dominio SRE ejemplar: aislamiento de nodo para análisis forense, preservación de colas y comunicación ejecutiva asertiva.`,
  },
  'B2.2': {
    title: '📋 Guía para el evaluador — Colaboración Blameless & Resiliencia Sistémica',
    content: `B2.2 evalúa cómo el candidato gestiona errores humanos recurrentes bajo una cultura Blameless, equilibrando el apoyo empático con salvaguardas técnicas:
• Cultura Blameless y Seguridad Psicológica:
  ✅ Esperado: No señala ni recrimina al individuo; parte de la premisa SRE de que si un error manual causa una caída, el sistema carece de defensas y salvaguardas adecuadas.
• Empatía y Mentoría Técnica:
  ✅ Esperado: Diálogo constructivo y pair-programming/troubleshooting para entender la dificultad real que enfrenta el compañero.
• Salvaguardas Sistémicas y Automatización:
  ✅ Esperado: Propone soluciones técnicas para eliminar la posibilidad del error humano:
  1. Automatización en CI/CD: Linters, validaciones automáticas de sintaxis, pre-commit hooks y pruebas de despliegue automatizadas.
  2. GitOps y Despliegues Seguros: Eliminar despliegues manuales mediante pipelines declarativos con canary o blue-green releases.
  3. Observabilidad Preventiva: Dashboards y alertas tempranas en Grafana para alertar anomalías inmediatamente tras un release.
  4. Post-mortem Colaborativo: Documentación estructurada enfocada en lecciones aprendidas y mejoras de proceso.

Escala:
- 1 (Básico): Enfoque punitivo o reactivo; busca culpables o solo se queja sin proponer soluciones técnicas.
- 2 (Funcional): Muestra empatía interpersonal pero propone soluciones meramente verbales sin automatización.
- 3 (Autónomo): Buen balance: apoya al compañero y propone incorporar validaciones en CI/CD o alertas en Grafana.
- 4 (Experto / Senior): Liderazgo SRE de referencia: cultura libre de culpas, implementación integral de GitOps/guardrails automáticos y post-mortem orientado a resiliencia sistémica.`,
  },
}

