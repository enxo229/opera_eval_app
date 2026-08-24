export const RUBRIC_SCALE = [
    { level: 0, label: 'Sin conocimiento', desc: 'No conoce el concepto ni ha tenido contacto' },
    { level: 1, label: 'Básico', desc: 'Ha escuchado el concepto, puede describirlo pero no lo ha aplicado' },
    { level: 2, label: 'Funcional', desc: 'Lo ha aplicado en contexto real con supervisión' },
    { level: 3, label: 'Autónomo', desc: 'Lo aplica sin supervisión y puede explicarlo a otros' },
]

export const SCORE_COLORS = [
    { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-300', barBg: 'bg-red-100' },
    { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-300', barBg: 'bg-orange-100' },
    { bg: 'bg-emerald-700', text: 'text-emerald-700', ring: 'ring-emerald-300', barBg: 'bg-emerald-100' },
    { bg: 'bg-green-400', text: 'text-green-500', ring: 'ring-green-300', barBg: 'bg-green-100' },
]

export const TOTAL_COLORS = [
    { bg: 'bg-red-500', border: 'border-red-200', fill: 'bg-red-50', text: 'text-red-600', label: 'Nivel bajo' },
    { bg: 'bg-orange-500', border: 'border-orange-200', fill: 'bg-orange-50', text: 'text-orange-600', label: 'Nivel básico' },
    { bg: 'bg-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-50', text: 'text-emerald-700', label: 'Nivel funcional' },
    { bg: 'bg-green-400', border: 'border-green-200', fill: 'bg-green-50', text: 'text-green-500', label: 'Nivel autónomo' },
]

export const A1_SUBS = [
    { id: 'A1.1', name: 'Linux Filesystem & Permisos' },
    { id: 'A1.2', name: 'Linux Procesos & Systemctl' },
    { id: 'A1.3', name: 'Linux Logs & Troubleshooting' },
    { id: 'A1.4', name: 'Fundamentos Cloud Computing' },
    { id: 'A1.5', name: 'AWS Core Services & Seguridad' },
]

export const A1_SUBS_OTEL = [
    { id: 'A1.1', name: 'Arquitectura OTel & Contexto' },
    { id: 'A1.2', name: 'Collector & OTTL Pipelines' },
    { id: 'A1.3', name: 'Protocolo OTLP & Transportes' },
    { id: 'A1.4', name: 'Profiling & eBPF Telemetry' },
]

export const A2_SUBS = [
    { id: 'A2.1', name: 'Pilares de Observabilidad', desc: 'Métricas, Logs y Trazas; monitoreo proactivo' },
    { id: 'A2.2', name: 'SRE Fundamentals', desc: 'SLI, SLO, SLA y Error Budgets' },
    { id: 'A2.3', name: 'Dynatrace APM & IA', desc: 'Monitoreo de servicios, topología y Davis IA' },
    { id: 'A2.4', name: 'Grafana Dashboards', desc: 'Visualización unificada, paneles y filtros' },
    { id: 'A2.5', name: 'Interpretación de Alertas', desc: 'Análisis de severidad y primeros pasos de diagnóstico' },
]

export const A2_SUBS_OTEL = [
    { id: 'A2.1', name: 'Grafana Alloy Flow Mode', desc: 'Arquitectura por componentes y pipelines declarativos' },
    { id: 'A2.2', name: 'Mimir & Loki (PromQL/LogQL)', desc: 'Agregaciones PromQL y parseo de logs con LogQL' },
    { id: 'A2.3', name: 'Tempo & Pyroscope (TraceQL/Profiling)', desc: 'Búsqueda TraceQL y visualización de Flamegraphs en Pyroscope' },
]

export const A3_SUBS = [
    { id: 'A3.1', name: 'Control de Versiones Git', desc: 'Branches, commits estructurados, push y colaboración' },
    { id: 'A3.2', name: 'Pandas: Carga y Filtrado', desc: 'Lectura de datasets y filtrado condicional de series de tiempo' },
    { id: 'A3.3', name: 'Pandas: Agregaciones & Anomalías', desc: 'Groupby, percentiles y detección de degradaciones/errores' },
]

export const A3_SUBS_OTEL = [
    { id: 'A3.1', name: 'Análisis de Pipeline & Muestreo', desc: 'Análisis de la lógica de tail_sampling y políticas de decisión' },
    { id: 'A3.2', name: 'Reglas OTTL & Procesamiento', desc: 'Renombrado y transformación de atributos con reglas OTTL en transform processor' },
]

export const A4_SUBS = [
    { id: 'A4.1', name: 'Identificación de Fuentes', desc: 'Identifica fuentes relevantes (logs, métricas, traces APM)' },
    { id: 'A4.2', name: 'Lógica de Investigación', desc: 'Propone una secuencia lógica y coherente de aislamiento' },
    { id: 'A4.3', name: 'Diagnóstico y Resolución', desc: 'Diferencia síntoma de causa raíz y propone solución' },
]
