# Especificación: Reducción de Duración de Evaluación a 60 Minutos

**Fecha:** 2026-04-07  
**Autor:** Equipo de Ingeniería  
**Estado:** Aprobado  

---

## 1. Contexto

La evaluación técnica de O11y SkillFlow fue diseñada originalmente con una duración de **90 minutos**.  
Tras observaciones operativas, se determina que 60 minutos es suficiente para evaluar las competencias requeridas sin comprometer la calidad de la medición.

## 2. Inventario de Módulos (Actualizado a Ruta de Formación)

La evaluación consta de módulos técnicos y prácticos alineados a la ruta de formación (Linux, SRE, Dynatrace, Grafana, Git, Pandas e IA):

| Módulo | Nombre | Tipo | Nº Preguntas / Actividades | Complejidad |
|--------|--------|------|----------------------------|-------------|
| **A1** | Linux & Cloud Computing AWS | Terminal Linux interactiva + 5 preguntas (Comandos Linux, Filesystem, Procesos, Logs, Cloud AWS Core) | 1 sandbox + 5 respuestas escritas | Media |
| **A2** | Observabilidad, SRE & APM | Selección de herramienta + 5 preguntas (Pilares Observabilidad, SRE SLI/SLO, Dynatrace APM, Grafana Dashboards, Alertas) | 1 selección + 5 respuestas escritas | Media |
| **A3** | Git & Análisis de Datos con Pandas | Editor de código + preguntas prácticas (Git branches/commits, Pandas filtrado, agregaciones groupby y detección de anomalías) | 3 respuestas prácticas / código | Media |
| **A4** | Pensamiento Analítico / Troubleshooting | Chatbot de investigación de incidente práctico en Dynatrace / Grafana | Interacción dinámica por chat | Media-Alta |
| **B1** | Comunicación Técnica Escrita | Redacción estructurada de ticket de incidente | 1 formulario estructurado | Media |
| **D** | Dimensión IA (Prompt Engineering) | Redacción de prompt para consultas en observabilidad (Dynatrace / Grafana Loki) | 1 editor interactivo | Baja |

## 3. Distribución de Tiempo Propuesta (60 min)

| Módulo | Tiempo Sugerido | Justificación |
|--------|----------------|---------------|
| **A1: Linux & Cloud** | 12 min | 3 min para comandos en terminal + ~1.8 min por pregunta (5 preguntas). |
| **A2: SRE & Observabilidad** | 12 min | ~2.4 min por pregunta conceptual y práctica (5 preguntas). |
| **A3: Git & Pandas** | 10 min | ~3 min por ejercicio de Git y análisis de series de tiempo con Pandas. |
| **A4: Troubleshooting** | 12 min | Lectura del caso e interacción investigativa con el asistente de incidentes. |
| **B1: Ticket** | 10 min | Redacción estructurada del reporte de incidente. |
| **Dim. D: IA** | 4 min | Formulación de prompt técnico en el editor. |
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
