# AGENTS.md — OTP (Observability Talent Pivot)

## 1. Propósito del Proyecto

**OTP** es una plataforma de evaluación de talento técnico para equipos de infraestructura y operaciones. Permite a un **Evaluador** calificar a un **Candidato** en tres dimensiones (Técnica, Blandas, Cultural) y obtener un dictamen automatizado asistido por IA.

> Diseñada originalmente para el pivote Ópera → Analista Junior de Observabilidad, pero construida de forma genérica y reutilizable.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| UI | React + Tailwind CSS v4 + Shadcn UI v4 (base-ui) | React 19.2.3 |
| Lenguaje | TypeScript | ^5 |
| Base de datos | Supabase (PostgreSQL + Auth + RLS) | SDK 2.98 |
| IA Generativa | Google Gemini (2 modelos) | SDK 0.24.1 |
| Gráficos | Recharts | ^3.8 |
| Animaciones | Framer Motion | ^12.35 |
| Iconos | Lucide React | ^0.577 |
| Despliegue | Vercel | — |

---

## 3. Modelos de IA (Fallback & Cost-Efficiency Strategy)

Configuración en `src/lib/ai/gemini.ts`.

| Perfil | Modelo | Uso |
|---|---|---|
| **Principal** (Costo $0) | `gemma-3-27b-it` | Generación de escenarios, preguntas, chatbot y evaluación estricta en JSON. |
| **Respaldo** (Económico) | `gemini-2.5-flash-lite` | Fallback universal en caso de errores de cuota (429) o disponibilidad (503) del modelo principal. |

- **Generación y Evaluación**: Toda la carga de IA recae sobre Gemma 3, optimizando los costos de la plataforma al 100% mientras se mantiene el formato JSON.
- **Resiliencia (Fallback)**: Si Gemma falla, el sistema conmuta automáticamente (sin interrumpir al usuario) hacia Gemini 2.5 Flash Lite.
- **Deprecación**: NOTA: Los modelos 1.5 y 2.0 (flash/pro) han sido deprecados u observan cuotas muy estrictas para esta API a favor de las versiones 2.5 y 3.1.
- **PII Filter**: `sanitizePII()` está **DESHABILITADO** — retorna el texto sin modificar. Se desactivó porque eliminaba timestamps y datos técnicos simulados (falsos positivos).
- **Retry**: Exponential backoff (2s × 2^attempt) combinada con rotación del modelo en la Fallback Chain.
- **Variable de entorno**: Usa `APP_GEMINI_API_KEY` (NO `GEMINI_API_KEY`) para evitar colisión con la variable global del sistema usada por Gemini CLI.

---

## 4. Arquitectura de Carpetas

```
opera_eval_app/
├── docs/specs/                     # Documentación del proyecto
│   ├── AGENTS.md                   # Este archivo
│   └── modelo-evaluacion-noc.md    # Rúbricas, escalas, criterios completos
├── supabase/
│   └── schema.sql                  # DDL completo: tablas, RLS policies
├── src/
│   ├── lib/
│   │   ├── utils.ts                # Helpers (cn)
│   │   ├── ai/
│   │   │   └── gemini.ts           # Wrapper Gemini: modelos, retry (PII filter deshabilitado)
│   │   ├── terminal/               # Motor de terminal simulada
│   │   └── supabase/
│   │       ├── client.ts           # createBrowserClient
│   │       ├── server.ts           # createServerClient (async cookies)
│   │       └── middleware.ts       # Auth + routing + eligibility
│   ├── components/
│   │   ├── ui/                     # Shadcn UI (button, card, table, tabs…)
│   │   ├── candidate/
│   │   │   ├── TerminalSandbox.tsx  # Terminal Linux simulada
│   │   │   ├── QuestionPanel.tsx    # Panel de preguntas genérico
│   │   │   ├── ChatbotA4.tsx        # Chat IA (módulo A4)
│   │   │   └── TicketEditor.tsx     # Editor de ticket B1
│   │   └── evaluator/
│   │       ├── DimensionAEvaluation.tsx  # A1 per-subcategory + A2-A4
│   │       ├── DimensionBEvaluation.tsx  # Dim. B
│   │       ├── DimensionCEvaluation.tsx  # Dim. C
│   │       ├── FinalScoreCard.tsx        # Widget lateral dictamen
│   │       └── RadarChartComponent.tsx   # Gráfico Radar
│   └── app/
│       ├── page.tsx                # Landing (genérica)
│       ├── login/page.tsx          # Login (Supabase Auth)
│       ├── auth/signout/route.ts   # POST: cierre de sesión
│       ├── admin/page.tsx          # Gestión de usuarios (evaluator-only)
│       ├── candidate/
│       │   ├── eligibility/page.tsx # Selección de escolaridad (obligatorio)
│       │   └── page.tsx            # Dashboard candidato (5 tabs: A1-A4, B1)
│       ├── evaluator/
│       │   ├── page.tsx            # Dashboard evaluador
│       │   └── evaluate/[id]/page.tsx  # Evaluación individual
│       └── actions/
│           ├── ai.ts               # Server Actions IA (A1-A4, B1)
│           ├── candidate.ts        # CRUD A1-A4 (save, get, reset, state)
│           ├── admin.ts            # listUsers, createUser, deleteUser
│           └── evaluation.ts       # saveDimensionScores, finalizeEvaluation
```

---

## 5. Rutas y Seguridad

### Rutas

| Ruta | Rol | Descripción |
|---|---|---|
| `/` | Público | Landing page genérica |
| `/login` | Público | Autenticación Supabase |
| `/candidate/eligibility` | Candidato | Selección de nivel educativo (obligatorio) |
| `/candidate` | Candidato | Panel de evaluación (5 tabs) |
| `/evaluator` | Evaluador | Dashboard con lista de candidatos |
| `/evaluator/evaluate/[id]` | Evaluador | Evaluación individual (Dims A, B, C) |
| `/admin` | Evaluador | Gestión de usuarios |

### Middleware (`src/lib/supabase/middleware.ts`)

1. **Rutas protegidas**: `/evaluator`, `/candidate`, `/admin` requieren autenticación → redirect a `/login`
2. **Admin solo evaluadores**: `/admin` verifica `role = 'evaluator'` → candidatos redirigidos a `/candidate`
3. **Eligibility obligatorio**: Candidatos sin `education_level` → redirigidos a `/candidate/eligibility`
4. **Login redirect**: Sesión activa + `/login` → redirige al dashboard según rol

### RLS (Row Level Security)

| Tabla | Candidatos | Evaluadores |
|---|---|---|
| `profiles` | SELECT propio | SELECT todos |
| `evaluations` | SELECT propias | SELECT/INSERT/UPDATE todas |
| `dimension_scores` | — | INSERT/UPDATE/SELECT |
| `dynamic_tests` | INSERT/UPDATE propios | SELECT/INSERT/UPDATE/DELETE |

> DELETE en `dynamic_tests` solo para evaluadores (funcionalidad de reset A1-A4).

---

## 6. Modelo de Evaluación

### Dimensiones y Pesos

| Dimensión | Categorías | Máx. Puntos |
|---|---|---|
| **A — Técnica** | A1 (15), A2 (15), A3 (10 normalizado de 12), A4 (10) | 50 |
| **B — Blandas** | B1 (7), B2 (7), B3 (4), B4 (4), B5 (4), B6 (4) | 30 |
| **C — Cultural** | C1 (5), C2 (5), C3 (5), C4 (5) | 20 |
| **Total** | | **100** |

### Clasificación Final

| Rango | Clasificación | Color |
|---|---|---|
| ≥ 80 | Listo para pivotar | Verde `#10B981` |
| 60–79 | Pivote con nivelación | Amarillo `#F59E0B` |
| 40–59 | En preparación | Naranja `#F97316` |
| < 40 | Requiere más desarrollo | Rojo `#EF4444` |

### A1-A3 — Flujo de Preguntas (patrón compartido)

Escala 0-3 per-subcategory con colores semáforo:

| Score | Color | Label |
|---|---|---|
| 0 | 🔴 Rojo | Sin conocimiento |
| 1 | 🟠 Naranja | Básico |
| 2 | 🟢 Verde oscuro | Funcional |
| 3 | 💚 Verde fluorescente | Autónomo |

**Flujo (A1, A2, A3):**
1. Candidato → tab correspondiente → "Generar Preguntas" (IA genera preguntas adaptadas a escolaridad)
2. Candidato responde → "Guardar Respuestas" → se guardan en `dynamic_tests` (inmutables)
3. IA evalúa cada respuesta con score 0-3 y justificación
4. Evaluador ve: pregunta, respuesta, score IA, justificación
5. Evaluador ajusta scores (colores + leyenda), agrega comentarios → "Guardar Dimensión A"
6. Evaluador puede "Actualizar" (refrescar datos sin recargar) o "Resetear" (limpiar todo)

**Total color-coded:** Barra de progreso con label de nivel (Bajo/Básico/Funcional/Autónomo).

### A4 — Caso Práctico / Chat IA (Pensamiento Analítico)

**Subcategorías (escala 0-3 cada una):**
- **A4.1**: Identificación de Fuentes — ¿Pidió logs, métricas o estados de servicios correctos?
- **A4.2**: Lógica de Investigación — ¿Flujo coherente o peticiones al azar?
- **A4.3**: Diagnóstico y Resolución — ¿Llegó a la causa raíz?

**Flujo:**
1. Candidato → tab A4 → se genera un caso de incidente (IA) y se **persiste en DB** (`CASE_A4`)
2. Candidato investiga a través de un chat IA simulando una consola de logs/backend
3. Candidato hace clic en "Finalizar Investigación" → el chat se **bloquea permanentemente**
4. IA evalúa el historial completo en las 3 subcategorías (0-3)
5. El historial y scores se guardan en `dynamic_tests` (`IA_CHAT` + `QUESTIONS_A4`)
6. Al recargar la página, el caso y la conversación se **restauran desde DB** (no se regeneran)
7. Si el evaluador resetea A4, todo se limpia y el candidato puede reiniciar

- **Persistencia de Escenario:** El caso de B1 ahora se guarda en la DB (`B1_CASE`) al generarse por primera vez. Esto evita que cambie al recargar el navegador. He mejorado esta lógica con verificaciones anti-duplicados y manejo de errores explícito.

**Persistencia inteligente:**
- `saveA4Case()` — guarda el caso generado al crear por primera vez
- `getA4State()` — recupera caso, historial y estado de bloqueo
- `saveA4ChatSession`: Guarda historial y dispara evaluación 3 subcategorías.
- `saveB1Response`: Guarda ticket B1 y dispara evaluación rúbrica 4 criterios.
- `saveB1Case`: Guarda el escenario B1 persistente.
- `getB1State`: Recupera ticket y escenario persistente de B1.
- `resetBResponses`: Limpieza total de Dimensión B (B1-B6).
- `saveA4ChatSession()` — guarda historial y dispara evaluación IA
- `resetA4Responses()` — limpia caso, chat, scores y terminal

---

### 🎨 UX & UI Features
- **Colorimetría Semáforo**: Sliders en Dim A y B con colores dinámicos (Rojo -> Naranja -> Verde Fluorescente).
- **Flujo Secuencial**: Guías visuales en el evaluador para coordinar pruebas escritas y verbales.
- **Persistencia**: Carga de estado inicial en todos los módulos dinámicos (A4, B1) para evitar regeneraciones accidentales.
- **Bloqueo Post-Envío**: Deshabilitación de inputs una vez el candidato finaliza su participación.

## 7. Server Actions

| Archivo | Funciones |
|---|---|
| `actions/ai.ts` | `generateQuestionsA1/A2/A3`, `evaluateAnswersA1/A2/A3`, `generateDynamicCaseA4`, `handleCandidateChat`, `evaluateA4Chat`, `generateIncidentCaseB1`, `evaluateTicketB1Detailed`, `generateFinalInsights` |
| `actions/candidate.ts` | `save/get/resetA1Responses`, `save/get/resetA2Responses`, `save/get/resetA3Responses`, `saveA4Case`, `getA4State`, `saveA4ChatSession`, `getA4Results`, `resetA4Responses`, `saveB1Response`, `getB1State`, `resetBResponses` |
| `actions/admin.ts` | `listUsers`, `createUser`, `deleteUser` |
| `actions/evaluation.ts` | `saveDimensionScores`, `finalizeEvaluation`, `normalizeA3`, `normalizeA4`, `calculateDimensionA/B/C`, `calculateFinalScoreAndClassification` |

---

## 8. UX Features

- **Tabs keepMounted**: Componentes no se desmontan al cambiar tabs → estado persiste
- **A1-A3 persistence**: Respuestas guardadas se cargan de DB al recargar (read-only)
- **A4 persistence**: Caso práctico, historial de chat y estado de bloqueo se persisten en DB. No se regenera el caso al recargar.
- **Autoscroll**: Chat de candidato (A4) y visor de historial del evaluador se desplazan automáticamente al último mensaje.
- **Color-coded scoring**: Barras y botones con colores semáforo por calificación (0-3)
- **Candidate identity header**: Nombre, email y badge de escolaridad en el panel
- **Admin refresh**: Botón "Recargar" en tabla de usuarios
- **Evaluator refresh**: Botón "Actualizar" para traer respuestas sin recargar página (A1-A4)
- **Evaluator reset**: Botones "Resetear" por módulo (A1-A4) para que el candidato reinicie (con confirmación)

---

## 9. Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # Solo server-side (admin actions)
APP_GEMINI_API_KEY=AIza...           # Solo server-side. IMPORTANTE: NO usar GEMINI_API_KEY (colisiona con Gemini CLI global)
```

> [!CAUTION]
> **NO usar `GEMINI_API_KEY`** como nombre de variable. El sistema tiene esa variable globalmente para Gemini CLI, lo que causa que el valor de `.env.local` sea sobreescrito por la del entorno del SO. Usar siempre `APP_GEMINI_API_KEY`.

---

## 10. Comandos de Desarrollo

```bash
npm run dev       # Servidor de desarrollo (Turbopack, localhost:3000)
npm run build     # Build de producción con verificación TypeScript
npm run start     # Serve del build de producción
npm run lint      # ESLint
```

---

## 11. Convenciones Técnicas

1. **Supabase Generics**: Clientes con `<any, 'public'>` (sin `supabase gen types`).
2. **Next.js 15+ Params**: Rutas dinámicas usan `params: Promise<{ id: string }>` + `await params`.
3. **Server Actions (`'use server'`)**: Toda la lógica de scoring e IA es server-side.
4. **PostgREST Embeds**: FK ambiguas usan hint: `evaluations!evaluations_candidate_id_fkey(...)`.
5. **PII Filtering**: DESHABILITADO — `sanitizePII()` retorna el texto sin modificar. Se desactivó por falsos positivos con timestamps y datos técnicos simulados.
6. **Modelo diferenciado**: Generación (`gemini-2.5-flash-lite`) vs Evaluación (`gemini-3.1-flash-lite-preview`).
7. **Persistencia A4**: Caso, historial y estado se almacenan en `dynamic_tests` con tipos `A4_CASE`, `IA_CHAT`, `QUESTIONS_A4`.
8. **Variable de entorno IA**: Siempre `APP_GEMINI_API_KEY`, nunca `GEMINI_API_KEY`.
9. **Constraint `dynamic_tests.test_type`**: Valores permitidos: `QUESTIONS_A1`, `QUESTIONS_A2`, `QUESTIONS_A3`, `QUESTIONS_A4`, `TERMINAL_A3`, `TERMINAL_A4`, `IA_CHAT`, `A4_CASE`, `B1_TICKET`.

---

## 12. Flujo Principal

```
                    Login
┌──────────┐  ──────────────▶  ┌─────────────────┐
│  /login  │                   │  Supabase Auth   │
└──────────┘                   └────────┬─────────┘
                                        │ role?
                          ┌─────────────┴──────────────┐
                          ▼                            ▼
              /candidate/eligibility             /evaluator
              (si no tiene education_level)       (Dashboard)
                          │                            │
                          ▼                            │ click "Evaluar"
                    /candidate                         ▼
                    (Identity Header +          /evaluator/evaluate/[id]
                     5 tabs: A1-B1)                    │
                          │                    ┌───────┼───────┐
             ┌────────────┼────────┐           ▼       ▼       ▼
             ▼      ▼     ▼     ▼  ▼        Dim.A   Dim.B   Dim.C
           A1:Infra A2  A3:Git A4  B1       (refresh, reset,
           (IA Q&A)       (Chat)   (Ticket)  color scoring)
             │                                      │
             ▼                                      ▼
        Guardar →                          "Generar Dictamen"
        respuestas                                  │
        inmutables                         Score + Clasificación
                                           → Completado ✅
```

---

## 13. Estado Actual y Próximos Pasos

### Completado ✅
- A1, A2, A3, A4: Persistencia, scoring per-subcategory, colores semáforo
- A4: Persistencia de caso, restauración de historial, bloqueo post-finalización
- B1: Generación de caso con rúbrica detallada (4 criterios, normalización /7)
- Autoscroll en chat candidato y visor evaluador
- Aislamiento de variable de entorno (`APP_GEMINI_API_KEY`)
- PII filter deshabilitado para preservar datos técnicos

### Pendiente 🔲
- Extender Dimensiones B (B2-B6) y C (C1-C4) con flujo de evaluación IA
- Despliegue en Vercel (verificar variables de entorno en producción)
