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
