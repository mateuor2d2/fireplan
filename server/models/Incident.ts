import mongoose from 'mongoose'

const IncidentSchema = new mongoose.Schema({
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyPlan' },

  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['real', 'simulacro', 'prueba'], required: true },
  category: { type: String, required: true },
  severity: { type: String, enum: ['leve', 'moderado', 'grave', 'critico'], required: true },

  detectedAt: { type: Date, required: true },
  startedAt: { type: Date, required: true },
  resolvedAt: { type: Date },
  duration: { type: Number },

  location: {
    zone: { type: String, required: true },
    floor: { type: Number },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },

  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  causes: { type: String, trim: true },
  consequences: { type: String, trim: true },

  actions: [{
    description: { type: String },
    performedBy: { type: String },
    performedAt: { type: Date }
  }],

  resourcesUsed: [{ type: String }],

  peopleInvolved: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    role: { type: String },
    actions: { type: String }
  }],

  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },

  photos: [{ type: String }],
  documents: [{ type: String }],

  report: {
    summary: { type: String },
    lessonsLearned: { type: String },
    improvements: [{ type: String }],
    approvedBy: { type: String },
    approvedAt: { type: Date }
  },

  notificationsSent: [{
    channel: { type: String, enum: ['telegram', 'email', 'sms'] },
    sentAt: { type: Date },
    recipients: { type: Number },
    success: { type: Number },
    failed: { type: Number }
  }]
}, { timestamps: true })

IncidentSchema.index({ tenantId: 1, centerId: 1, status: 1 })
IncidentSchema.index({ tenantId: 1, createdAt: -1 })

export const Incident = mongoose.model('Incident', IncidentSchema)
