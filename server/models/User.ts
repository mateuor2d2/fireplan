// server/models/User.ts
import type { Model, Document } from 'mongoose'
import { Schema, model } from 'mongoose'
import bcrypt from 'bcryptjs'
import type { UserQRSettingsDocument } from '../types/qr'

interface MatrizContacto {
  nombre: string | undefined
  apellido: string | undefined
}

interface AppSettings {
  persistCapitulosPerPlan: boolean
  persistPartidasPerPlan: boolean
  persistPresupuestoPerPlan: boolean
  autoLoadUserDefaults: boolean
  // Printing templates settings
}

export interface IUser {
  _id: string
  ttl: string
  created: string
  accessToken: string
  email: string
  password: string
  matriz_cif: string
  matriz_nombre: string
  matriz_dir: string
  matriz_pob: string
  matriz_cp: string
  matriz_tel: string
  matriz_obs: string
  matriz_contacto: MatrizContacto
  role: 'user' | 'control' | 'admin'
  emailVerified: boolean
  precioPSS: number
  name?: string
  avatar?: string
  googleId?: string
  githubId?: string
  appSettings?: AppSettings
  // User's default data for fallback when no plan-specific data exists
  userDefaultCapitulos?: any[] // User's custom default capitulos
  userDefaultPartidas?: any[] // User's custom default partidas
  userDefaultPresupuesto?: any[] // User's custom default presupuesto concepts
  // User QR settings for public plan access
  qrSettings?: UserQRSettingsDocument
  // Subscription fields (global product plan)
  plan?: 'starter' | 'professional' | 'enterprise'
  subscriptionStatus?: 'active' | 'inactive' | 'past_due' | 'canceled'
  subscriptionCurrentPeriodEnd?: Date
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  comparePassword(candidatePassword: string): Promise<boolean>
}

// ============================================================================
// User QR Settings Embedded Schema
// ============================================================================

const UserQRSettingsSchema = new Schema<UserQRSettingsDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    baseUrl: {
      type: String,
      required: true,
      default: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      validate: {
        validator: function (v: string) {
          try {
            new URL(v)
            return true
          } catch {
            return false
          }
        },
        message: 'Invalid base URL format'
      }
    },
    autoGenerate: {
      type: Boolean,
      required: true,
      default: true
    },
    expirationDays: {
      type: Number,
      required: true,
      default: 30,
      enum: [30, 90, 180, 360, 720, 1080, 1440]
    },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  },
  { _id: false, timestamps: false }
)

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: { type: String, required: false, select: false }, // Hide password by default, optional for OAuth users
    matriz_cif: { type: String, required: false, default: '' },
    matriz_nombre: { type: String, required: false, default: '' },
    matriz_dir: { type: String, required: false, default: '' },
    matriz_pob: { type: String, default: '' },
    matriz_cp: { type: String, default: '' },
    matriz_tel: { type: String, default: '' },
    matriz_obs: { type: String, default: '' },
    matriz_contacto: {
      nombre: { type: String, default: '' },
      apellido: { type: String, default: '' }
    },
    role: { type: String, default: 'user', enum: ['user', 'control', 'admin'] },
    emailVerified: { type: Boolean, default: false },
    precioPSS: { type: Number, default: 0 },
    ttl: { type: String, default: '' },
    created: { type: String, default: '' },
    accessToken: { type: String, default: '' },
    name: { type: String, required: false },
    avatar: { type: String, required: false },
    googleId: { type: String, required: false, unique: true, sparse: true },
    githubId: { type: String, required: false, unique: true, sparse: true },
    appSettings: {
      persistCapitulosPerPlan: { type: Boolean, default: false },
      persistPartidasPerPlan: { type: Boolean, default: false },
      persistPresupuestoPerPlan: { type: Boolean, default: false },
      autoLoadUserDefaults: { type: Boolean, default: true },
    },
    // User's default data for fallback when no plan-specific data exists
    userDefaultCapitulos: { type: [Schema.Types.Mixed], default: [] },
    userDefaultPartidas: { type: [Schema.Types.Mixed], default: [] },
    userDefaultPresupuesto: { type: [Schema.Types.Mixed], default: [] },
    // User's custom printing templates
    // User QR settings
    qrSettings: { type: UserQRSettingsSchema, default: null },
    // Subscription fields (global product plan)
    plan: { type: String, enum: ['starter', 'professional', 'enterprise'], default: 'starter' },
    subscriptionStatus: { type: String, enum: ['active', 'inactive', 'past_due', 'canceled'], default: 'inactive' },
    subscriptionCurrentPeriodEnd: { type: Date, required: false },
    stripeCustomerId: { type: String, required: false },
    stripeSubscriptionId: { type: String, required: false }
  },
  { timestamps: true }
)

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

// Index for QR settings
UserSchema.index({ 'qrSettings.autoGenerate': 1 })

export const User: Model<IUser> = model<IUser>('User', UserSchema)
