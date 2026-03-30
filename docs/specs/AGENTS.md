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
| **Evaluación** (JSON) | `gemma-3-27b-it` | `gemini-2.5-flash-lite` | `gemini-2.5-flash-lite` |

- **Resiliencia (Fallback)**: Si un modelo falla por cuota (429) o disponibilidad (503/500), el sistema conmuta automáticamente hacia el siguiente en la cadena tras un delay exponencial (2s × 2^attempt).
- **PII Filter**: `sanitizePII()` está **DESHABILITADO** para evitar falsos positivos con timestamps y datos técnicos.
- **Variable de entorno**: Usa `APP_GEMINI_API_KEY` (NO `GEMINI_API_KEY`) para evitar colisiones con el entorno del sistema.

---

## 4. Arquitectura de Carpetas

```
opera_eval_app/
├── docs/specs/                     # Documentación y rúbricas
├── supabase/
│   └── schema.sql                  # DDL completo: tablas, RLS, functions
├── src/
│   ├── lib/
│   │   ├── ai/
│   │   │   └── gemini.ts           # Wrapper Gemini: fallback chain y retries
│   │   ├── terminal/
│   │   │   └── commands.ts         # Motor de CLI simulada (FS virtual)
│   │   ├── supabase/
│   │   │   ├── client.ts / server.ts / middleware.ts
│   │   │   └── admin.ts            # Cliente con service_role para gestión de usuarios
│   │   └── evaluator-guidance.ts    # Guías estáticas para evaluadores (A3)
│   ├── components/
│   │   ├── candidate/
│   │   │   ├── tabs/               # Fragmentos de UI para A1, A2, A3
│   │   │   ├── TerminalSandbox.tsx  # Terminal Linux/Git simulada
│   │   │   ├── ChatbotA4.tsx        # Chat interactivo de investigación
│   │   │   ├── TicketEditor.tsx     # Editor de ticket B1
│   │   │   └── PromptEditorIA2.tsx  # Editor de prompt IA (Módulo D)
│   │   └── evaluator/
│   │       ├── DimensionAEvaluation.tsx / DimensionBEvaluation.tsx ...
│   │       ├── DimensionDEvaluation.tsx # Módulo de IA (IA-1 e IA-2)
│   │       └── RadarChartComponent.tsx
│   └── app/
│       ├── actions/                 # Server Actions (IA, CRUD, Evals, Admin, Diagnostics)
│       └── candidate/ / evaluator/ / admin/  # Rutas y layouts
```

---

## 5. Rutas y Seguridad

- **Middleware**: Protege `/evaluator`, `/candidate` y `/admin`. Los candidatos sin `education_level` son forzados a `/candidate/eligibility`.
- **RBAC**: El rol `evaluator` es necesario para acceder a `/admin` y realizar evaluaciones.
- **RLS**: Protege datos sensibles. Los candidatos solo ven sus propias evaluaciones y pruebas dinámicas.

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

- **A4 (Caso Práctico)**: Generación persistente de incidente en DB (`A4_CASE`). Chat interactivo (`IA_CHAT`) que se bloquea al finalizar. Evaluación IA en 3 subcategorías.
- **B1 (Ticket)**: Escenario dinámico (`B1_CASE`). Evaluación vía IA basada en rúbrica de 4 criterios (Estructura, Precisión, Acciones, Impacto).
- **IA-2 (Prompting)**: El candidato ingresa el prompt que usó fuera de la plataforma. Gemini analiza el contexto, claridad y sugiere un score al evaluador en `DimensionDEvaluation`.

---

## 8. Convenciones Técnicas

1. **Next.js Params**: Siempre `await params` en rutas dinámicas.
2. **Server Actions**: Marcadas con `'use server'`. Lógica de negocio e IA concentrada aquí.
3. **test_type (dynamic_tests)**: `QUESTIONS_A1..A4`, `TERMINAL_A1..A4`, `IA_CHAT`, `A4_CASE`, `B1_CASE`, `B1_TICKET`, `PROMPT_IA2`.
4. **Environment**: Usar estrictamente `APP_GEMINI_API_KEY`.
