// ============================================================================
// QR Code Types - Client Side
// ============================================================================
// These types are used in Vue components and composables
// For Zod validation schemas, see app/schemas/qr.ts

// ============================================================================
// Common Types
// ============================================================================

/**
 * Allowed expiration periods in days
 */
export const EXPIRATION_OPTIONS = [
  { label: '30 días', value: 30 },
  { label: '90 días', value: 90 },
  { label: '180 días', value: 180 },
  { label: '1 año (360 días)', value: 360 },
  { label: '2 años (720 días)', value: 720 },
  { label: '3 años (1080 días)', value: 1080 },
  { label: '4 años (1440 días)', value: 1440 }
] as const

export type ExpirationDays = typeof EXPIRATION_OPTIONS[number]['value']

/**
 * QR code state
 */
export type QRCodeState = 'active' | 'disabled' | 'expired'

// ============================================================================
// QR Code Display Types
// ============================================================================

/**
 * QR code display model (for UI components)
 */
export interface QRCodeDisplay {
  slug: string
  publicUrl: string
  expiresAt: Date
  expiresAtDisplay: string
  qrCodeImage: string
  enabled: boolean
  daysUntilExpiration: number
  state: QRCodeState
}

/**
 * QR code generation options
 */
export interface QRGenerateOptions {
  expirationDays?: ExpirationDays
  baseUrl?: string
}

/**
 * QR code generation response
 */
export interface QRCodeResponse {
  success: true
  data: {
    qrCode: QRCodeDisplay
  }
}

// ============================================================================
// User QR Settings Types
// ============================================================================

/**
 * User QR settings (for settings page) - minimal version without timestamps
 */
export interface QRSettings {
  baseUrl: string
  autoGenerate: boolean
  expirationDays: ExpirationDays
}

/**
 * QR settings with timestamps (from database)
 */
export interface QRSettingsWithDates extends QRSettings {
  createdAt: Date
  updatedAt: Date
}

/**
 * QR settings update request (all fields optional for partial updates)
 */
export interface QRSettingsUpdate {
  baseUrl?: string
  autoGenerate?: boolean
  expirationDays?: ExpirationDays
}

/**
 * QR settings response - API returns data directly
 */
export interface QRSettingsResponse {
  success: true
  data: QRSettings & {
    createdAt?: Date
    updatedAt?: Date
  }
}

// ============================================================================
// Public Access Types
// ============================================================================

/**
 * Public plan display (for public page)
 */
export interface QRPublicPlan {
  _id: string
  nom_obra: string
  desc_obra?: string
  fecha_inicio: Date
  fecha_fin: Date
  qrCode: {
    slug: string
    expiresAt: Date
    expiresAtDisplay: string
    daysUntilExpiration: number
    isExpiringSoon: boolean
  }
  downloadUrl: string
}

/**
 * Public plan access response
 */
export interface QRPublicAccessResponse {
  success: true
  data: {
    plan: QRPublicPlan
  }
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error response
 */
export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/**
 * QR-specific error codes
 */
export type QRErrorCode
  = | 'PLAN_NOT_FOUND'
    | 'PLAN_ACCESS_DENIED'
    | 'QR_NOT_EXISTS'
    | 'QR_ALREADY_EXISTS'
    | 'QR_EXPIRED'
    | 'PLAN_NOT_ACCESSIBLE'
    | 'INVALID_EXPIRATION_DAYS'
    | 'INVALID_BASE_URL'
    | 'SETTINGS_NOT_FOUND'

/**
 * QR error response
 */
export interface QRErrorResponse extends ErrorResponse {
  error: {
    code: QRErrorCode
    message: string
    details?: unknown
  }
}

// ============================================================================
// Extended Plan Types
// ============================================================================

/**
 * Extended Plan interface with QR code data
 * Use to augment existing Plan types
 */
export interface PlanWithQR {
  _id: string
  nom_obra: string
  qrCode?: QRCodeDisplay | null
  qrEnabled?: boolean
}

// ============================================================================
// Form Types for Components
// ============================================================================

/**
 * QR settings form data
 */
export interface QRSettingsFormData {
  baseUrl: string
  autoGenerate: boolean
  expirationDays: ExpirationDays
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  // Common
  EXPIRATION_OPTIONS,

  // QR Code Display
  QRCodeDisplay,
  QRGenerateOptions,
  QRCodeResponse,

  // User Settings
  QRSettings,
  QRSettingsUpdate,
  QRSettingsResponse,

  // Public Access
  QRPublicPlan,
  QRPublicAccessResponse,

  // Errors
  ErrorResponse,
  QRErrorResponse,

  // Extended
  PlanWithQR,

  // Forms
  QRSettingsFormData
}
