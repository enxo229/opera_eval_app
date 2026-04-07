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

## 4. Cumplimiento Legal (Compliance)

### Ley 1581 de 2012 (Colombia)
- El sistema implementa un paso de **Onboarding Legal** obligatorio para todo candidato antes de acceder a la evaluación.
- **Evidencia de Consentimiento**: Se almacena `legal_consent_tc`, `legal_consent_data`, `legal_accepted_at` y el estado de los checkboxes en cada registro de la tabla `evaluations`.
- **Regla Crítica**: No se permite el avance al test técnico sin el consentimiento previo, expreso e informado. Los checkboxes deben estar desmarcados por defecto (*opt-in* explícito).

### Documentos Legales In-App
- **Términos y Condiciones**: Lectura completa disponible en ventana modal (Dialog). Texto fuente en `docs/specs/terminosCondiciones.md`.
- **Política de Tratamiento de Datos Personales**: Lectura completa disponible en ventana modal (Dialog). Texto fuente en `docs/specs/tratamientoDatosPersonales.md`.
- **Importante**: Abrir y cerrar los modales **NO** marca automáticamente los checkboxes de aceptación. El consentimiento siempre es una acción consciente del candidato.

### Server Action
- `src/app/actions/candidate/legal.ts`: Contiene `saveLegalConsent()` y `getLegalConsentStatus()`. Persiste el consentimiento por `evaluation_id`, no por candidato, garantizando procesos independientes.
- **Sincronización de Estado**: Al guardar el consentimiento legal, el estado del `CandidateContext` se actualiza inmediatamente vía `setLegalAccepted(true)` para evitar redirecciones cíclicas. Lo mismo aplica para `setEducationLevel()` en la página de eligibilidad.

---

## 5. Arquitectura de Carpetas

```
opera_eval_app/
├── docs/specs/                     # Documentación, rúbricas, perfiles y textos legales
│   ├── AGENTS.md                   # Este archivo (especificación para agentes IA)
│   ├── modelo-evaluacion-noc.md    # Modelo de evaluación detallado
│   ├── terminosCondiciones.md      # Texto oficial de T&C
│   └── tratamientoDatosPersonales.md # Texto oficial Habeas Data (Ley 1581)
├── supabase/
│   └── schema.sql                  # DDL completo: tablas, RLS, functions (synced with prod)
├── src/
│   ├── types/
│   │   └── database.ts            # Tipos TypeScript de Supabase (manual)
│   ├── hooks/
│   │   ├── useA1State.ts          # Estado local de sub-dimensión A1
│   │   ├── useA2State.ts          # Estado local de sub-dimensión A2
│   │   ├── useA3State.ts          # Estado local de sub-dimensión A3
│   │   └── useCandidateContext.ts # Contexto global del candidato (evaluación, legal, educación)
│   ├── lib/
│   │   ├── ai/
│   │   │   └── gemini.ts           # Wrapper Gemini: fallback chain y retries
│   │   ├── constants.ts            # Constantes compartidas (TOOL_OPTIONS, EDUCATION_LABELS)
│   │   ├── utils.ts                # Utilidades (cn para clases CSS con clsx/twMerge)
│   │   ├── terminal/
│   │   │   └── commands.ts         # Motor de CLI simulada (FS virtual)
│   │   ├── supabase/
│   │   │   ├── client.ts / server.ts / middleware.ts
│   │   │   └── admin.ts            # Cliente con service_role para gestión de usuarios
│   │   └── evaluator-guidance.ts    # Guías estáticas para evaluadores (A3)
│   ├── components/
│   │   ├── CompanyLogo.tsx          # Logo corporativo reutilizable
│   │   ├── candidate/
│   │   │   ├── tabs/               # Fragmentos de UI para A1, A2, A3
│   │   │   ├── QuestionPanel.tsx   # Componente genérico reutilizable de Q&A
│   │   │   ├── TerminalSandbox.tsx  # Terminal Linux/Git simulada
│   │   │   ├── ChatbotA4.tsx        # Chat interactivo de investigación
│   │   │   ├── TicketEditor.tsx     # Editor de ticket B1
│   │   │   └── PromptEditorIA2.tsx  # Editor de prompt IA (Módulo D)
│   │   ├── evaluator/
│   │   │   ├── DimensionAEvaluation.tsx / DimensionBEvaluation.tsx ...
│   │   │   ├── DimensionDEvaluation.tsx # Módulo de IA (IA-1 e IA-2)
│   │   │   ├── FinalScoreCard.tsx   # Tarjeta de clasificación final con dictamen
│   │   │   ├── TimerAdjuster.tsx     # Widget para ajustar tiempo del candidato (+5/+10/+15 min o valor exacto)
│   │   │   ├── RadarChartComponent.tsx
│   │   │   ├── ScrollToTopButton.tsx # Botón flotante de navegación
│   │   │   └── dimension-a/         # Sub-evaluaciones A1, A2, A3, A4 + constantes
│   │   └── ui/                      # Primitivos Shadcn UI (dialog, tooltip, checkbox, label, etc.)
│   └── app/
│       ├── actions/                 # Server Actions
│       │   ├── ai.ts                # Lógica de IA generativa y evaluación
│       │   ├── admin.ts             # Gestión administrativa de usuarios
│       │   ├── evaluation.ts        # Operaciones sobre evaluaciones
│       │   ├── candidate/           # Acciones específicas del candidato
│       │       ├── a1.ts … a4.ts    # Dimensión A (Técnica)
│       │       ├── b1.ts            # Dimensión B (Blandas: Tickets)
│       │       ├── ia.ts            # Dimensión D (IA)
│       │       ├── evaluation.ts    # Timer: startEvaluationTimer, pauseEvaluation, resumeEvaluation
│       │       └── legal.ts         # Consentimiento legal (saveLegalConsent, getLegalConsentStatus)
│       │   └── evaluator/           # Acciones específicas del evaluador
│       │       └── timer.ts         # Ajuste de temporizador (add/set minutes)
│       ├── auth/
│       │   └── signout/route.ts     # Ruta de cierre de sesión (Server Route)
│       ├── candidate/               # Interfaz de examen del candidato
│       │   ├── onboarding/          # Consentimiento legal con modales (T&C + Habeas Data)
│       │   ├── eligibility/         # Selección de nivel académico con tooltips
│       │   └── page.tsx             # Examen principal (dimensiones A-D)
│       ├── evaluator/               # Dashboard y evaluación
│       │   └── history/             # Búsqueda histórica de procesos
│       ├── admin/                   # Panel de administración de usuarios
│       └── login/                   # Autenticación
```

---

## 6. Rutas y Seguridad

- **Middleware** (`src/proxy.ts` → `src/lib/supabase/middleware.ts`): Protege `/evaluator`, `/candidate` y `/admin`. Los candidatos sin consentimiento legal son redirigidos a `/candidate/onboarding`. Los candidatos sin `education_level` son redirigidos a `/candidate/eligibility`.
- **RBAC**: El rol `evaluator` es necesario para acceder a `/admin` y realizar evaluaciones.
- **RLS**: Protege datos sensibles. Los candidatos solo ven/modifican/borran sus propias evaluaciones, pruebas dinámicas y campos de consentimiento legal. Los evaluadores tienen acceso completo.
- **Restricciones Anti-Copia**: Los inputs del candidato (ChatbotA4, QuestionPanel, TerminalSandbox, TicketEditor) bloquean `onPaste`, `onCopy` y `onContextMenu` para evitar trampas. El editor de prompt IA-2 (`PromptEditorIA2`) está exento de estas restricciones.

---

## 7. Modelo de Evaluación y Normalización

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

## 8. Temporizador y Sistema de Pausas

### Configuración
- **Duración por defecto**: 60 minutos (configurable por evaluador en tiempo real).
- **Máximo de pausas**: 2 por evaluación.
- **Auto-pausa**: Se activa al cambiar de pestaña del navegador o perder conexión (si quedan pausas disponibles).

### Arquitectura del Timer
- **Server Actions** (`src/app/actions/candidate/evaluation.ts`): `startEvaluationTimer()`, `pauseEvaluation()`, `resumeEvaluation()`. Las acciones actualizan la DB pero **no usan `revalidatePath`** — el estado se maneja de forma optimista en el cliente.
- **Estado optimista**: `CandidateContext` expone `setPausedAt()`, `setPauseCount()`, `setTotalPausedMs()`, `setStartedAt()`. Los callbacks en `CandidateHeader` y `PauseOverlay` actualizan el contexto inmediatamente.
- **Polling de duración**: El `CandidateContext` hace polling cada 30 segundos de `test_duration_minutes` para reflejar ajustes del evaluador sin recargar la página.
- **Posición visual**: El timer se renderiza en el centro del **sticky header** (`CandidateHeader.tsx`), que permanece fijo en la parte superior de la pantalla.

### Ajuste de Tiempo por el Evaluador
- **Server Action** (`src/app/actions/evaluator/timer.ts`): `adjustEvaluationTime(evaluationId, 'add'|'set', minutes)`. Validación: 1-180 minutos.
- **Widget UI** (`TimerAdjuster.tsx`): Botones rápidos (+5, +10, +15 min) + input para fijar un valor exacto. Ubicado en el sidebar de `/evaluator/evaluate/[id]`.

---

## 9. Flujos Especiales

- **Persistencia de Preguntas (A1, A2, A3)**: Las preguntas generadas por IA se persisten inmediatamente en `dynamic_tests` vía `saveA*QuestionsOnly()`. Esto previene la pérdida de datos por recarga de página. Solo se regeneran si el evaluador ejecuta un _reset_.
- **A2 (Herramienta)**: El candidato selecciona su herramienta de observabilidad. La selección y las preguntas se persisten con `candidate_response = ''` hasta que el candidato las responda.
- **A4 (Caso Práctico)**: Generación persistente de incidente en DB (`A4_CASE`). Chat interactivo (`IA_CHAT`) que se bloquea al finalizar. Evaluación IA en 3 subcategorías.
- **B1 (Ticket)**: Escenario dinámico (`B1_CASE`). Evaluación vía IA basada en rúbrica de 4 criterios (Estructura, Precisión, Acciones, Impacto). También evalúa B6 (Colaboración Asíncrona) en 3 criterios adicionales (Handoff, Bloqueos, Seguimiento).
- **IA-2 (Prompting)**: El candidato ingresa el prompt que usó fuera de la plataforma. Gemini analiza el contexto, claridad y sugiere un score al evaluador en `DimensionDEvaluation`.

---

## 9. Base de Datos

### Tablas

| Tabla | Propósito |
|---|---|
| `profiles` | Datos del usuario (nombre, rol, nivel educativo, documento de identidad) |
| `selection_processes` | Procesos de selección por candidato (con email, CC, equipo, observaciones) |
| `evaluations` | Evaluación vinculada a un proceso (puntajes por dimensión, clasificación, consentimiento legal) |
| `dimension_scores` | Scores detallados por categoría dentro de cada dimensión |
| `dynamic_tests` | Pruebas dinámicas: preguntas, respuestas, scores IA, chat, tickets, prompts |

### Campos del Timer (tabla `evaluations`)

| Campo | Tipo | Propósito |
|---|---|---|
| `started_at` | timestamptz | Marca de inicio de la evaluación |
| `test_duration_minutes` | int (default 60) | Duración total configurable por evaluador |
| `paused_at` | timestamptz | Marca de última pausa (null si no está pausado) |
| `total_paused_ms` | bigint (default 0) | Milisegundos totales pausados acumulados |
| `pause_count` | int (default 0) | Número de pausas utilizadas (máx. 2) |

### Campos de Auditoría Legal (tabla `evaluations`)

| Campo | Tipo | Propósito |
|---|---|---|
| `legal_consent_tc` | boolean | Aceptación de Términos y Condiciones |
| `legal_consent_data` | boolean | Autorización de Tratamiento de Datos |
| `legal_accepted_at` | timestamptz | Estampa de tiempo del consentimiento |

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
- **Candidatos**: SELECT y UPDATE sobre campos de consentimiento legal en `evaluations` (solo sus propios registros)
- **Evaluadores**: Acceso completo a todas las tablas (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
- **Profiles**: Visible públicamente (SELECT), editable solo por el propietario

---

## 10. Convenciones Técnicas

1. **Next.js Params**: Siempre `await params` en rutas dinámicas.
2. **Server Actions**: Marcadas con `'use server'`. Lógica de negocio e IA concentrada aquí.
3. **test_type (dynamic_tests)**: Valores permitidos en el constraint SQL: `A4_CASE`, `B1_CASE`, `B1_TICKET`, `IA_CHAT`, `TERMINAL_A1`, `TERMINAL_A3`, `TERMINAL_A4`, `QUESTIONS_A1`, `QUESTIONS_A2`, `QUESTIONS_A3`, `QUESTIONS_A4`, `QUESTIONS_B1`, `PROMPT_IA2`.
4. **Environment**: Usar estrictamente `APP_GEMINI_API_KEY`.
5. **Supabase Generics**: Clientes con `<any, 'public'>` (sin `supabase gen types`). Los tipos manuales están en `src/types/database.ts`.
6. **Constantes compartidas**: Definidas en `src/lib/constants.ts` (ej. `TOOL_OPTIONS`, `EDUCATION_LABELS`). No duplicar en componentes.
7. **Persistencia de preguntas**: Usar `saveA*QuestionsOnly()` inmediatamente después de generar preguntas por IA. Incluir `evaluationId` en el array de dependencias de `useCallback`.
8. **Schema sync**: El archivo `supabase/schema.sql` debe mantenerse sincronizado con la BD de producción. La última verificación fue el 2026-04-07.
9. **UI Componentes**: Shadcn UI v4 (basado en Base UI de @base-ui/react). NO usar la prop `asChild` (no existe en esta versión). Aplicar estilos directamente con `className` en `DialogTrigger`, `DialogClose`, `TooltipTrigger`, etc.
10. **Diseño Legal**: Los textos legales oficiales deben provenir siempre de los archivos en `docs/specs/`. No alterar el texto sin aprobación explícita de la organización.
11. **Hydration Safety**: `<html>` y `<body>` en `layout.tsx` incluyen `suppressHydrationWarning` para evitar falsos positivos causados por extensiones del navegador.
12. **Eliminación de Candidatos (Admin)**: Al eliminar un usuario desde admin, `deleteUser()` archiva (`status: 'archived'`) todos sus procesos de selección activos antes de borrar la cuenta. Esto preserva el historial y permite recrear el mismo email.

---

## 11. Decisiones Arquitectónicas Documentadas

| Decisión | Razón | Fecha |
|---|---|---|
| PII filter eliminado | Falsos positivos con timestamps y datos técnicos | 2026-03-31 |
| `diagnostics.ts` eliminado | Exponía API key en logs del servidor | 2026-03-31 |
| `test_db.ts` eliminado | Script ad-hoc con credenciales de servicio | 2026-03-31 |
| Candidate DELETE policy en RLS | Necesario para `saveA*QuestionsOnly` (limpiar y regenerar preguntas) | 2026-03-31 |
| Constantes centralizadas en `constants.ts` | Evitar drift entre copias duplicadas | 2026-03-31 |
| Modales legales en lugar de enlaces externos | Retención del candidato en el flujo, evita placeholders rotos | 2026-04-07 |
| Consentimiento por `evaluation_id` (no por candidato) | Permite procesos de selección independientes para un mismo usuario | 2026-03-31 |
| `asChild` eliminado de Shadcn v4 | Base UI no soporta esta prop; estilos directos en className | 2026-04-07 |
| `revalidatePath` eliminado del timer | Causaba delays de 5-13s y loops al pausar/reanudar; estado optimista via Context | 2026-04-07 |
| Duración reducida de 90 a 60 minutos | Análisis de viabilidad: 22 ítems con ~2.7 min/pregunta (ver `specs/duracion-evaluacion-60min.md`) | 2026-04-07 |
| `suppressHydrationWarning` en layout | Extensiones del navegador inyectan atributos en `<body>` causando falsos positivos | 2026-04-07 |
| Admin delete archiva procesos | Previene procesos huérfanos y conflictos al recrear el mismo email | 2026-04-07 |
| Setters expuestos en CandidateContext | `setLegalAccepted`, `setEducationLevel` evitan redirect loops en onboarding | 2026-04-07 |
| Timer ajustable por evaluador | Permite dar tiempo extra (+5/+10/+15 min o valor exacto) sin interrumpir la prueba | 2026-04-07 |
