// server/types/templates.ts
import type { Document } from 'mongoose'

/**
 * Controls which form sections are visible for a given template.
 * When a section is false, those fields are hidden in the form but
 * data is NEVER deleted — only visibility changes.
 */
export interface TemplateFieldConfig {
  // obra.vue sections
  obra: {
    info_basica: boolean // nom_obra, desc_obra, desc_condiciones_obra
    ubicacion: boolean // dir_obra, cp_obra, poblacion_obra
    caracteristicas: boolean // perimetro, superficie, plantas
    presupuesto: boolean // presupuesto_total_*, presupuesto_objeto_*
    tiempo_costes: boolean // duracion_meses, porcentaje, precio_hora_euro
    capitulos: boolean // TableCapitulosPlan
  }
  // plan.vue sections
  plan: {
    info_general: boolean // nom_plandeseguridad, desc_plandeseguridad, hay_planos
    entorno: boolean // entorno_obra, condiciones_entorno_obra
    interferencias: boolean // lineas_aereas, conducciones_enterradas, etc.
    servicios: boolean // instalacion_electrica, instalacion_agua, extintores, etc.
    asistencia: boolean // contenido_botiquin, centro_asistencial, etc.
    condiciones_ambientales: boolean // orografia, clima, condiciones_clima
    detalles_graficos: boolean // PlanDetallesGraficosManager
  }
  // contratista/promotor sections (shared)
  contratista: boolean // full contratista form
  promotor: boolean // full promotor form
}

/** All sections enabled — used as default/fallback */
export function createFullFieldConfig(): TemplateFieldConfig {
  return {
    obra: {
      info_basica: true,
      ubicacion: true,
      caracteristicas: true,
      presupuesto: true,
      tiempo_costes: true,
      capitulos: true
    },
    plan: {
      info_general: true,
      entorno: true,
      interferencias: true,
      servicios: true,
      asistencia: true,
      condiciones_ambientales: true,
      detalles_graficos: true
    },
    contratista: true,
    promotor: true
  }
}

/**
 * Maps template variable names to their form section path.
 * Used by fieldConfigFromContent() to auto-derive visibility from template content.
 */
const VARIABLE_TO_SECTION: Record<string, string> = {
  // obra.info_basica
  nom_obra: 'obra.info_basica',
  desc_obra: 'obra.info_basica',
  desc_condiciones_obra: 'obra.info_basica',

  // obra.ubicacion
  dir_obra: 'obra.ubicacion',
  cp_obra: 'obra.ubicacion',
  poblacion_obra: 'obra.ubicacion',

  // obra.caracteristicas
  superficie_construida_obra: 'obra.caracteristicas',
  perimetro_obra: 'obra.caracteristicas',
  num_plantas_sobre: 'obra.caracteristicas',
  num_plantas_bajo: 'obra.caracteristicas',

  // obra.presupuesto
  presupuesto_total_obra: 'obra.presupuesto',
  presupuesto_total_seguridad: 'obra.presupuesto',
  presupuesto_objeto_obra: 'obra.presupuesto',
  presupuesto_objeto_seguridad: 'obra.presupuesto',

  // obra.tiempo_costes
  duracion_meses: 'obra.tiempo_costes',
  porcentaje: 'obra.tiempo_costes',
  precio_hora_euro: 'obra.tiempo_costes',

  // obra.capitulos
  desc_cap_obra: 'obra.capitulos',
  partidas: 'obra.capitulos',
  partidasnombre: 'obra.capitulos',
  partidasprecio: 'obra.capitulos',
  partidasunidad: 'obra.capitulos',
  userCapitulos: 'obra.capitulos',

  // plan.info_general
  nom_plandeseguridad: 'plan.info_general',
  desc_plandeseguridad: 'plan.info_general',
  num_trab_plan: 'plan.info_general',
  hay_planos: 'plan.info_general',

  // plan.entorno
  entorno_obra: 'plan.entorno',
  condiciones_entorno_obra: 'plan.entorno',

  // plan.interferencias
  lineas_aereas: 'plan.interferencias',
  conducciones_enterradas: 'plan.interferencias',
  estado_medianeras: 'plan.interferencias',
  acometidas: 'plan.interferencias',
  interferencias_edificios: 'plan.interferencias',
  servidumbres_de_paso: 'plan.interferencias',
  trafico: 'plan.interferencias',

  // plan.servicios
  instalacion_electrica: 'plan.servicios',
  instalacion_agua: 'plan.servicios',
  num_extintoresco2: 'plan.servicios',
  num_extintoresabc: 'plan.servicios',
  num_duchas: 'plan.servicios',
  num_lavabos: 'plan.servicios',
  num_comedores: 'plan.servicios',
  num_vestuarios: 'plan.servicios',

  // plan.asistencia
  contenido_botiquin: 'plan.asistencia',
  centro_asistencial: 'plan.asistencia',
  centro_asistencial_primaria: 'plan.asistencia',

  // plan.condiciones_ambientales
  orografia: 'plan.condiciones_ambientales',
  clima: 'plan.condiciones_ambientales',
  condiciones_clima: 'plan.condiciones_ambientales',

  // plan.detalles_graficos
  detalles_graficos: 'plan.detalles_graficos',
  detalles_graficos_count: 'plan.detalles_graficos',

  // promotor (bare field names used in templates)
  nom_promotor: 'promotor',
  cif_promotor: 'promotor',
  dir_promotor: 'promotor',
  localidad_promotor: 'promotor',
  cp_promotor: 'promotor',
  telf_promotor: 'promotor',
  email_promotor: 'promotor'
}

/**
 * Auto-derive a TemplateFieldConfig from template content by scanning
 * for {{variable}} placeholders. Sections with referenced variables
 * are set to true; all others to false.
 */
export function fieldConfigFromContent(content: string): TemplateFieldConfig {
  // Extract all {{variable}} names, ignoring {{#each}}, {{#if}}, {{/}}, etc.
  const varRegex = /\{\{(#each|#if|#unless|\/|#else|@index|\.\.)?\s*([a-zA-Z_][a-zA-Z0-9_.]*)/g
  const foundSections = new Set<string>()

  let match: RegExpExecArray | null
  while ((match = varRegex.exec(content)) !== null) {
    const varName = match[2]
    if (!varName) continue

    // Handle dotted paths like "contratista.nom_contratista"
    const dotParts = varName.split('.')
    if (dotParts[0] === 'contratista') {
      foundSections.add('contratista')
      continue
    }
    if (dotParts[0] === 'promotor') {
      foundSections.add('promotor')
      continue
    }

    // Check direct variable mapping
    const section = VARIABLE_TO_SECTION[varName]
    if (section) {
      foundSections.add(section)
    }
  }

  // Build config: only sections with referenced variables are visible
  const obraKeys: (keyof TemplateFieldConfig['obra'])[] = ['info_basica', 'ubicacion', 'caracteristicas', 'presupuesto', 'tiempo_costes', 'capitulos']
  const planKeys: (keyof TemplateFieldConfig['plan'])[] = ['info_general', 'entorno', 'interferencias', 'servicios', 'asistencia', 'condiciones_ambientales', 'detalles_graficos']

  return {
    obra: Object.fromEntries(
      obraKeys.map(k => [k, foundSections.has(`obra.${k}`)])
    ) as TemplateFieldConfig['obra'],
    plan: Object.fromEntries(
      planKeys.map(k => [k, foundSections.has(`plan.${k}`)])
    ) as TemplateFieldConfig['plan'],
    contratista: foundSections.has('contratista'),
    promotor: foundSections.has('promotor')
  }
}

/** Dot-notation path helper: 'obra.info_basica' | 'plan.entorno' | 'contratista' | ... */
export type FieldConfigPath =
  | `obra.${keyof TemplateFieldConfig['obra']}`
  | `plan.${keyof TemplateFieldConfig['plan']}`
  | 'contratista'
  | 'promotor'

export interface IPrintingTemplate {
  name: string
  description: string
  value: string // unique identifier
  content: string // markdown template with {{variable}} placeholders
  isDefault?: boolean
  isGlobal?: boolean
  createdBy?: string // user ID for user-specific templates
  fieldConfig?: TemplateFieldConfig // which form sections to show
}

export interface IPrintingTemplateDocument extends IPrintingTemplate, Document {}

export interface IPrintingTemplateCreate extends Omit<IPrintingTemplate, keyof Document | 'createdAt' | 'updatedAt'> {}
