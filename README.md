# OTP — Observability Talent Pivot

Plataforma de evaluación de talento técnico para equipos de infraestructura y operaciones (NOC/SRE). Permite evaluar candidatos en cuatro dimensiones — Técnica, Blandas, Cultural e IA — y generar un dictamen automatizado con asistencia de IA.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS v4, Shadcn UI v4
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **IA**: Google Gemini (Gemma 3 27B/12B + Gemini 2.5 Flash Lite) con fallback automático
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
- RLS policies para candidatos y evaluadores
- Función RPC `get_user_email`
- Soporte para documentos de identificación nacional (CC, CE, TI, PPT, PEP)

## Arquitectura de la Aplicación

### Flujo del Candidato (Workflow)
1.  **Autenticación**: Login vía Supabase Auth.
2.  **Onboarding Legal**: Consentimiento expreso e informado (Ley 1581 Habeas Data).
3.  **Información Académica**: Registro de nivel de formación.
4.  **Evaluación Técnica**: Acceso a los 5 módulos (Linux, Observabilidad, Git, IA, Tickets).

```
src/
├── app/
│   ├── actions/          # Server Actions (ai.ts, legal.ts, a1..a4.ts, admin.ts)
│   ├── admin/            # Panel de administración de usuarios
│   ├── candidate/        # Interfaz del candidato (examen interactivo)
│   ├── evaluator/        # Dashboard del evaluador + evaluación por candidato
│   │   └── history/      # Búsqueda histórica de procesos
│   └── login/            # Autenticación
├── components/
│   ├── candidate/        # Componentes de examen (Terminal, Chat, Ticket, Prompt)
│   │   └── tabs/         # Pestañas A1, A2, A3
│   ├── evaluator/        # Componentes de calificación por dimensión
│   └── ui/               # Primitivos de Shadcn UI
├── lib/
│   ├── ai/gemini.ts      # Wrapper Gemini con fallback chain
│   ├── constants.ts      # Constantes compartidas (herramientas, etiquetas)
│   ├── supabase/         # Clientes de Supabase (client, server, admin, middleware)
│   ├── terminal/         # Motor de CLI simulada (filesystem virtual)
│   └── evaluator-guidance.ts  # Guías estáticas para evaluadores
└── types/
    └── database.ts       # Tipos TypeScript de Supabase (manual)
```

## Flujos Principales

### Candidato
1. Login → Selección de nivel educativo → Examen
2. Dimensiones A1-A4: Preguntas generadas por IA, persistidas inmediatamente en BD
3. B1: Ticket de incidente con escenario dinámico
4. Dim. D (IA-2): Editor de prompt para ejercicio externo

### Evaluador
1. Dashboard → Seleccionar candidato → Evaluar por dimensión
2. Ver respuestas del candidato + sugerencias de la IA
3. Asignar puntajes manuales → Cálculo automático del score final
4. Búsqueda histórica por CC, correo o equipo

## Documentación Técnica

- Especificación completa: [`docs/specs/AGENTS.md`](docs/specs/AGENTS.md)
- Modelo de evaluación detallado: [`docs/specs/modelo-evaluacion-noc.md`](docs/specs/modelo-evaluacion-noc.md)

## Scripts

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción con verificación TypeScript
npm run start     # Servir build de producción
npm run lint      # ESLint
```
