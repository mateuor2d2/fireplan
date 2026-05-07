import { z } from 'zod'

export const schemaConcepto = z.object({
  nom_concepto: z.string().min(1, 'Required'),
  desc_concepto: z.string().min(1, 'Required'),
  desc_concepto_preventivo: z.string().min(1, 'Required'),
  // tipo_concepto_unidad: z.object({
  //   id: z.number().positive(),
  //   descripcion: z.string()
  // }),
  precio_concepto: z.number().optional(),
  capitulo: z.number().positive(),
  capitulo_title: z.string().optional()
})

export type SchemaConcepto = z.infer<typeof schemaConcepto>
