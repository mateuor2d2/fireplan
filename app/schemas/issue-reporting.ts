import { z } from 'zod'

// ============================================================================
// Common Types
// ============================================================================

/**
 * Issue type categories
 */
export const ISSUE_TYPES = ['annotation', 'comment', 'accident'] as const
export type IssueType = typeof ISSUE_TYPES[number]

/**
 * Issue priority levels
 */
export const ISSUE_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type IssuePriority = typeof ISSUE_PRIORITIES[number]

/**
 * Issue status types
 */
export const ISSUE_STATUSES = ['open', 'in-progress', 'resolved', 'closed'] as const
export type IssueStatus = typeof ISSUE_STATUSES[number]

// ============================================================================
// Photo Upload Schemas
// ============================================================================

/**
 * Photo upload schema (individual photo)
 */
export const PhotoUploadSchema = z.object({
  id: z.string().min(1, 'ID de foto es requerido'),
  url: z.string().url('URL de foto inválida'),
  caption: z.string().max(200, 'Caption debe ser 200 caracteres o menos').optional()
})

export type PhotoUpload = z.infer<typeof PhotoUploadSchema>

// ============================================================================
// Location Schemas
// ============================================================================

/**
 * Issue location schema
 */
export const IssueLocationSchema = z.object({
  building: z.string().max(100, 'Nombre de edificio debe ser 100 caracteres o menos').optional(),
  floor: z.string().max(50, 'Nombre de piso debe ser 50 caracteres o menos').optional(),
  area: z.string().max(100, 'Nombre de área debe ser 100 caracteres o menos').optional()
}).strict()

export type IssueLocation = z.infer<typeof IssueLocationSchema>

// ============================================================================
// Issue Report Submission Schema
// ============================================================================

/**
 * Public issue submission schema
 * Used for validating anonymous issue submissions via QR code
 */
export const IssueReportSubmitSchema = z.object({
  // Reporter information
  reporterName: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre debe ser 100 caracteres o menos'),
  reporterEmail: z.string()
    .email('Formato de email inválido')
    .min(5, 'Email debe tener al menos 5 caracteres')
    .max(255, 'Email debe ser 255 caracteres o menos')
    .toLowerCase(),
  reporterPhone: z.string()
    .regex(/^[+]?[\d\s-]{9,15}$/, 'Formato de teléfono inválido (ej: +34 612 345 678)')
    .optional()
    .or(z.literal('')),

  // Issue details
  title: z.string()
    .min(5, 'Título debe tener al menos 5 caracteres')
    .max(200, 'Título debe ser 200 caracteres o menos'),
  description: z.string()
    .min(20, 'Descripción debe tener al menos 20 caracteres')
    .max(2000, 'Descripción debe ser 2000 caracteres o menos'),
  type: z.enum(ISSUE_TYPES, {
    errorMap: () => ({ message: 'Tipo de issue debe ser: annotation, comment, o accident' })
  }),
  priority: z.enum(ISSUE_PRIORITIES, {
    errorMap: () => ({ message: 'Prioridad debe ser: low, medium, high, o critical' })
  }),

  // Optional photos array
  photos: z.array(PhotoUploadSchema)
    .max(10, 'Máximo 10 fotos permitidas')
    .optional(),

  // Optional location
  location: IssueLocationSchema.optional(),

  // Verification (optional)
  verificationCode: z.string()
    .length(6, 'Código de verificación debe ser exactamente 6 dígitos')
    .regex(/^\d{6}$/, 'Código de verificación debe contener solo números')
    .optional()
    .or(z.literal('')),

  // QR access validation
  qrSlug: z.string()
    .min(3, 'Slug debe tener al menos 3 caracteres')
    .max(50, 'Slug debe ser 50 caracteres o menos')
    .regex(/^[a-z0-9-]+$/, 'Slug debe contener solo letras minúsculas, números y guiones'),
  accessToken: z.string()
    .uuid('Token de acceso debe ser un UUID válido')
    .optional() // Public access - token not required
}).passthrough() // Allow extra fields without failing

export type IssueReportSubmit = z.infer<typeof IssueReportSubmitSchema>

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Issue data in response
 */
export const IssueDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(ISSUE_TYPES),
  status: z.enum(ISSUE_STATUSES),
  priority: z.enum(ISSUE_PRIORITIES),
  createdAt: z.coerce.date()
})

export type IssueData = z.infer<typeof IssueDataSchema>

/**
 * Public issue submission response schema
 */
export const IssueReportResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    referenceNumber: z.string(),
    issueId: z.string(),
    issue: IssueDataSchema
  })
})

export type IssueReportResponse = z.infer<typeof IssueReportResponseSchema>

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

// ============================================================================
// Validation Error Codes
// ============================================================================

/**
 * Issue reporting error codes
 */
export const ISSUE_ERROR_CODES = [
  'VALIDATION_ERROR',
  'INVALID_QR_ACCESS',
  'QR_EXPIRED',
  'QR_DISABLED',
  'INVALID_VERIFICATION_CODE',
  'VERIFICATION_CODE_EXPIRED',
  'VERIFICATION_CODE_USED',
  'ISSUE_CREATION_FAILED',
  'PHOTO_UPLOAD_FAILED'
] as const

export type IssueErrorCode = typeof ISSUE_ERROR_CODES[number]

/**
 * Issue error response schema
 */
export const IssueErrorResponseSchema = ErrorResponseSchema.extend({
  error: z.object({
    code: z.enum(ISSUE_ERROR_CODES),
    message: z.string(),
    details: z.any().optional()
  })
})

export type IssueErrorResponse = z.infer<typeof IssueErrorResponseSchema>

// ============================================================================
// Schema Re-exports
// ============================================================================

export default {
  // Values
  ISSUE_TYPES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  ISSUE_ERROR_CODES,

  // Schemas
  PhotoUploadSchema,
  IssueLocationSchema,
  IssueReportSubmitSchema,
  IssueDataSchema,
  IssueReportResponseSchema,
  ErrorResponseSchema,
  IssueErrorResponseSchema
}
