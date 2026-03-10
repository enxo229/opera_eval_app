/**
 * Guía estática para el evaluador en A3 (no generada por IA).
 * Incluye comandos Git sugeridos, contexto ITSM y expectativas entry-level.
 * 
 * Separado de ai.ts porque archivos 'use server' solo pueden exportar funciones async.
 */
export const A3_EVALUATOR_GUIDANCE: Record<string, { title: string; content: string }> = {
  'A3.1': {
    title: '📋 Guía para el evaluador — Comandos Git',
    content: `Si desea evaluar habilidad práctica, pida al candidato que explique o ejecute estos comandos básicos:

• git clone <url>         → Clonar un repositorio
  ✅ Esperado: "Descarga una copia del repositorio remoto a mi máquina local"
  
  💡 Repositorio de ejemplo para la prueba:
  HTTPS: https://github.com/opera-eval/demo-project.git
  SSH:   git@github.com:opera-eval/demo-project.git

• git checkout -b mi-rama → Crear y cambiar a una nueva rama
  ✅ Esperado: "Crea una rama nueva y me mueve a ella para trabajar sin afectar main"

• git add .               → Agregar cambios al staging
  ✅ Esperado: "Prepara los archivos modificados para ser incluidos en el próximo commit"

• git commit -m "mensaje" → Hacer commit
  ✅ Esperado: "Guarda un punto de control con los cambios que tengo en staging"

• git push origin mi-rama → Subir cambios al remoto
  ✅ Esperado: "Envía mis commits locales al servidor para que otros los vean"

Para entry-level, es suficiente con que comprenda el flujo: clone → branch → add → commit → push.`,
  },
  'A3.3': {
    title: '📋 Contexto — Herramientas ITSM',
    content: `A3.3 evalúa la capacidad de gestionar tickets de incidentes en cualquier herramienta ITSM.
Ejemplos de herramientas: GLPI, JIRA Service Management, ServiceNow, Zendesk, ManageEngine.

Para entry-level, esperamos que el candidato:
• Conozca los campos básicos de un ticket (título, descripción, prioridad, categoría)
• Sepa diferenciar entre incidente y solicitud de servicio
• Entienda el concepto de escalamiento
• No se espera que conozca configuración o administración de la herramienta`,
  },
  'A3.4': {
    title: '📋 Qué esperamos ver en la respuesta',
    content: `Para entry-level en documentación, esperamos que el candidato:
• Entienda la importancia de documentar procedimientos técnicos
• Conozca al menos una herramienta (Confluence, wikis internas, Google Docs, Notion)
• Pueda describir qué incluiría en una guía: pasos, capturas de pantalla, responsables
• NO esperamos: dominio avanzado de Confluence, creación de macros, templates complejos

Un candidato con score 2 (Funcional): "He documentado procedimientos en la wiki del equipo, incluyo los pasos, el resultado esperado y capturas"
Un candidato con score 3 (Autónomo): "Mantengo actualizada la documentación del equipo, he creado guías de troubleshooting con diagramas y las reviso mensualmente"`,
  },
}
