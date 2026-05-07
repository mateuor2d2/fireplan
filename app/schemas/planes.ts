import { z } from 'zod'
import type { TemplateFieldConfig } from '../../server/types/templates'

// ─── Base schemas (kept for backward compat & types) ───

export const schemaObra = z.object({
  nom_obra: z.string().min(1, 'Required'),
  desc_obra: z.string().min(1, 'Required'),
  desc_condiciones_obra: z.string().min(1, 'Required'),
  dir_obra: z.string().min(1, 'Required'),
  poblacion_obra: z.string().min(1, 'Required'),
  cp_obra: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  perimetro_obra: z.number().int().min(0, 'Must be 0 or positive integer'),
  superficie_construida_obra: z.number().min(0, 'Must be 0 or positive number'),
  num_plantas_sobre: z.number().int().min(0, 'Must be 0 or positive integer'),
  num_plantas_bajo: z.number().int().min(0, 'Must be 0 or positive integer'),
  presupuesto_total_obra: z.number().positive('Must be positive').optional(),
  presupuesto_total_seguridad: z.number().positive('Must be positive').optional(),
  presupuesto_objeto_obra: z.number().positive('Must be positive').optional(),
  presupuesto_objeto_seguridad: z.number().positive('Must be positive').optional(),
  duracion_meses: z.number().int().min(1, 'La duración debe ser de al menos 1 mes'),
  porcentaje: z.number().min(0).max(100, 'Must be between 0 and 100'),
  precio_hora_euro: z.number().positive('Must be positive').optional()
})

export const schemaPlan = z.object({
  nom_plandeseguridad: z.string().min(1, 'Required'),
  desc_plandeseguridad: z.string().min(1, 'Required'),
  num_trab_plan: z.union([z.string(), z.number()]).transform((val) => {
    if (val === '' || val === null || val === undefined) return 1
    const num = Number(val)
    if (isNaN(num)) return 1
    return Math.max(1, Math.floor(num))
  }),
  hay_planos: z.string().optional(),
  entorno_obra: z.string().optional(),
  condiciones_entorno_obra: z.string().optional(),
  lineas_aereas: z.string().optional(),
  conducciones_enterradas: z.string().optional(),
  estado_medianeras: z.string().optional(),
  acometidas: z.string().optional(),
  interferencias_edificios: z.string().optional(),
  servidumbres_de_paso: z.string().optional(),
  trafico: z.string().optional(),
  instalacion_electrica: z.string().optional(),
  instalacion_agua: z.string().optional(),
  centro_asistencial: z.string().optional(),
  centro_asistencial_primaria: z.string().optional(),
  num_extintoresco2: z.union([z.string(), z.number()]).transform((val) => {
    if (val === '' || val === null || val === undefined) return undefined
    const num = Number(val)
    return isNaN(num) ? 0 : Math.max(0, Math.floor(num))
  }).optional(),
  num_extintoresabc: z.union([z.string(), z.number()]).transform((val) => {
    if (val === '' || val === null || val === undefined) return undefined
    const num = Number(val)
    return isNaN(num) ? 0 : Math.max(0, Math.floor(num))
  }).optional(),
  num_duchas: z.union([z.string(), z.number()]).transform((val) => {
    if (val === '' || val === null || val === undefined) return undefined
    const num = Number(val)
    return isNaN(num) ? 0 : Math.max(0, Math.floor(num))
  }).optional(),
  num_lavabos: z.union([z.string(), z.number()]).transform((val) => {
    if (val === '' || val === null || val === undefined) return undefined
    const num = Number(val)
    return isNaN(num) ? 0 : Math.max(0, Math.floor(num))
  }).optional(),
  num_comedores: z.union([z.string(), z.number()]).transform((val) => {
    if (val === '' || val === null || val === undefined) return undefined
    const num = Number(val)
    return isNaN(num) ? 0 : Math.max(0, Math.floor(num))
  }).optional(),
  num_vestuarios: z.union([z.string(), z.number()]).transform((val) => {
    if (val === '' || val === null || val === undefined) return undefined
    const num = Number(val)
    return isNaN(num) ? 0 : Math.max(0, Math.floor(num))
  }).optional(),
  contenido_botiquin: z.string().optional(),
  orografia: z.string().optional(),
  clima: z.string().optional(),
  condiciones_clima: z.string().optional()
})

export const schemaContratista = z.object({
  nom_contratista: z.string().min(1, 'Required'),
  cif_contratista: z.string().min(1, 'Required'),
  dir_contratista: z.string().min(1, 'Required'),
  localidad_contratista: z.string().min(1, 'Required'),
  cp_contratista: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  telf_contratista: z.string().min(1, 'Required'),
  nom_recurso_preventivo: z.string().min(1, 'Required'),
  dni_recurso_preventivo: z.string().min(1, 'Required'),
  telf_recurso_preventivo: z.string().min(1, 'Required'),
  email_contratista: z.string().email('Invalid email').min(1, 'Required')
})

export const schemaPromotor = z.object({
  nom_promotor: z.string().min(1, 'Required'),
  cif_promotor: z.string().min(1, 'Required'),
  dir_promotor: z.string().min(1, 'Required'),
  localidad_promotor: z.string().optional(),
  cp_promotor: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos').optional(),
  telf_promotor: z.string().optional(),
  email_promotor: z.string().email('Invalid email').optional()
})

// ─── Dynamic schema builders (respect template field visibility) ───

/** Helper: makes a required string optional (empty string allowed) */
const optStr = z.string().optional().or(z.literal(''))

/** Helper: makes a number field optional */
const optNum = z.number().optional()

/** Helper: makes a CP regex optional */
const optCP = z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos').optional().or(z.literal(''))

/** Helper: makes an email optional */
const optEmail = z.string().email('Invalid email').optional().or(z.literal(''))

/**
 * Build an obra Zod schema that relaxes validation for hidden sections.
 * When a section is hidden (visible=false), its required fields become optional.
 */
export function buildSchemaObra(cfg: TemplateFieldConfig) {
  return z.object({
    nom_obra: cfg.obra.info_basica ? z.string().min(1, 'Required') : optStr,
    desc_obra: cfg.obra.info_basica ? z.string().min(1, 'Required') : optStr,
    desc_condiciones_obra: cfg.obra.info_basica ? z.string().min(1, 'Required') : optStr,
    dir_obra: cfg.obra.ubicacion ? z.string().min(1, 'Required') : optStr,
    poblacion_obra: cfg.obra.ubicacion ? z.string().min(1, 'Required') : optStr,
    cp_obra: cfg.obra.ubicacion
      ? z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos')
      : optCP,
    perimetro_obra: cfg.obra.caracteristicas
      ? z.number().int().min(0, 'Must be 0 or positive integer')
      : optNum,
    superficie_construida_obra: cfg.obra.caracteristicas
      ? z.number().min(0, 'Must be 0 or positive number')
      : optNum,
    num_plantas_sobre: cfg.obra.caracteristicas
      ? z.number().int().min(0, 'Must be 0 or positive integer')
      : optNum,
    num_plantas_bajo: cfg.obra.caracteristicas
      ? z.number().int().min(0, 'Must be 0 or positive integer')
      : optNum,
    presupuesto_total_obra: cfg.obra.presupuesto ? z.number().positive('Must be positive').optional() : optNum,
    presupuesto_total_seguridad: cfg.obra.presupuesto ? z.number().positive('Must be positive').optional() : optNum,
    presupuesto_objeto_obra: cfg.obra.presupuesto ? z.number().positive('Must be positive').optional() : optNum,
    presupuesto_objeto_seguridad: cfg.obra.presupuesto ? z.number().positive('Must be positive').optional() : optNum,
    duracion_meses: cfg.obra.tiempo_costes
      ? z.number().int().min(1, 'La duración debe ser de al menos 1 mes')
      : optNum,
    porcentaje: cfg.obra.tiempo_costes ? z.number().min(0).max(100, 'Must be between 0 and 100') : optNum,
    precio_hora_euro: cfg.obra.tiempo_costes ? z.number().positive('Must be positive').optional() : optNum
  })
}

/** Number transform helper reused in plan schemas */
const numTransform = (val: string | number | null | undefined): number | undefined => {
  if (val === '' || val === null || val === undefined) return undefined
  const num = Number(val)
  return isNaN(num) ? 0 : Math.max(0, Math.floor(num))
}

const numTransformDefault1 = (val: string | number | null | undefined): number => {
  if (val === '' || val === null || val === undefined) return 1
  const num = Number(val)
  if (isNaN(num)) return 1
  return Math.max(1, Math.floor(num))
}

/**
 * Build a plan Zod schema that relaxes validation for hidden sections.
 */
export function buildSchemaPlan(cfg: TemplateFieldConfig) {
  const optNumTransform = z.union([z.string(), z.number()]).transform(numTransform).optional()
  const numTrabTransform = z.union([z.string(), z.number()]).transform(numTransformDefault1)

  return z.object({
    nom_plandeseguridad: cfg.plan.info_general ? z.string().min(1, 'Required') : optStr,
    desc_plandeseguridad: cfg.plan.info_general ? z.string().min(1, 'Required') : optStr,
    num_trab_plan: cfg.plan.info_general ? numTrabTransform : z.union([z.string(), z.number()]).transform(numTransformDefault1),
    hay_planos: cfg.plan.info_general ? z.string().optional() : optStr,
    entorno_obra: cfg.plan.entorno ? z.string().optional() : optStr,
    condiciones_entorno_obra: cfg.plan.entorno ? z.string().optional() : optStr,
    lineas_aereas: cfg.plan.interferencias ? z.string().optional() : optStr,
    conducciones_enterradas: cfg.plan.interferencias ? z.string().optional() : optStr,
    estado_medianeras: cfg.plan.interferencias ? z.string().optional() : optStr,
    acometidas: cfg.plan.interferencias ? z.string().optional() : optStr,
    interferencias_edificios: cfg.plan.interferencias ? z.string().optional() : optStr,
    servidumbres_de_paso: cfg.plan.interferencias ? z.string().optional() : optStr,
    trafico: cfg.plan.interferencias ? z.string().optional() : optStr,
    instalacion_electrica: cfg.plan.servicios ? z.string().optional() : optStr,
    instalacion_agua: cfg.plan.servicios ? z.string().optional() : optStr,
    centro_asistencial: cfg.plan.asistencia ? z.string().optional() : optStr,
    centro_asistencial_primaria: cfg.plan.asistencia ? z.string().optional() : optStr,
    num_extintoresco2: cfg.plan.servicios ? optNumTransform : optNumTransform,
    num_extintoresabc: cfg.plan.servicios ? optNumTransform : optNumTransform,
    num_duchas: cfg.plan.servicios ? optNumTransform : optNumTransform,
    num_lavabos: cfg.plan.servicios ? optNumTransform : optNumTransform,
    num_comedores: cfg.plan.servicios ? optNumTransform : optNumTransform,
    num_vestuarios: cfg.plan.servicios ? optNumTransform : optNumTransform,
    contenido_botiquin: cfg.plan.asistencia ? z.string().optional() : optStr,
    orografia: cfg.plan.condiciones_ambientales ? z.string().optional() : optStr,
    clima: cfg.plan.condiciones_ambientales ? z.string().optional() : optStr,
    condiciones_clima: cfg.plan.condiciones_ambientales ? z.string().optional() : optStr
  })
}

/**
 * Build a contratista Zod schema. If contratista section is hidden, all fields optional.
 */
export function buildSchemaContratista(cfg: TemplateFieldConfig) {
  if (!cfg.contratista) {
    return z.object({
      nom_contratista: optStr,
      cif_contratista: optStr,
      dir_contratista: optStr,
      localidad_contratista: optStr,
      cp_contratista: optCP,
      telf_contratista: optStr,
      nom_recurso_preventivo: optStr,
      dni_recurso_preventivo: optStr,
      telf_recurso_preventivo: optStr,
      email_contratista: optEmail
    })
  }
  return schemaContratista
}

/**
 * Build a promotor Zod schema. If promotor section is hidden, all fields optional.
 */
export function buildSchemaPromotor(cfg: TemplateFieldConfig) {
  if (!cfg.promotor) {
    return z.object({
      nom_promotor: optStr,
      cif_promotor: optStr,
      dir_promotor: optStr,
      localidad_promotor: optStr,
      cp_promotor: optCP,
      telf_promotor: optStr,
      email_promotor: optEmail
    })
  }
  return schemaPromotor
}

// Combined schema
export const schemaAllForms = schemaObra.merge(schemaPlan).merge(schemaContratista).merge(schemaPromotor)

// Type exports
export type SchemaObra = z.infer<typeof schemaObra>
export type SchemaPlan = z.infer<typeof schemaPlan>
export type SchemaPromotor = z.infer<typeof schemaPromotor>
export type SchemaContratista = z.infer<typeof schemaContratista>
export type SchemaAllForms = z.infer<typeof schemaAllForms>
