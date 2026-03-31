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
    { id: 'A1.1', name: 'Administración básica de Linux' },
    { id: 'A1.2', name: 'Administración básica de Windows Server' },
    { id: 'A1.3', name: 'Fundamentos de redes' },
    { id: 'A1.4', name: 'Conocimiento de contenedores' },
    { id: 'A1.5', name: 'Conocimiento de Cloud' },
]

export const A2_SUBS = [
    { id: 'A2.1', name: 'Monitoreo vs Observabilidad', desc: 'Diferencia entre monitoreo reactivo y observabilidad proactiva' },
    { id: 'A2.2', name: 'Tres Pilares', desc: 'Métricas, Logs y Trazas' },
    { id: 'A2.3', name: 'Dashboards', desc: 'Navegación, lectura de dashboards, filtros básicos' },
    { id: 'A2.4', name: 'Búsqueda de Logs', desc: 'Filtros por campo y rango de tiempo' },
    { id: 'A2.5', name: 'Interpretación de Alertas', desc: 'Interpretar una alerta y proponer primeros pasos' },
]

export const A3_SUBS = [
    { id: 'A3.1', name: 'Git Básico', desc: 'Clonar, crear rama, commit, push' },
    { id: 'A3.2', name: 'Scripting', desc: 'Leer y ejecutar scripts Bash/Python' },
    { id: 'A3.3', name: 'Gestión ITSM', desc: 'Registrar, categorizar y escalar tickets' },
    { id: 'A3.4', name: 'Documentación', desc: 'Documentar procedimientos en wikis/Confluence' },
]

export const A4_SUBS = [
    { id: 'A4.1', name: 'Identificación de Fuentes', desc: 'Identifica fuentes relevantes (logs, métricas, estados)' },
    { id: 'A4.2', name: 'Lógica de Investigación', desc: 'Propone una secuencia lógica y coherente' },
    { id: 'A4.3', name: 'Diagnóstico y Resolución', desc: 'Diferencia entre síntoma y causa raíz' },
]
