import type { Document, ObjectId } from 'mongoose'
import type { PlanQRDocument } from './qr'

export interface IContratista {
  nom_contratista: string
  cif_contratista: string
  dir_contratista: string
  localidad_contratista: string
  cp_contratista: string
  telf_contratista: string
  nom_recurso_preventivo: string
  dni_recurso_preventivo: string
  telf_recurso_preventivo: string
  email_contratista: string
}

/**
 * PlanQR embedded document (in Plan)
 * This is a simplified version for the Plan interface
 */
export interface IPlanQR {
  planId: ObjectId
  slug: string
  accessToken: string
  expiresAt: Date
  qrCodeImage: string
  publicUrl: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IPromotor {
  nom_promotor: string
  cif_promotor: string
  dir_promotor: string
  localidad_promotor: string
  cp_promotor: string
  telf_promotor: string
  email_promotor: string
}

export interface IPlan extends Document {
  nom_obra: string
  desc_obra: string
  desc_condiciones_obra: string
  dir_obra: string
  poblacion_obra: string
  cp_obra: string
  perimetro_obra: number
  superficie_construida_obra: number
  num_plantas_sobre: number
  num_plantas_bajo: number
  presupuesto_total_obra: number
  presupuesto_total_seguridad: number
  presupuesto_objeto_obra: number
  presupuesto_objeto_seguridad: number
  duracion_meses: number
  porcentaje: number
  precio_hora_euro: number
  nom_plandeseguridad: string
  desc_plandeseguridad: string
  num_trab_plan: number
  hay_planos: string
  entorno_obra: string
  condiciones_entorno_obra: string
  lineas_aereas: string
  conducciones_enterradas: string
  estado_medianeras: string
  acometidas: string
  interferencias_edificios: string
  servidumbres_de_paso: string
  trafico: string
  instalacion_electrica: string
  instalacion_agua: string
  centro_asistencial: string
  centro_asistencial_primaria: string
  num_extintoresco2: number
  num_extintoresabc: number
  num_duchas: number
  num_lavabos: number
  num_comedores: number
  num_vestuarios: number
  contenido_botiquin: string
  orografia: string
  clima: string
  condiciones_clima: string
  contratista: IContratista
  promotor: IPromotor
  // Presupuesto and user-specific data
  presupuesto?: any[]
  userPresupuesto?: any[]
  userCapitulos?: any[]
  userPartidas?: any[]
  partidas?: any[]
  // Technical and subcontractor fields
  tec_obra?: any[]
  personal_obra?: any[]
  seguros_contratista?: any[]
  subcontratistas?: any[]
  det_graf?: any[]
  desc_cap_obra?: any[]
  createdBy: any
  updatedBy?: any
  createdAt: Date
  updatedAt: Date
  // Payment and printing fields
  paymentStatus?: 'unpaid' | 'paid' | 'processing'
  paidAt?: Date
  paymentId?: string
  printingTemplate?: string
  canPrint?: boolean
  printCount?: number
  lastPrintedAt?: Date
  // QR code fields
  qrCode?: IPlanQR | null
  qrEnabled?: boolean
}

export interface IPlanCreate
  extends Omit<IPlan, keyof Document | 'createdAt' | 'updatedAt'> {}
export interface IPlanUpdate extends Partial<Omit<IPlan, keyof Document>> {
  updatedAt?: Date
  updatedBy?: string
}

export interface IPlanResponse {
  data: IPlan[]
  total: number
  limit: number
  skip: number
}

// Extend the IPlan interface to include Mongoose Document properties
export interface IPlanDocument extends IPlan, Document {}
