# OTP — Observability Talent Pivot

Plataforma de evaluación de talento técnico para equipos de infraestructura y operaciones (NOC/SRE). Permite evaluar candidatos en cuatro dimensiones — Técnica, Blandas, Cultural e IA — y generar un dictamen automatizado con asistencia de IA. Soporta múltiples perfiles de evaluación (`general` y `otel_expert`).

## Stack

- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **UI**: React 19.2.3, Tailwind CSS v4, Shadcn UI v4 (Base UI)
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **IA**: Google Gemini (Gemini 3.7 Flash + Gemini 3.5 Flash Lite + Gemini 2.5 Flash Lite) con fallback automático y respaldo manual
- **📊 Observability Full Stack**: Instrumentación con OpenTelemetry (OTel) para Trazas, Métricas y Logs (Integrado con Grafana/Loki/Alloy).
- **🛡️ AI Resilience Strategy**: Cadena de fallback automática con backup manual.
- **🔍 AI Likelihood Detector**: Motor dual (heurístico + Gemini) para detectar respuestas generadas por IA (0-100%).
- **Animaciones**: Framer Motion v12.35
- **Despliegue**: Vercel (auto-deploy desde `main`)

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales de Supabase y Gemini

# 3. Ejecutar en desarrollo
npm run dev
```

### Variables de Entorno Requeridas

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (gestión de usuarios vía admin) |
| `APP_GEMINI_API_KEY` | API Key de Google Gemini (**NO** usar `GEMINI_API_KEY`) |

## Base de Datos

El esquema SQL completo está en [`supabase/schema.sql`](supabase/schema.sql). Incluye:
- 6 tablas: `profiles`, `selection_processes`, `evaluations`, `dimension_scores`, `dynamic_tests`, `teams`
- RLS policies optimizadas para alto rendimiento (InitPlan optimization & Policy Consolidation)
- Campos de auditoría legal: `legal_consent_tc`, `legal_consent_data`, `legal_accepted_at` en `evaluations`
- Campos de temporizador e integridad: `started_at`, `test_duration_minutes` (default 60), `tab_switch_count` (máx. 4 cambios de ventana)
- Campo `profile_track` en `selection_processes` (`general` | `otel_expert`)
- Campo `ai_likelihood` en `dynamic_tests` — porcentaje de probabilidad de IA (0-100)
- Función RPC `get_user_email`
- Soporte para documentos de identificación nacional (CC, CE, TI, PPT, PEP, Pasaporte)

## Arquitectura de la Aplicación

### Perfiles de Evaluación (Tracks)

| Track | Descripción | Dimensiones Activas |
|---|---|---|
| `general` | Pivote de Soporte → Analista de Observabilidad Junior | A + B (6 sub) + C (4 sub) + D (IA) |
| `otel_expert` | SRE Experto en OpenTelemetry & Grafana Cloud | A + B (2 sub) + C (2 sub). Sin Dim D |

### Flujo del Candidato (Workflow)
1.  **Autenticación**: Login vía Supabase Auth.
2.  **Onboarding Legal**: Consentimiento expreso e informado (Ley 1581 Habeas Data). Incluye lectura in-app de Términos y Condiciones y Política de Tratamiento de Datos mediante ventanas modales.
3.  **Información Académica**: Selección de nivel de formación con tooltips informativos por nivel.
4.  **Pregeneración & Evaluación Técnica**: Al completar el onboarding se preparan los módulos del candidato con temporizador de 60 minutos.
5.  **Temporizador y Control de Foco**: Cronómetro continuo ininterrumpido en sticky header con control de cambios de ventana (máx. 4 advertencias) y ajuste de tiempo en vivo por el evaluador.

```
src/
├── app/
│   ├── actions/              # Server Actions
│   │   ├── ai.ts             # Lógica de IA generativa y evaluación
│   │   ├── ai-detector.ts    # Motor de detección de IA (heurístico + Gemini)
│   │   ├── admin.ts          # Gestión administrativa de usuarios (incluye archivado al eliminar)
│   │   ├── evaluation.ts     # Operaciones sobre evaluaciones y cálculos de normalización por track
│   │   ├── teams.ts          # CRUD del catálogo de equipos (getTeams, createTeam, updateTeam)
│   │   ├── candidate/        # Acciones específicas del candidato
│   │   │   ├── a1.ts … a4.ts # Dimensión A (Técnica)
│   │   │   ├── b1.ts         # Dimensión B (Blandas: Tickets)
│   │   │   ├── b2.ts         # Dimensión B (Blandas: Preguntas situacionales B2-B6)
│   │   │   ├── c.ts          # Dimensión C (Cultural: Preguntas de filosofía C1-C4)
│   │   │   ├── ia.ts         # Dimensión D (IA)
│   │   │   ├── evaluation.ts # Timer: start, pause, resume
│   │   │   ├── legal.ts      # Consentimiento legal (Ley 1581)
│   │   │   └── pregen.ts     # Pregeneración batch de preguntas al completar onboarding
│   │   └── evaluator/        # Acciones específicas del evaluador
│   │       ├── reports.ts    # Finalización de evaluación y reporte narrativo con IA
│   │       └── timer.ts      # Ajuste de temporizador (add/set minutes)
│   ├── admin/                # Panel de administración de usuarios (redirige a /evaluator)
│   ├── auth/
│   │   └── signout/          # Ruta de cierre de sesión
│   ├── candidate/            # Interfaz del candidato
│   │   ├── onboarding/       # Consentimiento legal (T&C + Habeas Data)
│   │   └── eligibility/      # Selección de nivel académico + trigger de pregeneración
│   ├── evaluator/            # Dashboard del evaluador + evaluación por candidato
│   │   ├── history/          # Búsqueda histórica de procesos
│   │   ├── teams/            # Gestión del catálogo de equipos / squads
│   │   └── evaluators/       # Gestión de evaluadores y credenciales
│   └── login/                # Autenticación
├── components/
│   ├── CompanyLogo.tsx       # Logo corporativo reutilizable
│   ├── candidate/            # Componentes de examen (Terminal, Chat, Ticket, Prompt, QuestionPanel)
│   │   └── tabs/             # Pestañas A1, A2, A3
│   ├── evaluator/            # Componentes de calificación por dimensión
│   │   ├── AiLikelihoodBadge.tsx  # Badge de probabilidad de IA (LOW/MEDIUM/HIGH)
│   │   ├── TimerAdjuster.tsx      # Widget de ajuste de tiempo (+5/+10/+15 min o valor exacto)
│   │   ├── RealtimeSync.tsx       # Suscripción WebSocket a dynamic_tests
│   │   ├── RegenerateAIButton.tsx # Botón de regeneración de reporte (modelo Lite)
│   │   ├── PrintReportButton.tsx  # Botón de impresión de reporte
│   │   ├── CopyButton.tsx         # Botón de copia de contenido
│   │   ├── EvaluatorHeader.tsx    # Header con navegación, avatar y drawer de creación
│   │   ├── EvaluatorNavTabs.tsx   # Tabs de navegación (Vista General, Histórico, Equipos)
│   │   ├── KpiSummaryCards.tsx    # Tarjetas KPI superiores (candidatos, evaluadores, activos)
│   │   ├── CandidatesDataTable.tsx # Tabla responsiva con sticky actions y paginación
│   │   ├── TeamCard.tsx           # Tarjeta de equipo con tooltip de descripción
│   │   ├── CreateTeamDialog.tsx   # Modal de creación de equipo
│   │   ├── UserCreationSheet.tsx  # Drawer lateral para crear usuarios con equipo del catálogo
│   │   └── dimension-a/           # Sub-evaluaciones A1, A2, A3, A4 + constantes
│   └── ui/                   # Primitivos de Shadcn UI (dialog, tooltip, checkbox, etc.)
├── context/
│   └── CandidateContext.tsx  # Contexto global del candidato (evaluación, legal, educación, track)
├── hooks/
│   ├── useA1State.ts … useA3State.ts  # Estado local por sub-dimensión A
│   ├── useB2State.ts                  # Estado local sección B2-B6
│   ├── useCState.ts                   # Estado local sección C1-C4
│   └── useCandidateContext.ts         # Hook de acceso al contexto global
├── lib/
│   ├── ai/gemini.ts          # Wrapper Gemini con 3 cadenas de fallback
│   ├── constants.ts          # Constantes compartidas (herramientas, etiquetas)
│   ├── utils.ts              # Utilidades (cn para clases CSS)
│   ├── supabase/             # Clientes de Supabase (client, server, admin, middleware)
│   ├── terminal/             # Motor de CLI simulada (filesystem virtual)
│   ├── observability/        # Instrumentación OTel (logger.ts, metrics.ts)
│   └── evaluator-guidance.ts # Guías estáticas para evaluadores (general + otel_expert)
└── types/
    └── database.ts           # Tipos TypeScript de Supabase (manual)
```

## Flujos Principales

### Candidato
1. Login → Onboarding Legal (T&C + Habeas Data) → Selección de nivel educativo → Pregeneración → Examen
2. Dimensiones A1-A4: Preguntas generadas por IA, persistidas inmediatamente en BD
3. B1: Ticket de incidente con escenario dinámico
4. B2-B6: Preguntas situacionales autónomas (generadas por IA, respondidas por candidato, evaluadas por IA con AI Likelihood)
5. C1-C4: Preguntas de filosofía/cultura autónomas (mismo flujo que B2-B6)
6. Dim. D (IA-2): Editor de prompt para ejercicio externo (solo perfil `general`)

### Evaluador
1. Dashboard → Seleccionar candidato → Evaluar por dimensión
2. Ver respuestas del candidato + sugerencias de la IA + **AI Likelihood Badges** (LOW/MEDIUM/HIGH)
3. Ver **bypass paste counter** para auditar la conducta del candidato
4. Asignar puntajes manuales → Cálculo automático del score final
5. **Generar Informe Ejecutivo**: Creación de narrativa automática (fortalezas/brechas) asistida por IA.
6. **Estrategia de Respaldo (Backup)**: Opción manual de regenerar reportes usando modelo Lite en caso de fallos de cuota o latencia.
7. **Ajustar tiempo del candidato**: Widget `TimerAdjuster` permite añadir extra (+5, +10, +15 min) o fijar un valor exacto.
8. **Búsqueda histórica**: Navegación estandarizada en columna "Acciones" (Ver Resultado -> Ver Reporte).

### Admin
1. Gestión de usuarios (crear, editar, eliminar)
2. Edición: Permite corregir Nombre e Identificación (CC/CE/etc.) y datos del proceso (Equipo/Observaciones). No permite cambio de Email o Rol por estabilidad.
3. Al eliminar un candidato, sus procesos activos se marcan como `archived` (no se borran)
4. Esto permite recrear el mismo email en un nuevo proceso sin conflictos
5. **Gestión de Equipos / Squads**: Catálogo oficial de 19 equipos en `public.teams`. Creación de nuevos equipos desde `/evaluator/teams` con nombre en mayúscula sostenida y descripción. Selector dinámico en el formulario de creación de usuario y en la búsqueda histórica.

## Documentación Técnica

> **Regla de Oro:** Todas las especificaciones, manuales, rúbricas y documentaciones de arquitectura deben residir **exclusivamente** dentro de `/docs/specs`. De esta manera se evita la duplicidad de fuentes de verdad.

- Especificación completa: [`docs/specs/AGENTS.md`](docs/specs/AGENTS.md)
- Modelo de evaluación detallado: [`docs/specs/modelo-evaluacion-talento-tecnico.md`](docs/specs/modelo-evaluacion-talento-tecnico.md)
- Especificación OTel Expert: [`docs/specs/otel_expert.md`](docs/specs/otel_expert.md)
- Especificación de duración (60 min): [`docs/specs/duracion-evaluacion-60min.md`](docs/specs/duracion-evaluacion-60min.md)
- Rediseño de Panel Evaluador/Admin: [`docs/specs/admin_ui_redesign.md`](docs/specs/admin_ui_redesign.md)
- Términos y Condiciones: [`docs/specs/terminosCondiciones.md`](docs/specs/terminosCondiciones.md)
- Política de Tratamiento de Datos: [`docs/specs/tratamientoDatosPersonales.md`](docs/specs/tratamientoDatosPersonales.md)

> **Archivos Deprecated:** Los siguientes archivos en `/docs/specs/` son borradores históricos y **no deben usarse como fuente de verdad**: `modelodeavaluación.txt`, `perfilanalistas.txt`, `promptincial.txt`.

## 📊 Observability (OpenTelemetry)

El proyecto está instrumentado con **OpenTelemetry** para monitorear el rendimiento de la IA, el estado de la base de datos y logs de sistema.

### Configuración en Vercel

Para habilitar la observabilidad completa en producción, configura las siguientes variables de entorno en el panel de Vercel:

| Variable | Valor Recomendado | Descripción |
|---|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `https://tu-collector.com` | El endpoint de tu OTLP Collector (Grafana Alloy, Honeycomb, etc). |
| `OTEL_EXPORTER_OTLP_HEADERS` | `Authorization=Basic <hash>` | Header de autenticación para el collector (Base64 de `InstanceID:ApiToken`). |
| `OTEL_SERVICE_NAME` | `seti_eval_app` | Nombre canónico del servicio para identificación en el dashboard. |
| `OTEL_SERVICE_NAMESPACE` | `talento-humano` | Namespace del servicio. |
| `OTEL_DEPLOYMENT_ENVIRONMENT` | `production` | Ambiente de despliegue. |
| `OTEL_RESOURCE_ATTRIBUTES` | `env=prod,client.name=seti,...` | Atributos de recurso adicionales (owner.team, client, etc). |
| `OTEL_LOG_INFO_ENABLED` | `true` | Habilita el envío de logs de nivel INFO al collector. |
| `OTEL_LOG_DEBUG_ENABLED` | `false` | (Opcional) Habilita logs detallados (usar solo para debugging). |
| `OTEL_GENAI_CAPTURE_CONTENT` | `true` | Captura los prompts y completions de la IA en los Spans (Auditado). |

> [!TIP]
> En desarrollo local, los logs también se emiten a la consola en formato JSON estructurado para facilitar la depuración sin necesidad de un collector externo.

## Scripts

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción con verificación TypeScript
npm run start     # Servir build de producción
npm run lint      # ESLint
```
