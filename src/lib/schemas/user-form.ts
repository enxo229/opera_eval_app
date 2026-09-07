import { z } from 'zod'

export const ID_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'PPT', label: 'Permiso por Protección Temporal (PPT)' },
  { value: 'PEP', label: 'Permiso Especial de Permanencia (PEP)' },
] as const

export const DEFAULT_TRACKS = [
  { id: 'general', label: 'NOC / SRE General' },
  { id: 'otel_expert', label: 'SRE Experto en OpenTelemetry & Grafana Cloud' },
] as const

export const DEFAULT_SQUADS = [
  'ALIADOS REVOLUTION',
  'ALL-IN-ONE',
  'ARTHEMIS',
  'CELULAS EUROFINS',
  'ECHO NEXUS',
  'EQUIPO CALI',
  'FUERZA DELTA',
  'GRYFFINDOR',
  'INTEGRATORS',
  'INTELISETISIMOS',
  'OPERA',
  'SYNERGY',
  'UNIO',
  'X-FORCE',
  'ZEUS',
  'COE',
  'TALENTO HUMANO',
  'ADMINISTRATIVO Y FINANCIERO',
  'SOPORTE TI',
] as const

export const candidateSchema = z.object({
  role: z.literal('candidate'),
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña temporal debe tener al menos 6 caracteres'),
  fullName: z.string().trim().min(2, 'El nombre completo es requerido'),
  nationalIdType: z.string().min(1, 'Selecciona un tipo de documento'),
  nationalId: z.string().trim().min(3, 'Ingresa el número de identificación'),
  team: z.string().trim().min(1, 'Selecciona un equipo / squad'),
  trackId: z.string().optional(),
  observations: z.string().optional(),
})

export const evaluatorSchema = z.object({
  role: z.literal('evaluator'),
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  fullName: z.string().trim().min(2, 'El nombre completo es requerido'),
  nationalIdType: z.string().default('CC'),
  nationalId: z.string().trim().optional(),
  team: z.string().optional(),
  trackId: z.string().optional(),
  observations: z.string().optional(),
})

export const userFormSchema = z.discriminatedUnion('role', [
  candidateSchema,
  evaluatorSchema,
])

export type UserFormData = z.infer<typeof userFormSchema>
export type CandidateFormData = z.infer<typeof candidateSchema>
export type EvaluatorFormData = z.infer<typeof evaluatorSchema>
