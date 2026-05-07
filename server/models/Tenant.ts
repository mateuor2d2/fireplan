import mongoose, { Schema, Document } from 'mongoose'

export interface ITenant extends Document {
  name: string
  slug: string
  domain?: string
  status: 'active' | 'inactive' | 'suspended'
  plan: string
  settings?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const TenantSchema = new Schema<ITenant>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  domain: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  plan: { type: String, default: 'free' },
  settings: { type: Schema.Types.Mixed }
}, { timestamps: true })

export const Tenant = mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema)
