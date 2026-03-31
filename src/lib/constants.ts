/**
 * Shared constants across the application.
 */

/** Available observability tool options for A2 evaluation */
export const TOOL_OPTIONS = [
    { value: 'Grafana', label: 'Grafana' },
    { value: 'Elasticsearch/Kibana', label: 'Elasticsearch / Kibana' },
    { value: 'Zabbix', label: 'Zabbix' },
    { value: 'Dynatrace', label: 'Dynatrace' },
    { value: 'Datadog', label: 'Datadog' },
    { value: 'Otra herramienta de monitoreo', label: 'Otra' },
] as const

/** Education level display labels */
export const EDUCATION_LABELS: Record<string, string> = {
    bachiller: 'Bachiller',
    tecnico_sena: 'Técnico SENA',
    tecnologo: 'Tecnólogo',
    profesional: 'Profesional / Ingeniería',
}
