import mongoose from 'mongoose'

export interface IQRScan {
  _id: string
  equipoId: string
  centerId: string
  tenantId: string
  scannedBy: { workerId?: string; userId?: string; tipo: 'worker' | 'anonimo' }
  lat?: number
  lng?: number
  timestamp: Date
  accion: 'consulta' | 'revision' | 'incidencia'
  datosAccion?: { resultado?: string; observaciones?: string; incidencia?: string }
  createdAt?: Date
}

const QRScanSchema = new mongoose.Schema<IQRScan>({
  equipoId: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipoContraIncendios', required: true },
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  scannedBy: { workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }, userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, tipo: { type: String, enum: ['worker', 'anonimo'], required: true } },
  lat: Number,
  lng: Number,
  timestamp: { type: Date, default: Date.now },
  accion: { type: String, enum: ['consulta', 'revision', 'incidencia'], required: true },
  datosAccion: { resultado: String, observaciones: String, incidencia: String }
}, { timestamps: true })

QRScanSchema.index({ equipoId: 1, timestamp: -1 })
QRScanSchema.index({ centerId: 1, timestamp: -1 })

export const QRScan = mongoose.model('QRScan', QRScanSchema)
