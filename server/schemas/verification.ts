// ============================================================================
// Verification Code Validation Schemas
// ============================================================================
// Zod schemas for verification code validation in API endpoints
//
// Provides runtime validation for verification code generation and validation
// with proper error messages in Spanish for better UX.
//
// ============================================================================

import { z } from 'zod'

// ============================================================================
// Constants
// ============================================================================

/**
 * Regular expression for validating MongoDB ObjectId format (24-character hex string)
 */
const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/

/**
 * Regular expression for 6-digit verification codes
 */
const CODE_REGEX = /^[0-9]{6}$/

/**
 * Regular expression for international phone numbers
 * Accepts formats like: +3461234567890, +1-415-555-0269, +34 612 345 678
 * Allows spaces, hyphens, and parentheses which will be normalized
 */
const PHONE_REGEX = /^\+?[\d\s\-\(\)]{6,20}$/

/**
 * Regular expression for IPv4 or IPv6 addresses
 */
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]{1,4}:[0-9a-f:]{1,4}:[0-9a-f:]{1,4}/i

/**
 * Default code expiration time in minutes (15 minutes)
 */
const DEFAULT_EXPIRATION_MINUTES = 15

// ============================================================================
// Verification Code Schemas
// ============================================================================

/**
 * Schema for creating a new verification code
 * At least one contact method (email or phone) is required
 */
export const VerificationCodeCreateSchema = z.object({
  email: z
    .string({ required: false })
    .email('Formato de email inválido')
    .optional(),
  phone: z
    .string({ required: false })
    .transform(val => val ? val.replace(/[\s\-\(\)]/g, '') : val)
    .pipe(z.string().regex(PHONE_REGEX, 'Formato de teléfono inválido (ej: +3461234567890)'))
    .optional(),
  method: z
    .enum(['email', 'sms', 'both'], {
      errorMap: {
        invalid_type: 'Método debe ser email, sms o both'
      }
    })
    .default('email'),
  obraId: z
    .string()
    .regex(OBJECT_ID_REGEX, 'El ID de obra debe tener 24 caracteres hexadecimales'),
  ipAddress: z
    .string({ required: false })
    .regex(IP_REGEX, 'Formato de IP inválido')
    .optional()
}).strict().refine(
  data => data.email || data.phone,
  {
    message: 'Debe proporcionar al menos un método de contacto (email o teléfono)'
  }
)

/**
 * Schema for validating a verification code during issue submission
 */
export const VerificationCodeValidateSchema = z.object({
  code: z
    .string()
    .regex(CODE_REGEX, 'El código debe ser exactamente 6 dígitos numéricos'),
  obraId: z
    .string()
    .regex(OBJECT_ID_REGEX, 'El ID de obra debe tener 24 caracteres hexadecimales')
}).strict()

// ============================================================================
// Type Inference
// ============================================================================

/**
 * Type for creating a verification code (from schema)
 */
export type VerificationCodeCreate = z.infer<typeof VerificationCodeCreateSchema>

/**
 * Type for validating a verification code (from schema)
 */
export type VerificationCodeValidate = z.infer<typeof VerificationCodeValidateSchema>

// ============================================================================
// Export Default
// ============================================================================

export default {
  VerificationCodeCreateSchema,
  VerificationCodeValidateSchema
}
