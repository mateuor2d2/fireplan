import { z } from 'zod'

export const schemaTexto = z.object({
  text: z.string().min(1, 'Required'),
  typography: z.string().min(1, 'Required'),
  size: z.number().positive('Must be positive'),
  position: z.number().int('Must be an integer')
})

export type SchemaTexto = z.infer<typeof schemaTexto>

export const schemaImg = z.object({
  url: z.string().url('Invalid URL'),
  alt: z.string().min(1, 'Required'),
  position: z.number().int('Must be an integer')
})

export type SchemaImg = z.infer<typeof schemaImg>

export const schemaVectPos = z.object({
  I: z.array(z.number().int()).min(1, 'Required'),
  T: z.array(z.number().int()).min(1, 'Required')
})

export type SchemaVectPos = z.infer<typeof schemaVectPos>

export const schemaMgParrafo = z.object({
  _id: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  lengthParrafo: z.number().int().positive('Must be a positive integer'),
  texts: z.array(schemaTexto).min(1, 'At least one text is required'),
  images: z.array(schemaImg).optional(),
  distribution: schemaVectPos,
  position: z.number().int('Must be an integer'),
  mgroluser: z.string().min(1, 'Required'),
  emailuser: z.string().email('Invalid email'),
  userId: z.string().min(1, 'Required'),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SchemaMgParrafo = z.infer<typeof schemaMgParrafo>

export const schemaMgMemoria = z.object({
  _id: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  paragrafs: z.array(schemaMgParrafo).min(1, 'At least one paragraph is required'),
  imgPortada: schemaImg,
  header: schemaMgParrafo,
  headerSize: z.number().positive('Must be positive'),
  headerTypography: z.string().min(1, 'Required'),
  footer: schemaMgParrafo,
  footerSize: z.number().positive('Must be positive'),
  footerTypography: z.string().min(1, 'Required'),
  memtypography: z.string().min(1, 'Required'),
  memsize: z.number().positive('Must be positive'),
  mgroluser: z.string().min(1, 'Required'),
  emailuser: z.string().email('Invalid email'),
  userId: z.string().min(1, 'Required'),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SchemaMgMemoria = z.infer<typeof schemaMgMemoria>
