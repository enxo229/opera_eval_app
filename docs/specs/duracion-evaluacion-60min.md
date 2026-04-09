# Especificación: Reducción de Duración de Evaluación a 60 Minutos

**Fecha:** 2026-04-07  
**Autor:** Equipo de Ingeniería  
**Estado:** Aprobado  

---

## 1. Contexto

La evaluación técnica de O11y SkillFlow fue diseñada originalmente con una duración de **90 minutos**.  
Tras observaciones operativas, se determina que 60 minutos es suficiente para evaluar las competencias requeridas sin comprometer la calidad de la medición.

## 2. Inventario de Módulos

La evaluación consta de **6 módulos** independientes:

| Módulo | Nombre | Tipo | Nº Preguntas / Actividades | Complejidad |
|--------|--------|------|----------------------------|-------------|
| **A1** | Fundamentos de Infraestructura y Sistemas | Terminal Linux interactiva + 5 preguntas (Linux, Windows Server, Redes, Contenedores, Cloud) | 1 sandbox + 5 respuestas escritas | Media |
| **A2** | Observabilidad | Selección de herramienta + 5 preguntas (Monitoreo vs Observabilidad, 3 Pilares, Dashboards, Logs, Alertas) | 1 selección + 5 respuestas escritas | Media |
| **A3** | Herramientas y Automatización | 4 preguntas (Git, Scripting, Gestión ITSM, Documentación) | 4 respuestas escritas | Media-Baja |
| **A4** | Pensamiento Analítico Técnico | Chatbot de investigación de caso práctico (análisis de causa raíz) | Interacción libre por chat | Alta |
| **B1** | Comunicación Técnica Escrita | Redacción de ticket de incidente estilo GLPI | 1 formulario estructurado | Media |
| **D** | Dimensión IA (Prompt Engineering) | Redacción de prompt para automatización | 1 editor interactivo | Baja |

**Total de actividades:** ~22 ítems evaluables

## 3. Distribución de Tiempo Propuesta (60 min)

| Módulo | Tiempo Sugerido | Justificación |
|--------|----------------|---------------|
| **A1: Infraestructura** | 12 min | 3 min para explorar la terminal + ~1.5 min por pregunta (5 preguntas). Preguntas conceptuales, no requieren investigación externa. |
| **A2: Observabilidad** | 12 min | 1 min para seleccionar herramienta + ~2 min por pregunta (5 preguntas). Incluye interpretación de alerta simulada. |
| **A3: Herramientas** | 10 min | ~2.5 min por pregunta (4 preguntas). Preguntas prácticas con correlación entre ITSM y documentación. |
| **A4: Caso Analítico** | 12 min | Módulo más complejo: lectura del caso + interacciones con el chatbot de investigación. |
| **B1: Ticket** | 10 min | Redacción estructurada de un incidente. Formulario con campos predefinidos. |
| **Dim. D: IA** | 4 min | Módulo más ligero: redacción de un prompt. |
| **Total** | **60 min** | — |

## 4. Análisis de Viabilidad

### ¿Es suficiente 60 minutos?

**Sí.** Razones:

1. **Preguntas generadas por IA:** Las preguntas se generan automáticamente con Gemini y están calibradas al nivel educativo del candidato (bachiller, técnico, tecnólogo, profesional). No son preguntas de investigación sino de conocimiento aplicado.

2. **Respuestas esperadas son concisas:** Cada pregunta espera 2-5 oraciones o un párrafo corto. No se espera documentación exhaustiva.

3. **Tiempo promedio por respuesta escrita:** Basado en el estándar de redacción técnica, un candidato junior necesita ~2 minutos por respuesta conceptual.

4. **El módulo más pesado (A4) es conversacional:** El candidato interactúa con un chatbot, lo cual es más rápido que redactar respuestas largas.

5. **Sin cambio en contenido:** No se elimina ninguna pregunta ni módulo. Solo se ajusta el presupuesto de tiempo global.

### Riesgos mitigados

| Riesgo | Mitigación |
|--------|-----------|
| Candidato lento leyendo | Las instrucciones son breves y claras |
| Candidato con conexión inestable | Sistema de pausas (máx. 3) sigue activo |
| Presión excesiva | La distribución da ~2 min/pregunta promedio, alineado con estándares de certificación IT |

## 5. Cambio Técnico Requerido

### Base de datos
- Modificar el valor default de `test_duration_minutes` en la tabla `evaluations` de `90` a `60`.
- Ejecutar un UPDATE para evaluaciones existentes no iniciadas.

### Código
- Actualizar el fallback default en `evaluation.ts` de `90` a `60`.
- Actualizar la instrucción textual del módulo B1 de "15 y 20 minutos" a "10 minutos".

### SQL de migración

```sql
-- 1. Cambiar default para nuevas evaluaciones
ALTER TABLE evaluations ALTER COLUMN test_duration_minutes SET DEFAULT 60;

-- 2. Actualizar evaluaciones no iniciadas (aún en draft y sin timer)
UPDATE evaluations 
SET test_duration_minutes = 60 
WHERE started_at IS NULL;
```

## 6. Referencia de Benchmarks

| Certificación | Duración | Nº Preguntas | Tiempo/Pregunta |
|---------------|----------|-------------|-----------------|
| CompTIA A+ | 90 min | 90 | 1.0 min |
| AWS Cloud Practitioner | 90 min | 65 | 1.4 min |
| AZ-900 (Azure) | 45 min | 40 | 1.1 min |
| **O11y SkillFlow** | **60 min** | **~22** | **~2.7 min** |

Con ~2.7 minutos por ítem, la evaluación de O11y SkillFlow ofrece **más tiempo por pregunta** que las certificaciones estándar de la industria.
