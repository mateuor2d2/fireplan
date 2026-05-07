import mongoose from 'mongoose'

const CenterSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true, trim: true },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, default: 'ES', trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  sector: { type: String, trim: true },
  activity: { type: String, trim: true },
  surfaceM2: { type: Number, min: 0 },
  floors: { type: Number, min: 0, default: 1 },
  maxOccupancy: { type: Number, min: 0 },
  normativa: {
    region: { type: String, default: 'es' },
    reglamento: { type: String }
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  jornadaSyncEnabled: { type: Boolean, default: false },
  jornadaTenantId: { type: String }
}, { timestamps: true })

CenterSchema.index({ tenantId: 1, status: 1 })
CenterSchema.index({ tenantId: 1, name: 1 })

export const Center = mongoose.model('Center', CenterSchema)
