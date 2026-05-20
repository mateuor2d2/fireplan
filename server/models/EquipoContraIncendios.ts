import mongoose from 'mongoose'

export type EquipoTipo = 'extintor' | 'boca_incendio' | 'detector_humo' | 'salida_emergencia' | 'manguera' | 'puerta_cortafuego' | 'columna_seca' | 'otro'
export type EquipoEstado = 'activo' | 'inactivo' | 'en_revision' | 'caducado' | 'baja'

export interface IEquipoContraIncendios {
  _id: string
  centerId: string
  tenantId: string
  tipo: EquipoTipo
  codigoQR: string
  ubicacion: { edificio?: string; planta?: string; zona?: string; lat?: number; lng?: number }
  marca?: string
  modelo?: string
  fechaInstalacion?: Date
  fechaCaducidad?: Date
  capacidad?: string
  agenteExtintor?: string
  ultimaRevision?: { fecha?: Date; resultado?: string; tecnico?: string; observaciones?: string }
  proximaRevision?: Date
  estado: EquipoEstado
  manualUsoUrl?: string
  fotoUrl?: string
  historialRevisiones: Array<any>
  historialMantenimientos: Array<any>
  createdAt?: Date
  updatedAt?: Date
}

const EquipoSchema = new mongoose.Schema<IEquipoContraIncendios>({
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  tipo: { type: String, enum: ['extintor', 'boca_incendio', 'detector_humo', 'salida_emergencia', 'manguera', 'puerta_cortafuego', 'columna_seca', 'otro'], required: true },
  codigoQR: { type: String, required: true, unique: true },
  ubicacion: { edificio: String, planta: String, zona: String, lat: Number, lng: Number },
  marca: String,
  modelo: String,
  fechaInstalacion: Date,
  fechaCaducidad: Date,
  capacidad: String,
  agenteExtintor: String,
  ultimaRevision: { fecha: Date, resultado: String, tecnico: String, observaciones: String },
  proximaRevision: Date,
  estado: { type: String, enum: ['activo', 'inactivo', 'en_revision', 'caducado', 'baja'], default: 'activo' },
  manualUsoUrl: String,
  fotoUrl: String,
  historialRevisiones: [{ fecha: Date, resultado: String, tecnico: String, observaciones: String }],
  historialMantenimientos: [{ fecha: Date, tipo: String, descripcion: String, coste: Number }]
}, { timestamps: true })

EquipoSchema.index({ centerId: 1, estado: 1 })
EquipoSchema.index({ tenantId: 1, tipo: 1 })
EquipoSchema.index({ codigoQR: 1 })
EquipoSchema.index({ proximaRevision: 1 })

export const EquipoContraIncendios = mongoose.model('EquipoContraIncendios', EquipoSchema)
