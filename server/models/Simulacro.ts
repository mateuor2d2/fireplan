import mongoose from 'mongoose'

export interface ISimulacro {
  _id: string
  centerId: string
  tenantId: string
  fecha: Date
  tipo: 'evacuacion' | 'incendio' | 'explosion' | 'amenaza_bomba' | 'quimico' | 'otro'
  escenario: string
  participantes: Array<any>
  evaluacion: {
    tiempoEvacuacion?: number
    tiempoRespuesta?: number
    puntosFuertes: string[]
    puntosDebil: string[]
    incidencias: Array<any>
    cumplimientoNormativa?: number
    resultado: 'satisfactorio' | 'mejorable' | 'insatisfactorio'
  }
  informeUrl?: string
  fotosUrls: string[]
  realizadoPor?: string
  aprobadoPor?: string
  accionesCorrectivas: Array<any>
  createdAt?: Date
  updatedAt?: Date
}

const SimulacroSchema = new mongoose.Schema<ISimulacro>({
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  fecha: { type: Date, required: true },
  tipo: { type: String, enum: ['evacuacion', 'incendio', 'explosion', 'amenaza_bomba', 'quimico', 'otro'], required: true },
  escenario: { type: String, required: true },
  participantes: [{ workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }, role: String, asistencia: Boolean, tiempoRespuesta: Number, observaciones: String }],
  evaluacion: {
    tiempoEvacuacion: Number,
    tiempoRespuesta: Number,
    puntosFuertes: [String],
    puntosDebil: [String],
    incidencias: [{ tipo: String, descripcion: String, gravedad: String }],
    cumplimientoNormativa: { type: Number, min: 0, max: 100 },
    resultado: { type: String, enum: ['satisfactorio', 'mejorable', 'insatisfactorio'], required: true }
  },
  informeUrl: String,
  fotosUrls: [String],
  realizadoPor: String,
  aprobadoPor: String,
  accionesCorrectivas: [{ descripcion: String, responsable: String, fechaLimite: Date, estado: { type: String, enum: ['pendiente', 'en_progreso', 'completada'], default: 'pendiente' } }]
}, { timestamps: true })

SimulacroSchema.index({ centerId: 1, fecha: -1 })
SimulacroSchema.index({ tenantId: 1, fecha: -1 })

export const Simulacro = mongoose.model('Simulacro', SimulacroSchema)
