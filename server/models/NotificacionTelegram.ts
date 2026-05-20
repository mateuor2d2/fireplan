import mongoose from 'mongoose'

export interface INotificacionTelegram {
  _id: string
  workerId: string
  centerId: string
  tenantId: string
  tipo: 'fichaje_entrada' | 'simulacro' | 'revision_equipo' | 'incidencia' | 'recordatorio_formacion'
  mensaje: string
  chatId: string
  messageId?: string
  estado: 'pendiente' | 'enviada' | 'leida' | 'error'
  error?: string
  createdAt?: Date
  sentAt?: Date
  readAt?: Date
}

const NotificacionSchema = new mongoose.Schema<INotificacionTelegram>({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  tipo: { type: String, enum: ['fichaje_entrada', 'simulacro', 'revision_equipo', 'incidencia', 'recordatorio_formacion'], required: true },
  mensaje: { type: String, required: true },
  chatId: { type: String, required: true },
  messageId: { type: String },
  estado: { type: String, enum: ['pendiente', 'enviada', 'leida', 'error'], default: 'pendiente' },
  error: { type: String },
  sentAt: { type: Date },
  readAt: { type: Date }
}, { timestamps: true })

NotificacionSchema.index({ workerId: 1, estado: 1 })
NotificacionSchema.index({ tenantId: 1, createdAt: -1 })

export const NotificacionTelegram = mongoose.model('NotificacionTelegram', NotificacionSchema)
