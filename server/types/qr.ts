import type { ObjectId } from 'mongodb'

// ============================================================================
// MongoDB Document Types
// ============================================================================

/**
 * PlanQR embedded document (MongoDB)
 * Stored within Plan documents
 */
export interface PlanQRDocument {
  _id?: ObjectId
  planId: ObjectId
  slug: string
  accessToken: string
  expiresAt: Date
  qrCodeImage: string
  publicUrl: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * UserQRSettings embedded document (MongoDB)
 * Stored within User documents
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
 * QR code generation options (server-side)
 */
export interface QRGenerateServerOptions {
  planId: string
  userId: string
  slug?: string
  expirationDays?: number
  baseUrl?: string
}

/**
 * QR code generation result (server-side)
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
  plan?: unknown
}

// ============================================================================
// Service Types
// ============================================================================

/**
 * QR service interface
 * Defines the contract for QR service implementation
 */
export interface IQRService {
  /**
   * Generate a QR code for a plan
   */
  generateForPlan(options: QRGenerateServerOptions): Promise<QRGenerateResult>

  /**
   * Regenerate a QR code for a plan (new access token)
   */
  regenerateForPlan(planId: string, userId: string): Promise<QRGenerateResult>

  /**
   * Validate public access via QR code
   */
  validatePublicAccess(
    planId: string,
    slug: string,
    accessToken: string
  ): Promise<QRPublicAccessValidation>

  /**
   * Get user QR settings
   */
  getUserSettings(userId: string): Promise<UserQRSettingsDocument | null>

  /**
   * Update user QR settings
   */
  updateUserSettings(
    userId: string,
    settings: Partial<UserQRSettingsDocument>
  ): Promise<UserQRSettingsDocument>
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

/**
 * QR code state for queries
 */
export type QRCodeQueryState = 'active' | 'disabled' | 'expired' | 'all'

/**
 * Slug generation options
 */
export interface SlugGenerateOptions {
  text: string
  maxLength?: number
  lowerCase?: boolean
}

// ============================================================================
// Mongoose Schema Types
// ============================================================================

/**
 * PlanQR embedded schema definition
 */
export interface PlanQRSchemaDefinition {
  _id?: typeof Schema.Types.ObjectId
  planId: {
    type: typeof Schema.Types.ObjectId
    required: true
  }
  slug: {
    type: StringConstructor
    required: true
    maxlength: 50
  }
  accessToken: {
    type: StringConstructor
    required: true
    unique: boolean
    sparse: boolean
  }
  expiresAt: {
    type: DateConstructor
    required: true
  }
  qrCodeImage: {
    type: StringConstructor
    required: true
  }
  enabled: {
    type: BooleanConstructor
    required: true
    default: boolean
  }
  createdAt: {
    type: DateConstructor
    required: true
  }
  updatedAt: {
    type: DateConstructor
    required: true
  }
}

/**
 * UserQRSettings embedded schema definition
 */
export interface UserQRSettingsSchemaDefinition {
  _id?: typeof Schema.Types.ObjectId
  userId: {
    type: typeof Schema.Types.ObjectId
    required: true
  }
  baseUrl: {
    type: StringConstructor
    required: true
    default: string
  }
  autoGenerate: {
    type: BooleanConstructor
    required: true
    default: boolean
  }
  expirationDays: {
    type: NumberConstructor
    required: true
    default: number
    enum: number[]
  }
  createdAt: {
    type: DateConstructor
    required: true
  }
  updatedAt: {
    type: DateConstructor
    required: true
  }
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  // MongoDB Documents
  PlanQRDocument,
  UserQRSettingsDocument,

  // API Types
  QRGenerateServerOptions,
  QRGenerateResult,
  QRPublicAccessValidation,

  // Service Interface
  IQRService,

  // Utility Types
  ExpirationOption,
  QRCodeStatistics,
  QRCodeQueryState,
  SlugGenerateOptions,

  // Mongoose Schema Definitions
  PlanQRSchemaDefinition,
  UserQRSettingsSchemaDefinition
}
