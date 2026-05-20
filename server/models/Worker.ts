import mongoose from 'mongoose'

export type WorkerRole = 'trabajador' | 'jefe_equipo' | 'coordinador' | 'director'
export type EmergencyRole = 'evacuacion' | 'primeros_auxilios' | 'extincion' | 'comunicaciones' | 'centro_control' | 'ninguno'

export interface IWorker {
  _id: string
  tenantId: string
  userId?: string
  name: string
  email?: string
  phone?: string
  dni?: string
  fotoUrl?: string
  role: WorkerRole
  emergencyRole: EmergencyRole
  centers: Array<{ centerId: string; assignedAt: Date; roleInCenter?: string }>
  telegramChatId?: string
  fichajeExternoId?: string
  formacion?: Array<{ tipo: string; fecha: Date; validoHasta?: Date; certificadoUrl?: string }>
  createdAt?: Date
  updatedAt?: Date
}

const WorkerSchema = new mongoose.Schema<IWorker>({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  dni: { type: String, trim: true },
  fotoUrl: { type: String },
  role: { type: String, enum: ['trabajador', 'jefe_equipo', 'coordinador', 'director'], default: 'trabajador' },
  emergencyRole: { type: String, enum: ['evacuacion', 'primeros_auxilios', 'extincion', 'comunicaciones', 'centro_control', 'ninguno'], default: 'ninguno' },
  centers: [{ centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true }, assignedAt: { type: Date, default: Date.now }, roleInCenter: { type: String } }],
  telegramChatId: { type: String },
  fichajeExternoId: { type: String },
  formacion: [{ tipo: { type: String, required: true }, fecha: { type: Date, required: true }, validoHasta: { type: Date }, certificadoUrl: { type: String } }]
}, { timestamps: true })

WorkerSchema.index({ tenantId: 1, name: 1 })
WorkerSchema.index({ tenantId: 1, 'centers.centerId': 1 })
WorkerSchema.index({ fichajeExternoId: 1 }, { sparse: true })
WorkerSchema.index({ userId: 1 }, { sparse: true })

export const Worker = mongoose.model('Worker', WorkerSchema)
