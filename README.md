# OTP — Observability Talent Pivot

Plataforma de evaluación de talento técnico para equipos de infraestructura y operaciones (NOC/SRE). Permite evaluar candidatos en cuatro dimensiones — Técnica, Blandas, Cultural e IA — y generar un dictamen automatizado con asistencia de IA.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS v4, Shadcn UI v4 (Base UI)
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **IA**: Google Gemini (Gemma 3, Gemma 4 + Gemini 2.5 Flash Lite) con fallback automático y respaldo manual
- **Animaciones**: Framer Motion
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
- 5 tablas: `profiles`, `selection_processes`, `evaluations`, `dimension_scores`, `dynamic_tests`
- RLS policies optimizadas para alto rendimiento (InitPlan optimization & Policy Consolidation)
- Campos de auditoría legal: `legal_consent_tc`, `legal_consent_data`, `legal_accepted_at` en `evaluations`
- Campos de temporizador: `started_at`, `test_duration_minutes` (default 60), `paused_at`, `total_paused_ms`, `pause_count`
- Función RPC `get_user_email`
- Soporte para documentos de identificación nacional (CC, CE, TI, PPT, PEP, Pasaporte)

## Arquitectura de la Aplicación

### Flujo del Candidato (Workflow)
1.  **Autenticación**: Login vía Supabase Auth.
2.  **Onboarding Legal**: Consentimiento expreso e informado (Ley 1581 Habeas Data). Incluye lectura in-app de Términos y Condiciones y Política de Tratamiento de Datos mediante ventanas modales.
3.  **Información Académica**: Selección de nivel de formación con tooltips informativos por nivel.
4.  **Evaluación Técnica**: Acceso a los 6 módulos con temporizador de 60 minutos.
5.  **Temporizador**: Cronómetro global en sticky header con sistema de pausas (máx. 3) y auto-pausa al cambiar de pestaña.

```
src/
├── app/
│   ├── actions/              # Server Actions
│   │   ├── ai.ts             # Lógica de IA generativa y evaluación
│   │   ├── admin.ts          # Gestión administrativa de usuarios (incluye archivado al eliminar)
│   │   ├── evaluation.ts     # Operaciones sobre evaluaciones
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
│   │   └── history/          # Búsqueda histórica de procesos
│   └── login/                # Autenticación
├── components/
│   ├── CompanyLogo.tsx       # Logo corporativo reutilizable
│   ├── candidate/            # Componentes de examen (Terminal, Chat, Ticket, Prompt)
│   │   └── tabs/             # Pestañas A1, A2, A3
│   ├── evaluator/            # Componentes de calificación por dimensión
│   │   ├── TimerAdjuster.tsx  # Widget de ajuste de tiempo (+5/+10/+15 min o valor exacto)
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
5. **Ajustar tiempo del candidato** vía TimerAdjuster (+5, +10, +15 min ó valor exacto)
6. **Búsqueda histórica**: Navegación estandarizada por columna de "Acciones" (Ver Resultado -> Ver Reporte).

### Admin
1. Gestión de usuarios (crear, editar, eliminar)
2. Edición: Permite corregir Nombre e Identificación (CC/CE/etc.) y datos del proceso (Equipo/Observaciones). No permite cambio de Email o Rol por estabilidad.
3. Al eliminar un candidato, sus procesos activos se marcan como `archived` (no se borran)
3. Esto permite recrear el mismo email en un nuevo proceso sin conflictos

## Documentación Técnica

> **Regla de Oro:** Todas las especificaciones, manuales, rúbricas y documentaciones de arquitectura deben residir **exclusivamente** dentro de `/docs/specs`. De esta manera se evita la duplicidad de fuentes de verdad.

- Especificación completa: [`docs/specs/AGENTS.md`](docs/specs/AGENTS.md)
- Modelo de evaluación detallado: [`docs/specs/modelo-evaluacion-talento-tecnico.md`](docs/specs/modelo-evaluacion-talento-tecnico.md)
- Especificación de duración (60 min): [`docs/specs/duracion-evaluacion-60min.md`](docs/specs/duracion-evaluacion-60min.md)
- Términos y Condiciones: [`docs/specs/terminosCondiciones.md`](docs/specs/terminosCondiciones.md)
- Política de Tratamiento de Datos: [`docs/specs/tratamientoDatosPersonales.md`](docs/specs/tratamientoDatosPersonales.md)

## Scripts

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción con verificación TypeScript
npm run start     # Servir build de producción
npm run lint      # ESLint
```
