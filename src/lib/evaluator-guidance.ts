/**
 * Guía estática para el evaluador en A3 (no generada por IA).
 * Incluye comandos Git y sintaxis / conceptos clave de Pandas en Python.
 * 
 * Separado de ai.ts porque archivos 'use server' solo pueden exportar funciones async.
 */
export const A3_EVALUATOR_GUIDANCE: Record<string, { title: string; content: string }> = {
  'A3.1': {
    title: '📋 Guía para el evaluador — Control de Versiones Git',
    content: `Flujo básico esperado en Git:
• git clone <url>         → Clonar un repositorio remoto
• git checkout -b fix/xxx → Crear y cambiar a una nueva rama de trabajo
• git add <archivos>      → Pasar cambios al área de preparación (staging)
• git commit -m "..."     → Guardar un punto de control con mensaje descriptivo
• git push origin <rama>  → Publicar los commits locales en el repositorio remoto

Para nivel Junior/Entry: Es suficiente con comprender el ciclo de vida de una rama y cómo colaborar sin sobreescribir la rama principal (main).`,
  },
  'A3.2': {
    title: '📋 Guía para el evaluador — Pandas: Carga y Filtrado',
    content: `Conceptos esperados en manipulación de datasets con Pandas:
• Carga de datos:
  df = pd.read_csv('metrics.csv') o pd.read_json('logs.json')
• Inspección básica:
  df.head(), df.info(), df.describe()
• Filtrado condicional (Series de tiempo / logs):
  df_errors = df[df['status'] >= 500]
  df_slow = df[df['latency_ms'] > 2000]

Criterio de evaluación:
- Nivel 1 (Básico): Conoce qué es un DataFrame y menciona read_csv.
- Nivel 2 (Funcional): Escribe o explica la sintaxis correcta de filtrado por columnas.
- Nivel 3 (Autónomo): Maneja indexación temporal, múltiples condiciones (&, |) y manejo de valores nulos (dropna / fillna).`,
  },
  'A3.3': {
    title: '📋 Guía para el evaluador — Pandas: Agregaciones & Anomalías',
    content: `Conceptos esperados en agregación y análisis estadístico:
• Agrupación y métricas por servicio:
  df.groupby('service_name')['latency_ms'].mean()
  df.groupby('service_name')['status'].value_counts()
• Percentiles y anomalías:
  df['latency_ms'].quantile(0.95)   → Percentil 95 (P95)
  df.describe()                     → Resumen estadístico (min, max, std, quartiles)

Criterio de evaluación:
- Nivel 1 (Básico): Menciona conceptos estadísticos básicos (promedio, máximo) pero sin sintaxis clara.
- Nivel 2 (Funcional): Explica el uso de groupby() para calcular métricas por dimensión.
- Nivel 3 (Autónomo): Conecta los percentiles (P95/P99) con los SLI/SLO de observabilidad y detección de picos.`,
  },
}
