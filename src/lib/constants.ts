/**
 * Shared constants across the application.
 */

/** Available observability tool options for A2 evaluation */
export const TOOL_OPTIONS = [
    { value: 'Dynatrace', label: 'Dynatrace' },
    { value: 'Grafana', label: 'Grafana' },
    { value: 'AWS CloudWatch', label: 'AWS CloudWatch' },
    { value: 'Datadog', label: 'Datadog' },
    { value: 'Zabbix', label: 'Zabbix' },
    { value: 'Otra herramienta de observabilidad', label: 'Otra' },
] as const

/** Education level display labels */
export const EDUCATION_LABELS: Record<string, string> = {
    bachiller: 'Bachiller',
    tecnico_sena: 'Técnico SENA',
    tecnologo: 'Tecnólogo',
    profesional: 'Profesional / Ingeniería',
}
