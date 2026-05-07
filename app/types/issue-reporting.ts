// ============================================================================
// Issue Reporting Types
// ============================================================================
// TypeScript type definitions for the QR issue reporting feature
//
// These types define the data structures for:
// - Coordinators (health & safety coordinators for construction works)
// - Verification codes (email/SMS verification for issue reporting)
// - API responses and DTOs
//
// All types use relative imports (no ~ or @ aliases) per Nuxt 4 requirements
//
// ============================================================================

// ============================================================================
// Coordinator Types
// ============================================================================

/**
 * Full coordinator document with all fields
 */
export interface Coordinator {
  _id?: string
  obraId: string
  name: string
  cargo: string
  email: string
  phone: string
  smsEnabled: boolean
  active: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO for creating a new coordinator
 */
export interface CoordinatorCreate {
  obraId: string
  name: string
  cargo: string
  email: string
  phone: string
  smsEnabled?: boolean
  active?: boolean
}

/**
 * DTO for updating an existing coordinator
 */
export interface CoordinatorUpdate {
  name?: string
  cargo?: string
  email?: string
  phone?: string
  smsEnabled?: boolean
  active?: boolean
}

// ============================================================================
// Verification Code Types
// ============================================================================

/**
 * Full verification code document with all fields
 */
export interface VerificationCode {
  _id?: string
  code: string
  email?: string
  phone?: string
  method: 'email' | 'sms' | 'both'
  expiresAt: Date
  verified: boolean
  obraId: string
  ipAddress?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO for creating a new verification code
 */
export interface VerificationCodeCreate {
  email?: string
  phone?: string
  method?: 'email' | 'sms' | 'both'
  obraId: string
  ipAddress?: string
}

/**
 * DTO for validating a verification code
 */
export interface VerificationCodeValidate {
  code: string
  obraId: string
}

/**
 * Verification response with code details
 */
export interface VerificationCodeResponse {
  success: true
  data: VerificationCode
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response for single coordinator fetch
 */
export interface CoordinatorResponse {
  success: true
  data: Coordinator
}

/**
 * Response for coordinator list fetch
 */
export interface CoordinatorListResponse {
  success: true
  data: Coordinator[]
}

/**
 * Response for multiple coordinators creation
 */
export interface CoordinatorBatchCreateResponse {
  success: true
  data: {
    created: number
    failed: number
    errors: Array<{
      coordinator: CoordinatorCreate
      error: string
    }>
  }
}

/**
 * Response for verification code generation
 */
export interface VerificationCodeResponse {
  success: true
  data: VerificationCode
}

/**
 * Response for issue creation after verification
 */
export interface IssueCreatedResponse {
  success: true
  data: {
    issueId: string
    referenceNumber: string
    createdAt: Date
  }
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Query parameters for filtering coordinators
 */
export interface CoordinatorQueryParams {
  obraId?: string
  active?: boolean
  smsEnabled?: boolean
}

/**
 * Query parameters for filtering verification codes
 */
export interface VerificationCodeQueryParams {
  obraId?: string
  verified?: boolean
  method?: 'email' | 'sms' | 'both'
  active?: boolean
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Contact method for verification
 */
export type VerificationMethod = 'email' | 'sms' | 'both'

/**
 * Issue priority levels
 */
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Issue status types
 */
export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'closed'

/**
 * Issue type categories
 */
export type IssueType = 'annotation' | 'comment' | 'accident'

/**
 * Photo upload data
 */
export interface PhotoUpload {
  id: string
  url: string
  caption?: string
}

/**
 * Location information for the issue
 */
export interface IssueLocation {
  building?: string
  floor?: string
  area?: string
}

/**
 * Public issue submission data (from anonymous form)
 * This matches the Zod schema for the public API endpoint
 */
export interface IssueReportSubmit {
  // Reporter information
  reporterName: string
  reporterEmail: string
  reporterPhone: string

  // Issue details
  title: string
  description: string
  type: IssueType
  priority: IssuePriority

  // Optional photos array
  photos?: PhotoUpload[]

  // Optional location
  location?: IssueLocation

  // Verification
  verificationCode: string

  // QR access validation
  qrSlug: string
  accessToken: string
}

/**
 * Response after successful issue submission
 */
export interface IssueReportResponse {
  success: true
  data: {
    referenceNumber: string
    issueId: string
    issue: {
      id: string
      title: string
      type: IssueType
      status: IssueStatus
      priority: IssuePriority
      createdAt: Date
    }
  }
}

/**
 * Form submission data for issue reporting (legacy interface for internal forms)
 * @deprecated Use IssueReportSubmit for public API
 */
export interface IssueReportFormData {
  // Personal information
  name: string
  phone: string
  email: string

  // Issue details
  title: string
  description: string
  type: IssueType
  priority: IssuePriority

  // Location
  location: string

  // Optional photo
  photo?: File | null
  photoCaption?: string

  // Verification
  verificationCode: string
}

/**
 * Notification recipient information
 */
export interface NotificationRecipient {
  name: string
  cargo: string
  email: string
  phone?: string
  smsEnabled?: boolean
}

/**
 * Notification delivery status
 */
export interface NotificationDeliveryStatus {
  coordinatorId: string
  success: boolean
  method: 'email' | 'sms' | 'both'
  error?: string
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  // Coordinator types
  Coordinator,
  CoordinatorCreate,
  CoordinatorUpdate,
  CoordinatorListResponse,
  CoordinatorResponse,

  // Verification code types
  VerificationCode,
  VerificationCodeCreate,
  VerificationCodeValidate,
  VerificationCodeResponse,

  // Response types
  IssueCreatedResponse,
  NotificationDeliveryStatus,
  IssueReportResponse,

  // Query types
  CoordinatorQueryParams,
  VerificationCodeQueryParams,

  // Utility types
  VerificationMethod,
  IssuePriority,
  IssueStatus,
  IssueType,

  // Form types
  IssueReportSubmit,
  PhotoUpload,
  IssueLocation,
  NotificationRecipient
}
