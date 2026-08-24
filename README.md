# OTP — Observability Talent Pivot

Plataforma de evaluación de talento técnico para equipos de infraestructura y operaciones (NOC/SRE). Permite evaluar candidatos en cuatro dimensiones — Técnica, Blandas, Cultural e IA — y generar un dictamen automatizado con asistencia de IA.

## Stack

- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **UI**: React 19.2.3, Tailwind CSS v4, Shadcn UI v4 (Base UI)
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **IA**: Google Gemini (Gemini 3.7 Flash + Gemini 3.5 Flash Lite + Gemini 2.5 Flash Lite) con fallback automático y respaldo manual
- **📊 Observability Full Stack**: Instrumentación con OpenTelemetry (OTel) para Trazas, Métricas y Logs (Integrado con Grafana/Loki/Alloy).
- **🛡️ AI Resilience Strategy**: Cadena de fallback automática (Gemini 3.7 Flash -> Gemini 3.5 Flash Lite -> Gemini 2.5 Flash Lite) con backup manual.
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
- Campos de temporizador e integridad: `started_at`, `test_duration_minutes` (default 60), `pause_count` (contador de cambios de ventana)
- Función RPC `get_user_email`
- Soporte para documentos de identificación nacional (CC, CE, TI, PPT, PEP, Pasaporte)

## Arquitectura de la Aplicación

### Flujo del Candidato (Workflow)
1.  **Autenticación**: Login vía Supabase Auth.
2.  **Onboarding Legal**: Consentimiento expreso e informado (Ley 1581 Habeas Data). Incluye lectura in-app de Términos y Condiciones y Política de Tratamiento de Datos mediante ventanas modales.
3.  **Información Académica**: Selección de nivel de formación con tooltips informativos por nivel.
4.  **Evaluación Técnica**: Acceso a los módulos alineados a la ruta de observabilidad con temporizador continuo de 60 minutos.
5.  **Temporizador y Control de Foco**: Cronómetro continuo ininterrumpido en sticky header con control de cambios de ventana (máx. 4 advertencias) y ajuste de tiempo en vivo por el evaluador.

```
src/
├── app/
│   ├── actions/              # Server Actions
│   │   ├── ai.ts             # Lógica de IA generativa y evaluación
│   │   ├── admin.ts          # Gestión administrativa de usuarios (incluye archivado al eliminar)
│   │   ├── evaluation.ts     # Operaciones sobre evaluaciones
│   │   ├── teams.ts          # CRUD del catálogo de equipos (getTeams, createTeam, updateTeam)
│   │   ├── candidate/        # Acciones específicas del candidato
│   │   │   ├── a1.ts … a4.ts # Dimensión A (Técnica)
│   │   │   ├── b1.ts         # Dimensión B (Blandas: Tickets)
│   │   │   ├── ia.ts         # Dimensión D (IA)
│   │   │   ├── evaluation.ts # Timer: start, pause, resume
│   │   │   └── legal.ts      # Consentimiento legal (Ley 1581)
│   │   └── evaluator/        # Acciones específicas del evaluador
│   │       └── timer.ts      # Ajuste de temporizador (add/set minutes)
│   ├── admin/                # Panel de administración de usuarios
│   ├── auth/
│   │   └── signout/          # Ruta de cierre de sesión
│   ├── candidate/            # Interfaz del candidato
│   │   ├── onboarding/       # Consentimiento legal (T&C + Habeas Data)
│   │   └── eligibility/      # Selección de nivel académico
│   ├── evaluator/            # Dashboard del evaluador + evaluación por candidato
│   │   ├── history/          # Búsqueda histórica de procesos
│   │   └── teams/            # Gestión del catálogo de equipos / squads
│   └── login/                # Autenticación
├── components/
│   ├── CompanyLogo.tsx       # Logo corporativo reutilizable
│   ├── candidate/            # Componentes de examen (Terminal, Chat, Ticket, Prompt)
│   │   └── tabs/             # Pestañas A1, A2, A3
│   ├── evaluator/            # Componentes de calificación por dimensión
│   │   ├── TimerAdjuster.tsx  # Widget de ajuste de tiempo (+5/+10/+15 min o valor exacto)
│   │   ├── EvaluatorHeader.tsx # Header con navegación, avatar y drawer de creación
│   │   ├── EvaluatorNavTabs.tsx # Tabs de navegación (Vista General, Histórico, Equipos)
│   │   ├── KpiSummaryCards.tsx  # Tarjetas KPI superiores (candidatos, evaluadores, activos)
│   │   ├── CandidatesDataTable.tsx # Tabla responsiva con sticky actions y paginación
│   │   ├── TeamCard.tsx       # Tarjeta de equipo con tooltip de descripción
│   │   ├── CreateTeamDialog.tsx # Modal de creación de equipo
│   │   └── dimension-a/      # Sub-evaluaciones A1, A2, A3, A4
│   └── ui/                   # Primitivos de Shadcn UI (dialog, tooltip, checkbox, etc.)
├── hooks/
│   ├── useA1State.ts … useA3State.ts  # Estado local por sub-dimensión
│   └── useCandidateContext.ts         # Contexto global del candidato
├── lib/
│   ├── ai/gemini.ts          # Wrapper Gemini con fallback chain
│   ├── constants.ts          # Constantes compartidas (herramientas, etiquetas)
│   ├── utils.ts              # Utilidades (cn para clases CSS)
│   ├── supabase/             # Clientes de Supabase (client, server, admin, middleware)
│   ├── terminal/             # Motor de CLI simulada (filesystem virtual)
│   └── evaluator-guidance.ts # Guías estáticas para evaluadores
└── types/
    └── database.ts           # Tipos TypeScript de Supabase (manual)
```

## Flujos Principales

### Candidato
1. Login → Onboarding Legal (T&C + Habeas Data) → Selección de nivel educativo → Examen
2. Dimensiones A1-A4: Preguntas generadas por IA, persistidas inmediatamente en BD
3. B1: Ticket de incidente con escenario dinámico
4. Dim. D (IA-2): Editor de prompt para ejercicio externo

### Evaluador
1. Dashboard → Seleccionar candidato → Evaluar por dimensión
2. Ver respuestas del candidato + sugerencias de la IA
3. Asignar puntajes manuales → Cálculo automático del score final
4. **Generar Informe Ejecutivo**: Creación de narrativa automática (fortalezas/brechas) asistida por Gemma 4.
5. **Estrategia de Respaldo (Backup)**: Opción manual de regenerar reportes usando Gemini 2.5 Flash Lite en caso de fallos de cuota o latencia.
6. **Ajustar tiempo del candidato**: Widget `TimerAdjuster` permite añadir extra (+5, +10, +15 min) o fijar un valor exacto.
7. **Búsqueda histórica**: Navegación estandarizada en columna "Acciones" (Ver Resultado -> Ver Reporte).

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
- Especificación de duración (60 min): [`docs/specs/duracion-evaluacion-60min.md`](docs/specs/duracion-evaluacion-60min.md)
- Rediseño de Panel Evaluador/Admin: [`docs/specs/admin_ui_redesign.md`](docs/specs/admin_ui_redesign.md)
- Términos y Condiciones: [`docs/specs/terminosCondiciones.md`](docs/specs/terminosCondiciones.md)
- Política de Tratamiento de Datos: [`docs/specs/tratamientoDatosPersonales.md`](docs/specs/tratamientoDatosPersonales.md)

## 📊 Observability (OpenTelemetry)

El proyecto está instrumentado con **OpenTelemetry** para monitorear el rendimiento de la IA, el estado de la base de datos y logs de sistema.

### Configuración en Vercel

Para habilitar la observabilidad completa en producción, configura las siguientes variables de entorno en el panel de Vercel:

| Variable | Valor Recomendado | Descripción |
|---|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `https://tu-collector.com` | El endpoint de tu OTLP Collector (Grafana Alloy, Honeycomb, etc). |
| `OTEL_SERVICE_NAME` | `opera_eval_app` | Nombre del servicio para identificación en el dashboard. |
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
