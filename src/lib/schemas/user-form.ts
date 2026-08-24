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
  { id: 'noc_sre', label: 'NOC / SRE General' },
  { id: 'sre_expert_otel', label: 'SRE Experto en OpenTelemetry & Grafana Cloud' },
  { id: 'fullstack_observability', label: 'Ingeniero de Observabilidad Fullstack' },
] as const

export const DEFAULT_SQUADS = [
  'Squad Alpha',
  'Squad Observabilidad',
  'CoE SRE & Cloud',
  'SRE Core',
  'Operaciones TI',
  'Infraestructura & Cloud',
] as const

export const candidateSchema = z.object({
  role: z.literal('candidate'),
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña temporal debe tener al menos 6 caracteres'),
  fullName: z.string().trim().min(2, 'El nombre completo es requerido'),
  nationalIdType: z.string().min(1, 'Selecciona un tipo de documento'),
  nationalId: z.string().trim().min(3, 'Ingresa el número de identificación'),
  team: z.string().trim().min(1, 'Selecciona o ingresa un equipo / squad'),
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
