# AGENTS.md — OTP (Observability Talent Pivot)

## 1. Propósito del Proyecto

**OTP** es una plataforma de evaluación de talento técnico para equipos de infraestructura y operaciones. Permite a un **Evaluador** calificar a un **Candidato** en cuatro dimensiones (Técnica, Blandas, Cultural e IA) y obtener un dictamen automatizado asistido por IA.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| UI | React + Tailwind CSS v4 + Shadcn UI v4 (base-ui) | React 19.2.3 |
| Lenguaje | TypeScript | ^5 |
| Base de datos | Supabase (PostgreSQL + Auth + RLS) | SDK 2.98 |
| IA Generativa | Google Gemini (Gemma 3 & Gemini 2.5) | SDK 0.24.1 |
| Gráficos | Recharts | ^3.8 |
| Animaciones | Framer Motion | ^12.35 |
| Iconos | Lucide React | ^0.577 |
| Despliegue | Vercel | — |

---

## 3. Modelos de IA (Fallback & Resiliency Strategy)

Configuración en `src/lib/ai/gemini.ts`.

| Tipo de Tarea | Modelo Principal (Intento 1) | Fallback 1 (Intento 2) | Fallback 2 (Intento 3) |
|---|---|---|---|
| **Generación** | `gemma-3-27b-it` | `gemma-3-12b-it` | `gemini-2.5-flash-lite` |
| **Evaluación** (JSON) | `gemma-3-27b-it` | `gemma-3-12b-it` | `gemini-2.5-flash-lite` |

- **Resiliencia (Fallback)**: Si un modelo falla por cuota (429) o disponibilidad (503/500), el sistema conmuta automáticamente hacia el siguiente en la cadena tras un delay exponencial (2s × 2^attempt).
- **PII Filter**: Eliminado intencionalmente (`sanitizePII` fue removido en la auditoría del 2026-03-31). Se deshabilitó por falsos positivos con timestamps y datos técnicos en logs. Si se requiere en el futuro, implementar con una lista blanca de patrones técnicos.
- **Variable de entorno**: Usa `APP_GEMINI_API_KEY` (NO `GEMINI_API_KEY`) para evitar colisiones con el entorno del sistema.
- **Logging**: El log de la API Key solo se ejecuta en `development` (`process.env.NODE_ENV === 'development'`).

---

## 4. Arquitectura de Carpetas

```
opera_eval_app/
├── docs/specs/                     # Documentación, rúbricas y perfiles de referencia
├── supabase/
│   └── schema.sql                  # DDL completo: tablas, RLS, functions (synced with prod)
├── src/
│   ├── types/
│   │   └── database.ts            # Tipos TypeScript de Supabase (manual)
│   ├── lib/
│   │   ├── ai/
│   │   │   └── gemini.ts           # Wrapper Gemini: fallback chain y retries
│   │   ├── constants.ts            # Constantes compartidas (TOOL_OPTIONS, EDUCATION_LABELS)
│   │   ├── terminal/
│   │   │   └── commands.ts         # Motor de CLI simulada (FS virtual)
│   │   ├── supabase/
│   │   │   ├── client.ts / server.ts / middleware.ts
│   │   │   └── admin.ts            # Cliente con service_role para gestión de usuarios
│   │   └── evaluator-guidance.ts    # Guías estáticas para evaluadores (A3)
│   ├── components/
│   │   ├── candidate/
│   │   │   ├── tabs/               # Fragmentos de UI para A1, A2, A3
│   │   │   ├── QuestionPanel.tsx   # Componente genérico reutilizable de Q&A
│   │   │   ├── TerminalSandbox.tsx  # Terminal Linux/Git simulada
│   │   │   ├── ChatbotA4.tsx        # Chat interactivo de investigación
│   │   │   ├── TicketEditor.tsx     # Editor de ticket B1
│   │   │   └── PromptEditorIA2.tsx  # Editor de prompt IA (Módulo D)
│   │   └── evaluator/
│   │       ├── DimensionAEvaluation.tsx / DimensionBEvaluation.tsx ...
│   │       ├── DimensionDEvaluation.tsx # Módulo de IA (IA-1 e IA-2)
│   │       ├── FinalScoreCard.tsx   # Tarjeta de clasificación final con dictamen
│   │       ├── RadarChartComponent.tsx
│   │       └── ScrollToTopButton.tsx # Botón flotante de navegación
│   └── app/
│       ├── actions/                 # Server Actions (ai.ts, candidate.ts, evaluation.ts, admin.ts)
│       ├── candidate/               # Interfaz de examen del candidato
│       ├── evaluator/               # Dashboard y evaluación
│       │   └── history/             # Búsqueda histórica de procesos
│       ├── admin/                   # Panel de administración de usuarios
│       └── login/                   # Autenticación
```

---

## 5. Rutas y Seguridad

- **Middleware** (`src/proxy.ts` → `src/lib/supabase/middleware.ts`): Protege `/evaluator`, `/candidate` y `/admin`. Los candidatos sin `education_level` son forzados a `/candidate/eligibility`.
- **RBAC**: El rol `evaluator` es necesario para acceder a `/admin` y realizar evaluaciones.
- **RLS**: Protege datos sensibles. Los candidatos solo ven/modifican/borran sus propias evaluaciones y pruebas dinámicas. Los evaluadores tienen acceso completo.
- **Restricciones Anti-Copia**: Los inputs del candidato (ChatbotA4, QuestionPanel, TerminalSandbox, TicketEditor) bloquean `onPaste`, `onCopy` y `onContextMenu` para evitar trampas. El editor de prompt IA-2 (`PromptEditorIA2`) está exento de estas restricciones.

---

## 6. Modelo de Evaluación y Normalización

### Dimensiones y Pesos

| Dimensión | Máx. Puntos | Notas de Normalización |
|---|---|---|
| **A — Técnica** | 50 | A1(15), A2(15), A3(10 de 12 pts raw), A4(10 de 9 pts raw) |
| **B — Blandas** | 30 | B1(7 de 16 pts), B2(7 de 16 pts), B3-B6(4 de 12 pts c/u) |
| **C — Cultural** | 20 | C1(5), C2(5), C3(5), C4(5) |
| **D — IA (Comp.)** | (10) | **Desempate**. IA-1 (5), IA-2 (5). No suma al total principal. |

### Clasificación Final
- **≥ 80**: Listo para pivotar (Verde)
- **60–79**: Pivote con nivelación (Amarillo)
- **40–59**: En preparación (Naranja)
- **< 40**: Continúa en Ópera (Rojo)

---

## 7. Flujos Especiales

- **Persistencia de Preguntas (A1, A2, A3)**: Las preguntas generadas por IA se persisten inmediatamente en `dynamic_tests` vía `saveA*QuestionsOnly()`. Esto previene la pérdida de datos por recarga de página. Solo se regeneran si el evaluador ejecuta un _reset_.
- **A2 (Herramienta)**: El candidato selecciona su herramienta de observabilidad. La selección y las preguntas se persisten con `candidate_response = ''` hasta que el candidato las responda.
- **A4 (Caso Práctico)**: Generación persistente de incidente en DB (`A4_CASE`). Chat interactivo (`IA_CHAT`) que se bloquea al finalizar. Evaluación IA en 3 subcategorías.
- **B1 (Ticket)**: Escenario dinámico (`B1_CASE`). Evaluación vía IA basada en rúbrica de 4 criterios (Estructura, Precisión, Acciones, Impacto). También evalúa B6 (Colaboración Asíncrona) en 3 criterios adicionales (Handoff, Bloqueos, Seguimiento).
- **IA-2 (Prompting)**: El candidato ingresa el prompt que usó fuera de la plataforma. Gemini analiza el contexto, claridad y sugiere un score al evaluador en `DimensionDEvaluation`.

---

## 8. Base de Datos

### Tablas

| Tabla | Propósito |
|---|---|
| `profiles` | Datos del usuario (nombre, rol, nivel educativo, documento de identidad) |
| `selection_processes` | Procesos de selección por candidato (con email, CC, equipo, observaciones) |
| `evaluations` | Evaluación vinculada a un proceso (puntajes por dimensión, clasificación) |
| `dimension_scores` | Scores detallados por categoría dentro de cada dimensión |
| `dynamic_tests` | Pruebas dinámicas: preguntas, respuestas, scores IA, chat, tickets, prompts |

### Documentos de Identificación

La plataforma soporta los siguientes tipos de documento nacional colombiano:
- **CC**: Cédula de Ciudadanía
- **CE**: Cédula de Extranjería
- **TI**: Tarjeta de Identidad
- **PPT**: Permiso por Protección Temporal
- **PEP**: Permiso Especial de Permanencia
- **Pasaporte**: Documento de viaje internacional

El tipo se almacena en `profiles.national_id_type` y el número en `profiles.national_id`.

### RLS Policies

- **Candidatos**: SELECT, INSERT, UPDATE, DELETE sobre `dynamic_tests` (solo sus propios registros)
- **Evaluadores**: Acceso completo a todas las tablas (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
- **Profiles**: Visible públicamente (SELECT), editable solo por el propietario

---

## 9. Convenciones Técnicas

1. **Next.js Params**: Siempre `await params` en rutas dinámicas.
2. **Server Actions**: Marcadas con `'use server'`. Lógica de negocio e IA concentrada aquí.
3. **test_type (dynamic_tests)**: Valores permitidos en el constraint SQL: `A4_CASE`, `B1_CASE`, `B1_TICKET`, `IA_CHAT`, `TERMINAL_A1`, `TERMINAL_A3`, `TERMINAL_A4`, `QUESTIONS_A1`, `QUESTIONS_A2`, `QUESTIONS_A3`, `QUESTIONS_A4`, `QUESTIONS_B1`, `PROMPT_IA2`.
4. **Environment**: Usar estrictamente `APP_GEMINI_API_KEY`.
5. **Supabase Generics**: Clientes con `<any, 'public'>` (sin `supabase gen types`). Los tipos manuales están en `src/types/database.ts`.
6. **Constantes compartidas**: Definidas en `src/lib/constants.ts` (ej. `TOOL_OPTIONS`, `EDUCATION_LABELS`). No duplicar en componentes.
7. **Persistencia de preguntas**: Usar `saveA*QuestionsOnly()` inmediatamente después de generar preguntas por IA. Incluir `evaluationId` en el array de dependencias de `useCallback`.
8. **Schema sync**: El archivo `supabase/schema.sql` debe mantenerse sincronizado con la BD de producción. La última verificación fue el 2026-03-31.

---

## 10. Decisiones Arquitectónicas Documentadas

| Decisión | Razón | Fecha |
|---|---|---|
| PII filter eliminado | Falsos positivos con timestamps y datos técnicos | 2026-03-31 |
| `diagnostics.ts` eliminado | Exponía API key en logs del servidor | 2026-03-31 |
| `test_db.ts` eliminado | Script ad-hoc con credenciales de servicio | 2026-03-31 |
| Candidate DELETE policy en RLS | Necesario para `saveA*QuestionsOnly` (limpiar y regenerar preguntas) | 2026-03-31 |
| Constantes centralizadas en `constants.ts` | Evitar drift entre copias duplicadas | 2026-03-31 |
