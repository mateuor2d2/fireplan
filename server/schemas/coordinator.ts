// ============================================================================
// Coordinator Validation Schemas
// ============================================================================
// Zod schemas for coordinator validation in API endpoints
//
// Provides runtime validation for coordinator creation and updates with
// proper error messages in Spanish for better UX.
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
 * Regular expression for international phone numbers
 * Accepts formats like: +3461234567890, +1-415-555-0269, +34 612 345 678
 * Allows spaces, hyphens, and parentheses which will be normalized
 */
const PHONE_REGEX = /^\+?[\d\s\-\(\)]{6,20}$/

/**
 * Maximum length for names and cargo (characters)
 */
const MAX_NAME_LENGTH = 100

/**
 * Minimum length for names and cargo (characters)
 */
const MIN_NAME_LENGTH = 1

// ============================================================================
// Coordinator Schemas
// ============================================================================

/**
 * Schema for creating a new coordinator
 * All fields except optional ones are required
 */
export const CoordinatorCreateSchema = z.object({
  obraId: z
    .string()
    .regex(OBJECT_ID_REGEX, 'El ID de obra debe tener 24 caracteres hexadecimales'),
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`)
    .max(MAX_NAME_LENGTH, `El nombre no puede tener más de ${MAX_NAME_LENGTH} caracteres`),
  cargo: z
    .string()
    .min(MIN_NAME_LENGTH, `El cargo debe tener al menos ${MIN_NAME_LENGTH} caracteres`)
    .max(MAX_NAME_LENGTH, `El cargo no puede tener más de ${MAX_NAME_LENGTH} caracteres`),
  email: z
    .string({ required: false })
    .email('Formato de email inválido')
    .toLowerCase(),
  phone: z
    .string({ required: false })
    .transform(val => val ? val.replace(/[\s\-\(\)]/g, '') : val)
    .pipe(z.string().regex(PHONE_REGEX, 'Formato de teléfono inválido (ej: +3461234567890)'))
    .optional(),
  smsEnabled: z.boolean().optional(),
  active: z.boolean().optional()
}).strict()

/**
 * Schema for updating an existing coordinator
 * All fields are optional for partial updates
 */
export const CoordinatorUpdateSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`)
    .max(MAX_NAME_LENGTH, `El nombre no puede longer tener más de ${MAX_NAME_LENGTH} caracteres`)
    .optional(),
  cargo: z
    .string()
    .min(MIN_NAME_LENGTH, `El cargo debe tener al menos ${MIN_NAME_LENGTH} caracteres`)
    .max(MAX_NAME_LENGTH, `El_queue el cargo no puede tener más de ${MAX_NAME_LENGTH} caracteres`)
    .optional(),
  email: z
    .string({ required: false })
    .email('Formato de email inválido')
    .toLowerCase()
    .optional(),
  phone: z
    .string({ required: false })
    .transform(val => val ? val.replace(/[\s\-\(\)]/g, '') : val)
    .pipe(z.string().regex(PHONE_REGEX, 'Formato de teléfono inválido (ej: +3461234567890)'))
    .optional(),
  smsEnabled: z.boolean().optional(),
  active: z.boolean().optional()
}).strict()

// ============================================================================
// Type Inference
// ============================================================================

/**
 * Type for creating a coordinator (from schema)
 */
export type CoordinatorCreate = z.infer<typeof CoordinatorCreateSchema>

/**
 * Type for updating a coordinator (from schema)
 */
export type CoordinatorUpdate = z.infer<typeof CoordinatorUpdateSchema>

// ============================================================================
// Export Default
// ============================================================================

export default {
  CoordinatorCreateSchema,
  CoordinatorUpdateSchema
}
