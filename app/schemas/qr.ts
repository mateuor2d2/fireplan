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
 * QR settings update request (all fields optional for partial updates)
 */
export const QRSettingsUpdateSchema = z.object({
  baseUrl: z.string().url('Invalid base URL').optional(),
  autoGenerate: z.boolean().optional(),
  expirationDays: z.enum(EXPIRATION_DAYS_OPTIONS).optional()
}).strict()

export type QRSettingsUpdate = z.infer<typeof QRSettingsUpdateSchema>

/**
 * QR settings response
 * Note: API returns data directly as { autoGenerate, baseUrl, expirationDays, createdAt, updatedAt }
 */
export const QRSettingsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    autoGenerate: z.boolean(),
    baseUrl: z.string().url(),
    expirationDays: z.enum(EXPIRATION_DAYS_OPTIONS),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional()
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

  // Values
  EXPIRATION_DAYS_OPTIONS,
  QR_CODE_STATE
}
