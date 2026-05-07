import mongoose from 'mongoose'

const EmergencyPlanSchema = new mongoose.Schema({
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  version: { type: Number, default: 1 },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  language: { type: String, default: 'es' },

  datosIdentificativos: {
    denominacion: { type: String, trim: true },
    direccion: { type: String, trim: true },
    actividad: { type: String, trim: true },
    cnae: { type: String, trim: true },
    cifNif: { type: String, trim: true },
    empleados: { type: Number, min: 0 },
    superficie: { type: Number, min: 0 },
    plantas: { type: Number, min: 0 },
    aforo: { type: Number, min: 0 }
  },

  organizacion: {
    jefeEmergencias: {
      name: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    jefeEvacuacion: {
      name: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    jefeExtincion: {
      name: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    jefePrimerosAuxilios: {
      name: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    miembrosEquipo: [{
      name: { type: String },
      role: { type: String },
      phone: { type: String },
      email: { type: String }
    }],
    brigadistas: [{
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      zone: { type: String }
    }]
  },

  recursos: {
    extintores: [{
      ubicacion: { type: String },
      tipo: { type: String },
      capacidad: { type: String },
      fechaRevision: { type: Date }
    }],
    bocasIncendio: [{
      ubicacion: { type: String },
      tipo: { type: String }
    }],
    alarmas: [{
      ubicacion: { type: String },
      tipo: { type: String }
    }],
    salidasEmergencia: [{
      ubicacion: { type: String },
      tipo: { type: String },
      destino: { type: String }
    }],
    puntosEncuentro: [{
      nombre: { type: String },
      ubicacion: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    }]
  },

  procedimientos: {
    evacuacion: {
      descripcion: { type: String },
      pasos: [{ type: String }],
      tiempoEstimado: { type: Number }
    },
    extincion: {
      descripcion: { type: String },
      pasos: [{ type: String }]
    },
    primerosAuxilios: {
      descripcion: { type: String },
      pasos: [{ type: String }]
    },
    comunicacion: {
      descripcion: { type: String },
      pasos: [{ type: String }],
      numerosEmergencia: [{ type: String }]
    }
  },

  documentos: [{
    nombre: { type: String },
    url: { type: String },
    tipo: { type: String },
    fecha: { type: Date }
  }],

  fechaElaboracion: { type: Date },
  fechaRevision: { type: Date },
  proximaRevision: { type: Date }
}, { timestamps: true })

EmergencyPlanSchema.index({ tenantId: 1, centerId: 1, status: 1 })
EmergencyPlanSchema.index({ tenantId: 1, status: 1, version: -1 })

export const EmergencyPlan = mongoose.model('EmergencyPlan', EmergencyPlanSchema)
