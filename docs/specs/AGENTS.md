# AGENTS.md — OTP (Observability Talent Pivot)

## 1. Propósito del Proyecto

**OTP** es una plataforma de evaluación de talento técnico para equipos de infraestructura y operaciones. Permite a un **Evaluador** calificar a un **Candidato** en cuatro dimensiones (Técnica, Blandas, Cultural e IA) y obtener un dictamen automatizado asistido por IA. Soporta múltiples perfiles de evaluación (tracks): `general` y `otel_expert`.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| UI | React + Tailwind CSS v4 + Shadcn UI v4 (base-ui) | React 19.2.3 |
| Lenguaje | TypeScript | ^5 |
| Base de datos | Supabase (PostgreSQL + Auth + RLS) | SDK 2.98 |
| IA Generativa | Google Gemini (3 cadenas de modelos) | SDK 0.24.1 |
| Gráficos | Recharts | ^3.8 |
| Animaciones | Framer Motion | ^12.35 |
| Iconos | Lucide React | ^0.577 |
| Despliegue | Vercel | — |
| Observabilidad | OpenTelemetry (Metrics, Logs, Traces) | SDK 1.x |

---

## 3. Modelos de IA (Fallback & Resiliency Strategy)

Configuración en `src/lib/ai/gemini.ts`. Se utilizan **3 cadenas diferenciadas** por tipo de tarea para optimizar latencia vs. calidad:

### 3.1 Cadenas de Modelos

| Tipo de Tarea | Modelo 1 (Principal) | Modelo 2 (Fallback) | Modelo 3 (Universal) |
|---|---|---|---|
| **Generación** (Preguntas, Chat A4) | `gemini-3.5-flash-lite` | `gemini-2.5-flash` | `gemini-2.5-flash-lite` |
| **Evaluación** (Scoring JSON, Rúbricas, IA-2) | `gemini-2.5-flash` | `gemini-3.5-flash-lite` | `gemini-2.5-flash-lite` |
| **Reportes** (Narrativa Ejecutiva) | `gemini-3.6-flash` | `gemini-2.5-flash` | `gemini-3.5-flash-lite` |

- **Resiliencia (Fallback)**: Si un modelo falla por cuota (429) o disponibilidad (503/500), el sistema conmuta automáticamente hacia el siguiente en la cadena tras un delay exponencial (2s × 2^attempt).
- **Manual Backup Strategy**: Se ha implementado un botón "Regenerar con IA (Back up)" en la interfaz del reporte. Este botón ignora la cadena de fallback y llama directamente al modelo lite para garantizar la generación en situaciones de alta latencia o agotamiento de cuota.
- **PII Filter**: Eliminado intencionalmente. El usuario ha confirmado que desea capturar `prompt` y `completion` incluso en producción para auditoría técnica.
- **Variable de entorno**: Usa `APP_GEMINI_API_KEY` (NO `GEMINI_API_KEY`) para evitar colisiones con el entorno del sistema.
- **Observability**: Toda llamada a la IA debe registrarse usando `metricsApp.recordAiRequest()` y envolverse en un Span de OTel (`tracer.startActiveSpan`).
- **Logging**: El log de la API Key solo se ejecuta en `development` (`process.env.NODE_ENV === 'development'`).

### 3.2 Sistema de Detección de IA (AI Likelihood)

Configuración en `src/app/actions/ai-detector.ts`. Cada respuesta abierta del candidato se analiza para determinar la probabilidad de que haya sido generada por un LLM.

**Arquitectura del Motor Dual:**
1. **Análisis Heurístico**: Detecta fraseología típica de LLM en español ("en resumen", "es importante destacar", etc.), formato hiper-estructurado (negritas + viñetas complejas), y ausencia de jerga situacional o experiencia personal.
2. **Contra-Evaluación Gemini**: Un prompt especializado pide al modelo evaluar la probabilidad (0-100%) de que la respuesta sea generada por IA, basándose en tono, estructura y coloquialismos de SRE.
3. **Scoring Ponderado**: El resultado final combina 70% del modelo + 30% del análisis heurístico.

**Clasificación (Badges en el Dashboard del Evaluador):**
| Rango | Badge | Color |
|---|---|---|
| 0% - 29% | Probabilidad IA Baja | Verde |
| 30% - 69% | Probabilidad IA Media | Amarillo |
| 70% - 100% | ⚠️ Probabilidad IA Alta | Rojo animado |

**Exclusión**: Este puntaje **NO** se incluye en el reporte ejecutivo oficial.

### 3.3 Counter de Bypass Anti-Copia (`bypass_paste_count`)

- Las tarjetas con enunciados de preguntas aplican la clase CSS `select-none` y bloquean la copia.
- Los campos de texto del candidato bloquean los eventos `onPaste`, `onCopy`, `onCut` y `onContextMenu`.
- Cada intento de pegar o usar combinaciones de teclado bloqueadas incrementa un contador de advertencias (`bypass_paste_count`), el cual se muestra en el panel del evaluador para auditar la conducta del candidato.

### 3.4 Pregeneración de Contenido

Configuración en `src/app/actions/candidate/pregen.ts`. Al completar el flujo de onboarding (legal + nivel educativo), el sistema pre-genera **todas** las preguntas para evitar tiempos de espera de ~10s durante el examen activo.

**Módulos Pregenerados:**
- A1, A2, A3 (Preguntas Técnicas)
- A4 (Caso Práctico)
- B2-B6 (Preguntas Situacionales)
- C1-C4 (Preguntas de Filosofía/Cultura)

**Idempotencia:** Cada módulo verifica la existencia de registros antes de generar. Si ya existen preguntas para un `evaluation_id`, se omite la generación.

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

## 5. Workflow de Desarrollo (CI/CD Local & Branching)

**Procedimiento Operativo Estándar (SOP) para Agentes:**
Para garantizar la estabilidad de producción, cualquier cambio destructivo o de esquema (DDL) debe seguir este flujo:

1. **Creación de Rama**: Solicitar o crear una rama de desarrollo `dev-*` en Supabase.
2. **Pruebas Aisladas**: Aplicar cambios SQL únicamente en el `project_id` de la rama.
3. **Verificación**: Validar el esquema y las políticas RLS en la rama antes de proponer el merge.
4. **Sincronización Local**: Actualizar el archivo `supabase/schema.sql` local una vez validados los cambios.

---

## 6. Arquitectura de Carpetas y Documentación

**REGLA DE ORO PARA DOCUMENTACIÓN:** Basado en las mejores prácticas de estructuración de proyectos Web modernos (como Next.js), se debe centralizar y colocar todas las documentaciones y especificaciones técnicas dentro de una única carpeta raíz `/docs` o `/docs/specs`. Almacenar especificaciones de manera aislada (ej. en carpetas `/specs` independientes) fragmenta la estructura y genera confusión sobre la ubicación de la fuente de verdad. El proyecto sigue estrictamente esta regla.

> **Archivos Deprecated:** Los archivos `modelodeavaluación.txt`, `perfilanalistas.txt`, `promptincial.txt` en `/docs/specs/` son borradores históricos y **no deben usarse como fuente de verdad**.

```
opera_eval_app/
├── docs/specs/                     # ÚNICA FUENTE DE VERDAD para Documentación, rúbricas, perfiles y textos.
│   ├── AGENTS.md                   # Este archivo (especificación para agentes IA)
│   ├── modelo-evaluacion-talento-tecnico.md    # Modelo de evaluación detallado (perfil general)
│   ├── otel_expert.md              # Especificación del track OTel Expert (rúbricas, dominios, tiempos)
│   ├── duracion-evaluacion-60min.md # Análisis de viabilidad del tiempo de 60 minutos
│   ├── terminosCondiciones.md      # Texto oficial de T&C
│   └── tratamientoDatosPersonales.md # Texto oficial Habeas Data (Ley 1581)
├── supabase/
│   └── schema.sql                  # DDL completo: tablas, RLS, functions (synced with prod)
├── src/
│   ├── types/
│   │   └── database.ts            # Tipos TypeScript de Supabase (manual)
│   ├── context/
│   │   └── CandidateContext.tsx   # Contexto global del candidato (evaluación, legal, educación, track)
│   ├── hooks/
│   │   ├── useA1State.ts          # Estado local de sub-dimensión A1
│   │   ├── useA2State.ts          # Estado local de sub-dimensión A2
│   │   ├── useA3State.ts          # Estado local de sub-dimensión A3
│   │   ├── useB2State.ts          # Estado local de sección B2-B6
│   │   ├── useCState.ts           # Estado local de sección C1-C4
│   │   └── useCandidateContext.ts # Hook de acceso al contexto global
│   ├── lib/
│   │   ├── ai/
│   │   │   └── gemini.ts           # Wrapper Gemini: 3 cadenas de fallback + retries
│   │   ├── constants.ts            # Constantes compartidas (TOOL_OPTIONS, EDUCATION_LABELS)
│   │   ├── utils.ts                # Utilidades (cn para clases CSS con clsx/twMerge)
│   │   ├── terminal/
│   │   │   └── commands.ts         # Motor de CLI simulada (FS virtual)
│   │   ├── supabase/
│   │   │   ├── client.ts / server.ts / middleware.ts
│   │   │   └── admin.ts            # Cliente con service_role para gestión de usuarios
│   │   ├── observability/
│   │   │   ├── logger.ts           # Logger estructurado con OTel LoggerProvider
│   │   │   └── metrics.ts          # Métricas de aplicación (AI requests, DB ops, evaluations)
│   │   └── evaluator-guidance.ts    # Guías estáticas para evaluadores (general + otel_expert)
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
│   │   │   ├── AiLikelihoodBadge.tsx # Badge de probabilidad de IA (LOW/MEDIUM/HIGH)
│   │   │   ├── TimerAdjuster.tsx     # Widget para ajustar tiempo del candidato
│   │   │   ├── RealtimeSync.tsx      # Suscripción WebSocket a dynamic_tests
│   │   │   ├── RegenerateAIButton.tsx # Botón de regeneración de reporte (modelo Lite)
│   │   │   ├── PrintReportButton.tsx  # Botón de impresión de reporte
│   │   │   ├── CopyButton.tsx         # Botón de copia de contenido
│   │   │   ├── RadarChartComponent.tsx
│   │   │   ├── ScrollToTopButton.tsx # Botón flotante de navegación
│   │   │   └── dimension-a/         # Sub-evaluaciones A1, A2, A3, A4 + constantes
│   │   └── ui/                      # Primitivos Shadcn UI (dialog, tooltip, checkbox, label, etc.)
│   └── app/
│       ├── actions/                 # Server Actions
│       │   ├── ai.ts                # Lógica de IA generativa y evaluación
│       │   ├── ai-detector.ts       # Motor de detección de IA (heurístico + Gemini contra-evaluación)
│       │   ├── admin.ts             # Gestión administrativa de usuarios
│       │   ├── evaluation.ts        # Cálculos de normalización y clasificación (bifurcados por track)
│       │   ├── candidate/           # Acciones específicas del candidato
│       │       ├── a1.ts … a4.ts    # Dimensión A (Técnica)
│       │       ├── b1.ts            # Dimensión B (Blandas: Tickets)
│       │       ├── b2.ts            # Dimensión B (Blandas: Preguntas situacionales B2-B6)
│       │       ├── c.ts             # Dimensión C (Cultural: Preguntas de filosofía C1-C4)
│       │       ├── ia.ts            # Dimensión D (IA)
│       │       ├── evaluation.ts    # Timer: startEvaluationTimer, pauseEvaluation, resumeEvaluation
│       │       ├── legal.ts         # Consentimiento legal (saveLegalConsent, getLegalConsentStatus)
│       │       └── pregen.ts        # Pregeneración batch de preguntas al completar onboarding
│       │   └── evaluator/           # Acciones específicas del evaluador
│       │       ├── reports.ts       # Finalización atómica + reporte narrativo + regeneración manual
│       │       └── timer.ts         # Ajuste de temporizador (add/set minutes)
│       ├── auth/
│       │   └── signout/route.ts     # Ruta de cierre de sesión (Server Route)
│       ├── candidate/               # Interfaz de examen del candidato
│       │   ├── onboarding/          # Consentimiento legal con modales (T&C + Habeas Data)
│       │   ├── eligibility/         # Selección de nivel académico + trigger de pregeneración
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

### Perfiles de Evaluación (Tracks)

El sistema soporta múltiples perfiles de evaluación. El track se almacena en `selection_processes.profile_track` y afecta la generación de preguntas, la normalización de scores y los módulos disponibles.

### Dimensiones y Pesos — Perfil `general`

| Dimensión | Máx. Puntos | Notas de Normalización |
|---|---|---|
| **A — Técnica** | 50 | A1(15), A2(15), A3(10 de 12 pts raw), A4(10 de 9 pts raw) |
| **B — Blandas** | 30 | B1(7 de 16 pts), B2(7 de 16 pts), B3-B6(4 de 12 pts c/u) |
| **C — Cultural** | 20 | C1(5), C2(5), C3(5), C4(5) |
| **D — IA (Comp.)** | (10) | **Desempate**. IA-1 (5), IA-2 (5). No suma al total principal. |

### Dimensiones y Pesos — Perfil `otel_expert`

| Dimensión | Máx. Puntos | Notas de Normalización |
|---|---|---|
| **A — Técnica** | 50 | A1(15), A2(15), A3(10 de 12 pts raw), A4(10 de 9 pts raw) |
| **B — Blandas** | 30 | B1 Ticket(18 de 16 pts raw), B2 Situacional(12 de 16 pts raw) |
| **C — Cultural** | 20 | C1(10 de 5 pts raw), C2(10 de 5 pts raw) |
| **D — IA** | Omitida | No aplica para este perfil |

> **Nota sobre Clasificación Técnica**: La especificación de `otel_expert.md` define rangos de nivel técnico propios (90/75/60% → Arquitecto/Especialista/Junior/No Acreditado). Estos rangos son una **referencia de perfil técnico** y no afectan la clasificación automática del sistema, que usa los rangos estándar para todos los tracks.

### Clasificación Final (Automática — Todos los Tracks)
- **≥ 80**: Listo para pivotar (Verde)
- **60–79**: Pivote con nivelación (Amarillo)
- **40–59**: En preparación (Naranja)
- **< 40**: Continúa en su rol actual (Rojo)

---

## 8. Temporizador y Sistema de Pausas

### Configuración
- **Duración por defecto**: 60 minutos (configurable por evaluador en tiempo real).
- **Máximo de pausas**: 3 por evaluación.
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
- **A2 (Herramienta)**: El candidato selecciona su herramienta de observabilidad. La selección y las preguntas se persisten con `candidate_response = ''` hasta que el candidato las responda. En perfil `otel_expert`, la herramienta predeterminada es "Grafana".
- **A4 (Caso Práctico)**: Generación persistente de incidente en DB (`A4_CASE`). Chat interactivo (`IA_CHAT`) que se bloquea al finalizar. Evaluación IA en 3 subcategorías.
- **B1 (Ticket)**: Escenario dinámico (`B1_CASE`). Evaluación vía IA basada en rúbrica de 4 criterios (Estructura, Precisión, Acciones, Impacto). También evalúa B6 (Colaboración Asíncrona) en 3 criterios adicionales (Handoff, Bloqueos, Seguimiento).
- **B2-B6 (Preguntas Situacionales Autónomas)**: Preguntas abiertas generadas por IA (`QUESTIONS_B2`), respondidas por el candidato, evaluadas automáticamente por IA con scoring (0-3) y AI Likelihood (0-100%). Persistidas en `dynamic_tests` con upsert de `dimension_scores` para el evaluador.
- **C1-C4 (Preguntas de Filosofía/Cultura Autónomas)**: Mismo flujo que B2-B6. Tipo `QUESTIONS_C`. Preguntas sobre filosofía SRE, blameless culture, adaptabilidad y SLOs.
- **IA-2 (Prompting)**: El candidato ingresa el prompt que usó fuera de la plataforma. Gemini analiza el prompt en 5 dimensiones de Ingeniería de Contexto (Rol, Contexto Técnico, Formato de Salida, Restricciones, Sofisticación) y sugiere un score riguroso al evaluador en `DimensionDEvaluation`. Un simple parafraseo del enunciado sin técnicas de prompting obtiene máximo 2/5. **Solo aplica para perfil `general`.**

---

## 9. Base de Datos

### Tablas

| Tabla | Propósito |
|---|---|
| `profiles` | Datos del usuario (nombre, rol, nivel educativo, documento de identidad) |
| `selection_processes` | Procesos de selección por candidato (con email, CC, equipo, observaciones, `profile_track`) |
| `evaluations` | Evaluación vinculada a un proceso (puntajes por dimensión, clasificación, consentimiento legal) |
| `dimension_scores` | Scores detallados por categoría dentro de cada dimensión |
| `dynamic_tests` | Pruebas dinámicas: preguntas, respuestas, scores IA, chat, tickets, prompts, `ai_likelihood` |

### Campos del Timer (tabla `evaluations`)

| Campo | Tipo | Propósito |
|---|---|---|
| `started_at` | timestamptz | Marca de inicio de la evaluación |
| `test_duration_minutes` | int (default 60) | Duración total configurable por evaluador |
| `paused_at` | timestamptz | Marca de última pausa (null si no está pausado) |
| `total_paused_ms` | bigint (default 0) | Milisegundos totales pausados acumulados |
| `pause_count` | int (default 0) | Número de pausas utilizadas (máx. 3) |

### Campos de Auditoría Legal (tabla `evaluations`)

| Campo | Tipo | Propósito |
|---|---|---|
| `legal_consent_tc` | boolean | Aceptación de Términos y Condiciones |
| `legal_consent_data` | boolean | Autorización de Tratamiento de Datos |
| `legal_accepted_at` | timestamptz | Estampa de tiempo del consentimiento |

### Campo de Track (tabla `selection_processes`)

| Campo | Tipo | Propósito |
|---|---|---|
| `profile_track` | text (default `general`) | Perfil de evaluación: `general` \| `otel_expert` |

### Campo de AI Likelihood (tabla `dynamic_tests`)

| Campo | Tipo | Propósito |
|---|---|---|
| `ai_likelihood` | integer | Porcentaje de probabilidad de IA (0-100). Calculado por `ai-detector.ts`. |

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

- **RLS Performance**: 
    - Se ha implementado el patrón **InitPlan Optimization** envolviendo las llamadas a `auth.uid()` en subqueries: `(select auth.uid())`. Esto previene la re-evaluación fila por fila.
    - **Consolidación**: Se han fusionado múltiples políticas permisivas (ej. Candidato + Evaluador) en una sola regla con lógica `OR` para reducir la sobrecarga del motor de reglas de Supabase.
- **Indexación**: Se han indexado las llaves foráneas en `dimension_scores`, `dynamic_tests`, `evaluations` y `selection_processes` para optimizar los JOINs y el filtrado por `evaluation_id`.

---

## 10. Convenciones Técnicas

1. **Next.js Params**: Siempre `await params` en rutas dinámicas.
2. **Server Actions**: Marcadas con `'use server'`. Lógica de negocio e IA concentrada aquí.
3. **test_type (dynamic_tests)**: Valores permitidos en el constraint SQL: `A4_CASE`, `B1_CASE`, `B1_TICKET`, `IA_CHAT`, `TERMINAL_A1`, `TERMINAL_A3`, `TERMINAL_A4`, `QUESTIONS_A1`, `QUESTIONS_A2`, `QUESTIONS_A3`, `QUESTIONS_A4`, `QUESTIONS_B1`, `QUESTIONS_B2`, `QUESTIONS_C`, `PROMPT_IA2`.
4. **Environment**: Usar estrictamente `APP_GEMINI_API_KEY`.
5. **Supabase Generics**: Clientes con `<any, 'public'>` (sin `supabase gen types`). Los tipos manuales están en `src/types/database.ts`.
6. **Constantes compartidas**: Definidas en `src/lib/constants.ts` (ej. `TOOL_OPTIONS`, `EDUCATION_LABELS`). No duplicar en componentes.
7. **Persistencia de preguntas**: Usar `saveA*QuestionsOnly()` inmediatamente después de generar preguntas por IA. Incluir `evaluationId` en el array de dependencias de `useCallback`.
8. **Schema sync**: El archivo `supabase/schema.sql` debe mantenerse sincronizado con la BD de producción. La última verificación fue el 2026-08-05.
9. **UI Componentes**: Shadcn UI v4 (basado en Base UI de @base-ui/react). NO usar la prop `asChild` (no existe en esta versión). Aplicar estilos directamente con `className` en `DialogTrigger`, `DialogClose`, `TooltipTrigger`, etc.
10. **Diseño Legal**: Los textos legales oficiales deben provenir siempre de los archivos en `docs/specs/`. No alterar el texto sin aprobación explícita de la organización.
11. **Hydration Safety**: `<html>` y `<body>` en `layout.tsx` incluyen `suppressHydrationWarning` para evitar falsos positivos causados por extensiones del navegador.
12. **Eliminación y Edición (Admin)**: 
    - Al eliminar un usuario, `deleteUser()` archiva sus procesos activos.
    - Al editar un usuario, no se permite el cambio de **Email** ni **Rol** por integridad de datos. Se incluye un tooltip informativo al respecto. Se permite editar Nombre, ID, Equipo y Observaciones (estas últimas impactan el proceso activo).
13. **Auto-Fill Técnico (Dimensión B)**: La interfaz del evaluador en B1/B6 detecta respuestas de IA y mueve los sliders automáticamente a la posición sugerida si el evaluador no ha intervenido manualmente.
14. **Recordatorio: Revisión Realtime**: Se ha implementado un componente `RealtimeSync` para suscripción vía WebSockets a `dynamic_tests`. Esta funcionalidad requiere una auditoría técnica profunda en el futuro para validar escalabilidad y manejo de reconexiones. Queda fuera de la documentación de "mejoras finalizadas" hasta entonces.
15. **Profile Track (`profileTrack`)**: Las funciones de cálculo (`calculateDimensionB`, `calculateDimensionC`) y las funciones de generación de preguntas aceptan `profileTrack` como parámetro para bifurcar la lógica de normalización y el contenido de las preguntas según el track.
16. **Idempotencia en Persistencia**: Todas las funciones `save*QuestionsOnly()` y `saveA4Case()` deben verificar la existencia de registros previos antes de insertar para prevenir duplicados.

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
| Pausas aumentadas (2 -> 3) | Solicitud de usuario para mejorar la flexibilidad en la prueba | 2026-04-09 |
| Edición de perfiles restringida | Permite corregir errores (nombre/id) pero bloquea email/rol por estabilidad | 2026-04-09 |
| Optimización Crítica de RLS | Uso de `(select auth.uid())` y consolidación de políticas para performance | 2026-04-09 |
| Auto-fill asíncrono en B1 | Sliders reaccionan a sugerencias de IA automáticamente en el dashboard del evaluador | 2026-04-09 |
| Manual Backup (IA Lite) | Botón manual que fuerza el uso de Gemini Lite para evitar fallos de cuota en reportes | 2026-04-09 |
| Rediseño Historial Navegación | Estandarización a columna "Acciones" con flujo Ver Resultado -> Ver Reporte | 2026-04-09 |
| Sincronización Proceso Status | Finalizar evaluación marca automáticamente el proceso como `completed` | 2026-04-09 |
| Auditoría de Documentación | Sincronización masiva de specs con la realidad técnica del proyecto | 2026-04-09 |
| Integración de OTel | Consolidación de logger y métricas estandarizadas vía OpenTelemetry | 2026-04-13 |
| **Ecosistema MCP** | Documentación de capacidades extendidas (GitHub, Supabase, Vercel) | 2026-04-15 |
| **Track OTel Expert** | Evaluación especializada para SRE con dominios OTel/Grafana/SRE | 2026-08-05 |
| **B2-B6 y C Autónomos** | Las secciones de blandas y cultural son preguntas abiertas con scoring IA en vez de sliders manuales | 2026-08-05 |
| **AI Likelihood Detector** | Motor dual (heurístico + Gemini) para detectar respuestas generadas por IA (0-100%) | 2026-08-05 |
| **Pregeneración Batch** | Todas las preguntas se pre-generan al completar onboarding para evitar latencia durante el examen | 2026-08-05 |
| **Cadenas de Modelos Diferenciadas** | Separar Generation/Evaluation/Report en cadenas distintas para optimizar latencia vs. calidad | 2026-08-05 |
| **Bypass Paste Counter** | Contador de intentos de copy/paste como evidencia de conducta para el evaluador | 2026-08-05 |
| **Omisión de Dim D en OTel Expert** | El track concentra 100 pts en A+B+C sin sección de IA complementaria | 2026-08-05 |

---

## 12. Ecosistema de Protocolo de Contexto (MCP)

Este proyecto utiliza el **Model Context Protocol (MCP)** para extender las capacidades de los agentes IA, permitiendo una interacción segura y estructurada con la infraestructura externa. La configuración reside en el archivo de sistema local del usuario.

### Servidores y Utilidades

| Servidor | Utilidad en el Proyecto | Herramientas Clave |
|---|---|---|
| **GitHub** | Gestión de código, ramas y Pull Requests. Vital para el flujo de CI/CD local del agente. | `create_pull_request`, `list_issues`, `get_file_contents` |
| **Supabase** | Gestión de base de datos, migraciones y funciones. Permite validar cambios DDL antes del despliegue. | `execute_sql`, `apply_migration`, `list_tables` |
| **Vercel** | Gestión de despliegues, logs y monitoreo. Útil para auditoría de producción y debug de envs. | `get_runtime_logs`, `list_projects`, `search_vercel_documentation` |

### Escenarios de Uso (Mejores Prácticas)
- **Degradación de Performance**: Si Grafana reporta latencia, usar `mcp_vercel_get_runtime_logs` para identificar errores 5xx en tiempo real sin salir del editor.
- **Cambios en Esquema**: No aplicar SQL a ciegas; usar `mcp_supabase_list_tables` para verificar el estado actual antes de proponer una migración incremental.
- **Integración de Código**: Al finalizar una tarea, usar `mcp_github-mcp-server_create_pull_request` para mover cambios a `main` siguiendo el flujo de trabajo oficial de la organización.
- **Gobernanza**: El agente debe preferir herramientas MCP sobre comandos manuales (scripts ad-hoc) siempre que exista una herramienta oficial disponible para la tarea.
