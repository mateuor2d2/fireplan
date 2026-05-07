import { z } from 'zod'

export const SchemaConceptodePresupuesto = z.object({
  id: z.number().min(0, 'Required'), // Allow 0 for new concepts
  concepto: z.string().min(1, 'Required'),
  tipo: z.string().min(1, 'Required'),
  ud: z.number().min(1, 'Required'),
  precioud: z.number().min(0.01, 'Required'),
  amortizacion: z.number().min(0, 'Required'),
  total: z.number().min(0, 'Required') // Allow 0 total
})

export type SchemaConceptodePresupuesto = z.infer<typeof SchemaConceptodePresupuesto>
