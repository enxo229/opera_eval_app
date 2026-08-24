# Especificación Técnica Frontend: Refactorización Panel Evaluador / Admin

- **Proyecto:** O11y SkillFlow / SETI
- **Perfil Destino:** Evaluador / Administrador (Rol Único)
- **Stack de Referencia:** Next.js 16.1 (App Router), React 19, Tailwind CSS v4, Shadcn UI, Framer Motion v12, Supabase (Auth/RLS/Realtime).

---

## 1. Diagnóstico UX/UI y Objetivos del Rediseño

### 1.1. Principales Problemas Detectados en la Interfaz Actual

1. **Navegación Fragmentada y Desorientadora:**
   - Botones superiores inconsistentes (*Búsqueda Global*, *Volver al Evaluador*, *Volver al Dashboard*, *Panel de Admin*) generan saltos entre vistas sin una estructura de layout global coherente.
2. **Jerarquía Invertida:**
   - Los KPIs globales (ej. 20 Candidatos, 8 Evaluadores) están situados en el pie de página, debajo de una tabla extensa.
3. **Formulario Invasivo:**
   - El bloque de *"Crear Nuevo Usuario"* ocupa la mitad de la pantalla de inicio, reduciendo el espacio útil para la gestión operativa y lectura de datos.
4. **Error de Renderizado (Z-Index / Dropdown Overflow):**
   - El selector de *"Perfil Evaluativo / Track"* desborda el contenedor debido a un desfasaje de portales y `z-index` en el `<select>` nativo.
5. **Inconsistencia Visual y Semántica:**
   - Colores de badges no estandarizados (ej. `"COMPLETADO"` en azul en *Búsqueda Histórica* y verde en *Dashboard de Evaluador*; valores de rol mezclando inglés `candidate` y español `Candidato`).

### 1.2. Objetivos Principales

- **Unificación de Interfaz:** Integrar el Panel de Admin, el Dashboard de Evaluador y la Búsqueda Histórica en un solo **Dashboard Unificado de Evaluador / Admin**.
- **Gestión por Modal/Drawer:** Extraer el formulario de creación y edición de usuarios hacia un `Sheet` / `Drawer` lateral desplegable.
- **Estandarización Semántica:** Crear un sistema centralizado de badges y tokens de color para Estados de Proceso y Clasificaciones de Puntaje.
- **Filtros en Tiempo Real y Exportación:** Implementar filtrado dinámico reactivo en la tabla (búsqueda multicampo sin recarga) y capacidad de exportación a CSV/Excel y PDF.

---

## 2. Arquitectura de Información y Layout Unificado

```text
+-----------------------------------------------------------------------------------+
| HEADER GLOBAL: Logo SETI | Buscador Global (Cmd+K) | Equipo | User Avatar (Role)  |
+-----------------------------------------------------------------------------------+
| NAV / TABS:  [📊 Vista General / Evaluaciones]  [🔍 Búsqueda Histórica]  [⚙️ Equipos] |
+-----------------------------------------------------------------------------------+
| SECCIÓN KPIS (Top):                                                               |
| [ Total Candidatos: 20 ] [ Total Evaluadores: 8 ] [ Evaluaciones Activas: 5 ]     |
+-----------------------------------------------------------------------------------+
| BARRA DE HERRAMIENTAS DE TABLA:                                                   |
| [🔍 Buscar por Nombre/ID/Correo... ] [Filtro Estado v] [Filtro Track v] [+ Nuevo] |
+-----------------------------------------------------------------------------------+
| DATA TABLE PRINCIPAL (@tanstack/react-table):                                     |
| Candidato / ID | Track | Equipo | Score | Estado | Clasificación | Acciones (•••) |
| ...            | ...   | ...    | ...   | ...    | ...           | [Ver] [Cerrar] |
+-----------------------------------------------------------------------------------+
| FOOTER: Paginación | Acciones de Exportación (Excel / PDF)                        |
+-----------------------------------------------------------------------------------+
```

### 2.1. Estructura de Rutas (Next.js App Router)

- `/evaluator/layout.tsx`: Shell principal con Header, Navegación por pestañas/sidebar y Drawer de Creación.
- `/evaluator/page.tsx`: Vista General (KPIs superiores + Tabla de Evaluaciones Activas y Recientes).
- `/evaluator/history/page.tsx`: Búsqueda Histórica Avanzada con filtros globales y trazabilidad de procesos anteriores.
- `/evaluator/teams/page.tsx`: Configuración y gestión del catálogo de Equipos / Squads.
- `/evaluator/evaluate/[id]/page.tsx`: Vista de evaluación en detalle / captura de calificaciones.
- `/evaluator/report/[id]/page.tsx`: Reporte detallado de resultados y métricas del candidato.

---

## 3. Especificación del Formulario de Creación de Usuarios

### 3.1. Patrón UX: Sheet / Drawer Lateral (`<Sheet />`)

El formulario dejará de ocupar espacio fijo en el canvas principal y se abrirá fluidamente mediante el botón primario **`+ Crear Nuevo Usuario`**.

### 3.2. Reglas de Negocio y Lógica Condicional del Formulario

- **Rol:** Selector Segmentado (`TabsList` o `RadioGroup`) con opciones: **Candidato** | **Evaluador**.
- **Lógica de Campos Condicionales:**
  - **Si Rol = Candidato:**
    - *Perfil Evaluativo / Track* (Obligatorio - Select desplegable: *NOC / SRE General*, *SRE Experto en OpenTelemetry & Grafana Cloud*).
    - *Equipo / Squad* (Obligatorio - Select desplegable poblado dinámicamente desde la BD/Catálogo de Equipos, ej: *Squad Alpha*, *CoE*, *SRE Core*).
    - *Observaciones del Proceso* (Opcional - Textarea).
  - **Si Rol = Evaluador:**
    - *Perfil Evaluativo / Track* -> Oculto y no requerido (un evaluador tiene alcance global).
    - *Equipo / Squad* -> Oculto.

### 3.3. Solución al Bug de Z-Index / Dropdown Overflow

Se utilizará el componente `<Select />` de Shadcn UI construido sobre Radix UI / Base UI Primitive. Al utilizar renderizado vía **Portal**, el menú desplegable se monta directamente en el body (`document.body`), eliminando desbordamientos y problemas de `overflow: hidden` / `z-index`.

```typescript
// Esquema de Validación Zod
import { z } from 'zod';

export const userFormSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("candidate"),
    email: z.string().email("Correo electrónico inválido"),
    fullName: z.string().min(2, "Nombre requerido"),
    idType: z.enum(["CC", "CE", "PASAPORTE", "TI", "PPT", "PEP"]),
    idNumber: z.string().min(3, "Identificación requerida"),
    trackId: z.string().min(1, "Debe seleccionar un track evaluativo"),
    teamId: z.string().min(1, "Debe seleccionar un equipo"),
    notes: z.string().optional(),
  }),
  z.object({
    role: z.literal("evaluator"),
    email: z.string().email("Correo electrónico inválido"),
    fullName: z.string().min(2, "Nombre requerido"),
    idType: z.enum(["CC", "CE", "PASAPORTE", "TI", "PPT", "PEP"]),
    idNumber: z.string().min(3, "Identificación requerida"),
  })
]);

export type UserFormData = z.infer<typeof userFormSchema>;
```

---

## 4. Sistema de Diseño, Tokens y Estados Visuales

### 4.1. Tokens de Color Semánticos (Tailwind CSS v4)

- **Primario Institucional:** `bg-red-700` (`#B91C1C` / `#C026D3` según brand SETI) -> `var(--color-primary)`.
- **Superficies:** `bg-slate-50 dark:bg-slate-950` para fondo global; `bg-white dark:bg-slate-900` para tarjetas y tablas.

### 4.2. Estandarización de Badges de Estado del Proceso (`ProcessStatusBadge`)

| Estado Técnico | Texto Visible | Estilo UI (Tailwind v4) |
| :--- | :--- | :--- |
| `COMPLETED` | Completado | `bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200` |
| `IN_PROGRESS` | En Progreso | `bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200` |
| `ACTIVE` | Activo | `bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200` |
| `CLOSED` / `ARCHIVED` | Cerrado / Archivado | `bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200` |

### 4.3. Estandarización de Clasificación de Puntaje (`ScoreClassificationBadge`)

| Clasificación | Rango Puntaje | Estilo Visual |
| :--- | :--- | :--- |
| **Listo para pivotar** | 80.00 - 100.0 | `bg-emerald-600 text-white font-medium` |
| **Pivote con nivelación** | 60.00 - 79.99 | `bg-amber-500 text-white font-medium` |
| **En preparación** | 40.00 - 59.99 | `bg-orange-500 text-white font-medium` |
| **Continúa en su rol actual** | 0.00 - 39.99 | `bg-rose-600 text-white font-medium` |
| **Sin clasificar** | N/A | `bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400` |

---

## 5. Especificación de Componentes y Tablas Avanzadas

### 5.1. Barra de Herramientas y Filtros en Tiempo Real

La tabla no requiere pulsar un botón manual de *"Buscar"* para filtrar los registros:

- **Input de Búsqueda Reactivo:** Debounced Input (300ms) que filtra simultáneamente por Nombre, Identificación y Correo.
- **Filtros Selectivos:** Dropdowns interactivos para *Equipo*, *Track* y *Estado*.
- **Botón de Exportación Colectiva (`ExportMenu`):**
  - **Exportar a Excel / CSV:** Descarga limpia del dataset filtrado activo utilizando `xlsx` / `papaparse`.
  - **Imprimir / Exportar a PDF:** Vista optimizada para impresión mediante `@media print` o generación documental.

```typescript
// Lógica de Filtros Reactivos en Cliente
const [globalFilter, setGlobalFilter] = useState('');
const [statusFilter, setStatusFilter] = useState<string>('ALL');
const [teamFilter, setTeamFilter] = useState<string>('ALL');

const filteredData = useMemo(() => {
  return data.filter(row => {
    const searchTarget = `${row.fullName} ${row.email} ${row.idNumber}`.toLowerCase();
    const matchesGlobal = searchTarget.includes(globalFilter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter;
    const matchesTeam = teamFilter === 'ALL' || row.teamId === teamFilter;

    return matchesGlobal && matchesStatus && matchesTeam;
  });
}, [data, globalFilter, statusFilter, teamFilter]);
```

### 5.2. Definición de Acciones en Tabla (`RowActions`)

Cada fila de candidato en la tabla incluye un menú contextual de acciones (`DropdownMenu` / Botones de acción):

1. **Ver Resultado / Evaluar:**
   - Redirección directa hacia la evaluación o reporte: `router.push('/evaluator/evaluate/${candidateId}')` o `router.push('/evaluator/report/${candidateId}')`.
2. **Cerrar Proceso:**
   - Muestra diálogo de confirmación (`AlertDialog`).
   - Al confirmar: invoca la Server Action `closeSelectionProcess(processId)`.
   - Cambia el estado del proceso a `closed` / `archived`.
   - Efecto en el candidato: invalida la sesión activa y bloquea el acceso al examen.
3. **Reabrir Proceso:**
   - Muestra diálogo de confirmación (`AlertDialog`).
   - Al confirmar: invoca la Server Action `reopenEvaluation(processId)`.
   - Restablece el estado del proceso a `active` / `in_progress`.
   - Efecto en el candidato: permite el reingreso al portal de evaluación.

---

## 6. Arquitectura Backend e Integración de Datos (Next.js + Supabase)

### 6.1. Definición de Server Actions (`'use server'`)

- `createUserAndProcessAction(payload)`: Inserta usuario en `auth.users`, crea perfil en `public.profiles` y genera el registro en `public.selection_processes`.
- `updateProcessStatusAction(processId, status)`: Actualiza el estado entre `active`, `completed` o `archived`.
- `getTeamsCatalogAction()`: Retorna el catálogo de equipos registrados para alimentar los selectores dinámicos.

### 6.2. Sincronización Realtime con Supabase

Para mantener el Dashboard de Evaluador sincronizado en tiempo real ante cambios de estado de evaluaciones:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('evaluations_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'evaluations' },
      (payload) => {
        // Actualizar el estado local o revalidar datos
        router.refresh();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [supabase, router]);
```

---

## 7. Matriz de Componentes Frontend Reutilizables

| Componente UI | Tecnología / Primitivo | Descripción y Uso |
| :--- | :--- | :--- |
| `DashboardLayout` | Next.js App Shell | Contenedor principal con Header y navegación unificada. |
| `KpiSummaryCards` | Framer Motion + Shadcn Card | Muestrario de métricas superiores (Candidatos, Evaluadores, Pendientes). |
| `UserCreationSheet` | Shadcn Sheet + React Hook Form | Formulario lateral desplegable con lógica condicional por rol. |
| `CandidatesDataTable` | `@tanstack/react-table` | Tabla con ordenamiento, filtrado cliente, paginación y selección. |
| `TeamSelect` | Shadcn Select + Supabase | Selector dinámico de Equipos (reemplaza el input libre actual). |
| `ProcessStatusBadge` | Shadcn Badge | Badge estandarizado de estado del proceso. |
| `ScoreClassBadge` | Shadcn Badge | Badge de clasificación de puntaje con semántica de color. |
| `ExportDataButton` | SheetJS / jsPDF / CSV | Dropdown con opciones de exportación instantánea en Excel/PDF. |
| `ConfirmStatusModal` | Shadcn AlertDialog | Modal de confirmación para cerrar o reabrir procesos. |