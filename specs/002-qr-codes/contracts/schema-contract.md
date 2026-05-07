# Zod Schema Contract: QR Codes for Safety Plans

**Feature**: 002-qr-codes
**Date**: 2025-01-14
**Version**: 1.0.0

## Overview

This document defines the Zod validation schemas for the QR codes feature. All schemas follow constitutional requirements for end-to-end TypeScript integration with Zod validation at all boundaries.

## Schema Exports

`app/schemas/qr.ts`

```typescript
import { z } from 'zod'

// ============================================================================
// Common Types
// ============================================================================

/**
 * Allowed expiration periods in days
 */
export const EXPIRATION_DAYS_OPTIONS = [30, 90, 180, 360, 720, 1080, 1440] as const
export type ExpirationDays = typeof EXPIRATION_DAYS_OPTIONS[number]

/**
 * QR code state
 */
export const QR_CODE_STATE = ['active', 'disabled', 'expired'] as const
export type QRCodeState = typeof QR_CODE_STATE[number]

// ============================================================================
// QR Code Schemas
// ============================================================================

/**
 * PlanQR embedded document schema
 */
export const PlanQRSchema = z.object({
  _id: z.string().optional(),
  planId: z.string().regex(/^[0-9a-f]{24}$/, 'Invalid plan ID format'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be 50 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  accessToken: z.string().uuid('Invalid access token format'),
  expiresAt: z.coerce.date().refine(date => date > new Date(), 'Expiration date must be in the future'),
  qrCodeImage: z.string()
    .startsWith('data:image/png;base64,', 'QR code image must be a base64 PNG data URL')
    .max(10000, 'QR code image must be 10KB or less'), // ~10KB base64
  enabled: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export type PlanQR = z.infer<typeof PlanQRSchema>

/**
 * QR code display model (for UI)
 */
export const QRCodeDisplaySchema = z.object({
  slug: z.string(),
  publicUrl: z.string().url('Invalid public URL'),
  expiresAt: z.coerce.date(),
  expiresAtDisplay: z.string(), // DD/MM/YYYY format
  qrCodeImage: z.string(),
  enabled: z.boolean(),
  daysUntilExpiration: z.number().int().min(-999),
  state: z.enum(QR_CODE_STATE)
})

export type QRCodeDisplay = z.infer<typeof QRCodeDisplaySchema>

/**
 * QR code generation options
 */
export const QRGenerateOptionsSchema = z.object({
  expirationDays: z.enum(EXPIRATION_DAYS_OPTIONS).optional(),
  baseUrl: z.string().url('Invalid base URL').optional()
})

export type QRGenerateOptions = z.infer<typeof QRGenerateOptionsSchema>

/**
 * QR code generation response
 */
export const QRCodeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    qrCode: QRCodeDisplaySchema
  })
})

export type QRCodeResponse = z.infer<typeof QRCodeResponseSchema>

// ============================================================================
// User QR Settings Schemas
// ============================================================================

/**
 * UserQRSettings embedded document schema
 */
export const UserQRSettingsSchema = z.object({
  _id: z.string().optional(),
  userId: z.string().regex(/^[0-9a-f]{24}$/, 'Invalid user ID format'),
  baseUrl: z.string().url('Invalid base URL'),
  autoGenerate: z.boolean(),
  expirationDays: z.enum(EXPIRATION_DAYS_OPTIONS),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export type UserQRSettings = z.infer<typeof UserQRSettingsSchema>

/**
 * QR settings update request
 */
export const QRSettingsUpdateSchema = z.object({
  baseUrl: z.string().url('Invalid base URL'),
  autoGenerate: z.boolean(),
  expirationDays: z.enum(EXPIRATION_DAYS_OPTIONS)
})

export type QRSettingsUpdate = z.infer<typeof QRSettingsUpdateSchema>

/**
 * QR settings response
 */
export const QRSettingsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    qrSettings: UserQRSettingsSchema.pick({
      baseUrl: true,
      autoGenerate: true,
      expirationDays: true,
      createdAt: true,
      updatedAt: true
    })
  })
})

export type QRSettingsResponse = z.infer<typeof QRSettingsResponseSchema>

// ============================================================================
// Public Access Schemas
// ============================================================================

/**
 * Public plan access parameters
 */
export const QRPublicAccessParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{24}$/, 'Invalid plan ID format'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format')
})

export type QRPublicAccessParams = z.infer<typeof QRPublicAccessParamsSchema>

/**
 * Public plan display (for public page)
 */
export const QRPublicPlanSchema = z.object({
  _id: z.string(),
  nom_obra: z.string(),
  desc_obra: z.string().optional(),
  fecha_inicio: z.coerce.date(),
  fecha_fin: z.coerce.date(),
  qrCode: z.object({
    slug: z.string(),
    expiresAt: z.coerce.date(),
    expiresAtDisplay: z.string(),
    daysUntilExpiration: z.number().int(),
    isExpiringSoon: z.boolean() // true if < 7 days
  }),
  downloadUrl: z.string().url()
})

export type QRPublicPlan = z.infer<typeof QRPublicPlanSchema>

/**
 * Public plan access response
 */
export const QRPublicAccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    plan: QRPublicPlanSchema
  })
})

export type QRPublicAccessResponse = z.infer<typeof QRPublicAccessResponseSchema>

// ============================================================================
// Error Schemas
// ============================================================================

/**
 * Error response schema
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  })
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

/**
 * QR-specific error codes
 */
export const QR_ERROR_CODES = [
  'PLAN_NOT_FOUND',
  'PLAN_ACCESS_DENIED',
  'QR_NOT_EXISTS',
  'QR_ALREADY_EXISTS',
  'QR_EXPIRED',
  'PLAN_NOT_ACCESSIBLE',
  'INVALID_EXPIRATION_DAYS',
  'INVALID_BASE_URL',
  'SETTINGS_NOT_FOUND'
] as const

export type QRErrorCode = typeof QR_ERROR_CODES[number]

/**
 * QR error response
 */
export const QRErrorResponseSchema = ErrorResponseSchema.extend({
  error: z.object({
    code: z.enum(QR_ERROR_CODES),
    message: z.string(),
    details: z.any().optional()
  })
})

export type QRErrorResponse = z.infer<typeof QRErrorResponseSchema>

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate days until expiration
 */
export function calculateDaysUntilExpiration(expiresAt: Date): number {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diffTime = expires.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calculate QR code state
 */
export function calculateQRCodeState(
  enabled: boolean,
  expiresAt: Date
): QRCodeState {
  if (!enabled) return 'disabled'
  const now = new Date()
  const expires = new Date(expiresAt)
  return expires > now ? 'active' : 'expired'
}

/**
 * Format expiration date for display (DD/MM/YYYY)
 */
export function formatExpirationDate(expiresAt: Date): string {
  const date = new Date(expiresAt)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Check if QR code is expiring soon (< 7 days)
 */
export function isExpiringSoon(expiresAt: Date): boolean {
  const daysUntil = calculateDaysUntilExpiration(expiresAt)
  return daysUntil >= 0 && daysUntil < 7
}

/**
 * Generate public URL from components
 */
export function generatePublicUrl(
  baseUrl: string,
  planId: string,
  slug: string
): string {
  return `${baseUrl}/public/planes/${planId}/${slug}`
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate and parse expiration days
 */
export function validateExpirationDays(value: unknown): ExpirationDays {
  return QRSettingsUpdateSchema.shape.expirationDays.parse(value)
}

/**
 * Validate base URL format
 */
export function validateBaseUrl(value: unknown): string {
  return z.string().url().parse(value)
}

/**
 * Validate UUID format
 */
export function validateAccessToken(value: unknown): string {
  return z.string().uuid().parse(value)
}

/**
 * Validate slug format
 */
export function validateSlug(value: unknown): string {
  return z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .parse(value)
}

// ============================================================================
// Schema Re-exports
// ============================================================================

export default {
  // Plan QR
  PlanQRSchema,
  QRCodeDisplaySchema,
  QRGenerateOptionsSchema,
  QRCodeResponseSchema,

  // User QR Settings
  UserQRSettingsSchema,
  QRSettingsUpdateSchema,
  QRSettingsResponseSchema,

  // Public Access
  QRPublicAccessParamsSchema,
  QRPublicPlanSchema,
  QRPublicAccessResponseSchema,

  // Errors
  ErrorResponseSchema,
  QRErrorResponseSchema,
  QR_ERROR_CODES,

  // Utilities
  calculateDaysUntilExpiration,
  calculateQRCodeState,
  formatExpirationDate,
  isExpiringSoon,
  generatePublicUrl,

  // Validation
  validateExpirationDays,
  validateBaseUrl,
  validateAccessToken,
  validateSlug,

  // Types
  EXPIRATION_DAYS_OPTIONS,
  QR_CODE_STATE,
  ExpirationDays,
  QRCodeState,
  PlanQR,
  QRCodeDisplay,
  QRGenerateOptions,
  QRCodeResponse,
  UserQRSettings,
  QRSettingsUpdate,
  QRSettingsResponse,
  QRPublicAccessParams,
  QRPublicPlan,
  QRPublicAccessResponse,
  ErrorResponse,
  QRErrorResponse,
  QRErrorCode
}
```

## Server-Side Types

`server/types/qr.ts`

```typescript
import { ObjectId } from 'mongodb'

// ============================================================================
// MongoDB Document Types
// ============================================================================

/**
 * PlanQR embedded document (MongoDB)
 */
export interface PlanQRDocument {
  _id?: ObjectId
  planId: ObjectId
  slug: string
  accessToken: string
  expiresAt: Date
  qrCodeImage: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * UserQRSettings embedded document (MongoDB)
 */
export interface UserQRSettingsDocument {
  _id?: ObjectId
  userId: ObjectId
  baseUrl: string
  autoGenerate: boolean
  expirationDays: number
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * QR code generation options (server)
 */
export interface QRGenerateServerOptions {
  planId: string
  userId: string
  slug?: string
  expirationDays?: number
  baseUrl?: string
}

/**
 * QR code generation result (server)
 */
export interface QRGenerateResult {
  slug: string
  accessToken: string
  publicUrl: string
  expiresAt: Date
  qrCodeImage: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Public access validation result
 */
export interface QRPublicAccessValidation {
  valid: boolean
  reason?: 'expired' | 'not_found' | 'disabled' | 'invalid_token'
  plan?: any
}

// ============================================================================
// Service Types
// ============================================================================

/**
 * QR service interface
 */
export interface IQRService {
  generateForPlan(options: QRGenerateServerOptions): Promise<QRGenerateResult>
  regenerateForPlan(planId: string, userId: string): Promise<QRGenerateResult>
  validatePublicAccess(planId: string, slug: string, accessToken: string): Promise<QRPublicAccessValidation>
  getUserSettings(userId: string): Promise<UserQRSettingsDocument | null>
  updateUserSettings(userId: string, settings: Partial<UserQRSettingsDocument>): Promise<UserQRSettingsDocument>
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Expiration option with label
 */
export interface ExpirationOption {
  label: string
  value: number
}

/**
 * QR code statistics (for future analytics)
 */
export interface QRCodeStatistics {
  totalQRCodes: number
  activeQRCodes: number
  expiredQRCodes: number
  disabledQRCodes: number
  averageExpirationDays: number
}

export default {
  PlanQRDocument,
  UserQRSettingsDocument,
  QRGenerateServerOptions,
  QRGenerateResult,
  QRPublicAccessValidation,
  IQRService,
  ExpirationOption,
  QRCodeStatistics
}
```

## Mongoose Schema Integration

`server/models/Plan.ts` (extended)

```typescript
import { Schema, models, model } from 'mongoose'
import { PlanQRDocument } from '../types/qr'

// PlanQR embedded schema
const PlanQRSchema = new Schema<PlanQRDocument>(
  {
    _id: Schema.Types.ObjectId,
    planId: { type: Schema.Types.ObjectId, required: true },
    slug: { type: String, required: true, maxlength: 50 },
    accessToken: { type: String, required: true, unique: true, sparse: true },
    expiresAt: { type: Date, required: true },
    qrCodeImage: { type: String, required: true },
    enabled: { type: Boolean, required: true, default: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  },
  { _id: false, timestamps: false }
)

// Index for QR code lookups
PlanQRSchema.index({ accessToken: 1 })
PlanQRSchema.index({ expiresAt: 1 })
PlanQRSchema.index({ planId: 1 })

// Extend existing Plan schema
const PlanSchema = new Schema({
  // ... existing fields ...

  qrCode: { type: PlanQRSchema, default: null },
  qrEnabled: { type: Boolean, default: true }
})

export default models.Plan || model('Plan', PlanSchema)
```

`server/models/User.ts` (extended)

```typescript
import { Schema, models, model } from 'mongoose'
import { UserQRSettingsDocument } from '../types/qr'

// UserQRSettings embedded schema
const UserQRSettingsSchema = new Schema<UserQRSettingsDocument>(
  {
    _id: Schema.Types.ObjectId,
    userId: { type: Schema.Types.ObjectId, required: true },
    baseUrl: {
      type: String,
      required: true,
      default: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    },
    autoGenerate: { type: Boolean, required: true, default: true },
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

// Extend existing User schema
const UserSchema = new Schema({
  // ... existing fields ...

  qrSettings: { type: UserQRSettingsSchema, default: null }
})

export default models.User || model('User', UserSchema)
```

## Validation Flow

### QR Code Generation Request

```
Request → Zod Validation → Business Logic → Database → Response
           (QRGenerateOptionsSchema)
```

### QR Settings Update Request

```
Request → Zod Validation → Business Logic → Database → Response
           (QRSettingsUpdateSchema)
```

### Public Access Request

```
Request → Zod Validation → Business Logic → Database Validation → Response
           (QRPublicAccessParamsSchema)
```

## Type Safety Summary

All constitutional requirements satisfied:

- ✅ TypeScript types defined end-to-end
- ✅ Zod schemas validate all API boundaries
- ✅ Client types in `app/types/qr.ts`
- ✅ Server types in `server/types/qr.ts`
- ✅ Mongoose schemas enforce database constraints
- ✅ Validation utilities provided
- ✅ Error types defined with specific error codes
- ✅ Utility functions for common operations
