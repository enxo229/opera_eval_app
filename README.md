# OTP — Observability Talent Pivot

Plataforma de evaluación de talento técnico para equipos de infraestructura y operaciones (NOC/SRE). Permite evaluar candidatos en cuatro dimensiones — Técnica, Blandas, Cultural e IA — y generar un dictamen automatizado con asistencia de IA.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS v4, Shadcn UI v4
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **IA**: Google Gemini (Gemma 3 + Gemini 2.5 Flash Lite)
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
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (gestión de usuarios) |
| `APP_GEMINI_API_KEY` | API Key de Google Gemini (**NO** `GEMINI_API_KEY`) |

## Base de Datos

El esquema SQL completo está en [`supabase/schema.sql`](supabase/schema.sql). Incluye tablas, RLS policies y funciones.

## Documentación Técnica

La especificación completa del proyecto (arquitectura, modelos IA, modelo de evaluación, convenciones) se encuentra en [`docs/specs/AGENTS.md`](docs/specs/AGENTS.md).

## Scripts

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción con verificación TypeScript
npm run start     # Servir build de producción
npm run lint      # ESLint
```
