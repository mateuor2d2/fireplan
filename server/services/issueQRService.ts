// ============================================================================
// Issue QR Code Service
// ============================================================================
// Service for generating and managing QR codes for issue reporting
//
// This service handles:
// - QR code generation for issue reporting (separate from plan QR codes)
// - Validation of issue reporting QR access
// - Management of issue QR code lifecycle
//
// ============================================================================

import { v4 as uuidv4 } from 'uuid'
import { generatePublicQRCode, generateIssueQRCode as generateIssueQRImage } from '../utils/qr-generator'
import { generateSlug, generateUniqueSlug } from '../utils/slug-generator'
import { Plan } from '../models/Plan'
import type { Planes } from '../models/Planes'

// ============================================================================
// Types
// ============================================================================

/**
 * Result of generating an issue QR code
 */
export interface IssueQRGenerateResult {
  success: boolean
  slug?: string
  accessToken?: string
  publicUrl?: string
  expiresAt?: Date
  qrCodeImage?: string
  error?: string
}

/**
 * Result of validating issue QR access
 */
export interface IssueQRValidationResult {
  valid: boolean
  reason?: 'not_found' | 'disabled' | 'invalid_token' | 'expired'
  plan?: any
}

/**
 * Options for generating an issue QR code
 */
export interface IssueQROptions {
  planId: string
  userId: string
  slug?: string
  expirationDays?: number
  baseUrl?: string
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default expiration days for issue QR codes (90 days)
 */
export const DEFAULT_ISSUE_EXPIRATION_DAYS = 90

/**
 * Allowed expiration periods for issue QR codes
 */
export const ISSUE_EXPIRATION_DAYS_OPTIONS = [30, 90, 180, 360] as const

// ============================================================================
// Issue QR Service
// ============================================================================

/**
 * Generate a QR code for issue reporting
 * @param options - Generation options
 * @param Plan - Plan model
 * @returns QR code generation result
 */
export async function generateIssueQRCode(
  options: IssueQROptions,
  Planes: typeof Planes
): Promise<IssueQRGenerateResult> {
  const { planId, userId, slug: customSlug, expirationDays, baseUrl } = options

  // Validate inputs
  if (!planId || typeof planId !== 'string') {
    return {
      success: false,
      error: 'ID de plan válido es requerido'
    }
  }

  if (!userId || typeof userId !== 'string') {
    return {
      success: false,
      error: 'ID de usuario válido es requerido'
    }
  }

  // Fetch plan
  let plan: any
  try {
    plan = await Planes.findById(planId)
  } catch (error) {
    return {
      success: false,
      error: 'Error al buscar el plan. Por favor, intenta de nuevo.'
    }
  }

  if (!plan) {
    return {
      success: false,
      error: 'Plan no encontrado'
    }
  }

  // Check ownership
  if (plan.createdBy?.toString() !== userId) {
    return {
      success: false,
      error: 'Acceso denegado'
    }
  }

  // Check if issue QR already exists
  if (plan.issueQrCode) {
    return {
      success: false,
      error: 'El código QR de reporte ya existe para este plan. Usa regenerar en su lugar.'
    }
  }

  // Determine base URL
  let finalBaseUrl = baseUrl || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  try {
    const url = new URL(finalBaseUrl)
    finalBaseUrl = url.origin
  } catch {
    console.warn(`Base URL inválida "${finalBaseUrl}", usando fallback`)
    finalBaseUrl = 'http://localhost:3000'
  }

  // Determine expiration days
  const finalExpirationDays = expirationDays || DEFAULT_ISSUE_EXPIRATION_DAYS

  // Validate expiration days
  if (!ISSUE_EXPIRATION_DAYS_OPTIONS.includes(finalExpirationDays as any)) {
    return {
      success: false,
      error: `Días de expiración inválidos. Debe ser uno de: ${ISSUE_EXPIRATION_DAYS_OPTIONS.join(', ')}`
    }
  }

  // Generate slug
  let slug: string
  try {
    if (customSlug) {
      const truncatedSlug = customSlug.slice(0, 50)
      const slugResult = await generateUniqueSlug(truncatedSlug, async (testSlug) => {
        const existing = await Planes.findOne({
          '_id': { $ne: planId },
          'issueQrCode.slug': testSlug
        })
        return !!existing
      })
      slug = slugResult.slug
    } else {
      // Generate short UUID-based slug for QR codes (much shorter than plan name)
      const { v4: uuidv4 } = await import('uuid')
      slug = uuidv4().substring(0, 8).toLowerCase() // 8-character short slug
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error al generar slug único para el código QR. Por favor, intenta de nuevo.'
    }
  }

  // Generate access token
  const accessToken = uuidv4()

  // Calculate expiration
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + finalExpirationDays)

  // Generate QR code image
  const qrResult = await generateIssueQRImage(finalBaseUrl, planId, slug, accessToken)

  // Generate public URL for issue reporting
  const publicUrl = `${finalBaseUrl}/public/issues/${slug}/${accessToken}`

  // Create issue QR code document
  const issueQrCode = {
    planId: plan._id,
    slug,
    accessToken,
    expiresAt,
    qrCodeImage: qrResult.dataUrl,
    publicUrl,
    enabled: true,
    createdAt: now,
    updatedAt: now
  }

  // Update plan with issue QR code
  const updateResult = await Planes.findByIdAndUpdate(planId, {
    $set: {
      issueQrCode,
      issueQrEnabled: true
    }
  })

  if (!updateResult) {
    return {
      success: false,
      error: 'Error al actualizar el plan con el código QR'
    }
  }

  return {
    success: true,
    slug,
    accessToken,
    publicUrl,
    expiresAt,
    qrCodeImage: qrResult.dataUrl
  }
}

/**
 * Regenerate an issue QR code (new access token)
 * @param planId - Plan ID
 * @param userId - User ID (for ownership check)
 * @param Plan - Plan model
 * @returns New QR code data
 */
export async function regenerateIssueQRCode(
  planId: string,
  userId: string,
  Planes: typeof Planes
): Promise<IssueQRGenerateResult> {
  // Validate inputs
  if (!planId || typeof planId !== 'string') {
    return {
      success: false,
      error: 'ID de plan válido es requerido'
    }
  }

  if (!userId || typeof userId !== 'string') {
    return {
      success: false,
      error: 'ID de usuario válido es requerido'
    }
  }

  // Fetch plan
  let plan: any
  try {
    plan = await Planes.findById(planId)
  } catch (error) {
    return {
      success: false,
      error: 'Error al buscar el plan. Por favor, intenta de nuevo.'
    }
  }

  if (!plan) {
    return {
      success: false,
      error: 'Plan no encontrado'
    }
  }

  // Check ownership
  if (plan.createdBy?.toString() !== userId) {
    return {
      success: false,
      error: 'Acceso denegado'
    }
  }

  // Check if issue QR exists
  if (!plan.issueQrCode) {
    return {
      success: false,
      error: 'El código QR de reporte no existe. Usa generar en su lugar.'
    }
  }

  // Determine base URL
  let baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  try {
    const url = new URL(baseUrl)
    baseUrl = url.origin
  } catch {
    baseUrl = 'http://localhost:3000'
  }

  // Generate new access token
  const accessToken = uuidv4()

  // Calculate new expiration (default 90 days)
  const expirationDays = DEFAULT_ISSUE_EXPIRATION_DAYS
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + expirationDays)

  // Regenerate QR code image
  const qrResult = await generateIssueQRImage(baseUrl, planId, plan.issueQrCode.slug, accessToken)

  // Generate public URL
  const publicUrl = `${baseUrl}/public/issues/${plan.issueQrCode.slug}/${accessToken}`

  // Update issue QR code document
  const updatedIssueQrCode = {
    ...plan.issueQrCode,
    accessToken,
    expiresAt,
    qrCodeImage: qrResult.dataUrl,
    publicUrl,
    updatedAt: now
  }

  // Update plan
  await Planes.findByIdAndUpdate(planId, {
    $set: {
      issueQrCode: updatedIssueQrCode
    }
  })

  return {
    success: true,
    slug: plan.issueQrCode.slug,
    accessToken,
    publicUrl,
    expiresAt,
    qrCodeImage: qrResult.dataUrl
  }
}

/**
 * Validate public access via issue QR code
 * @param planId - Plan ID
 * @param slug - QR code slug
 * @param accessToken - Access token from URL
 * @param Plan - Plan model
 * @returns Validation result with plan if valid
 */
export async function validateIssueQRAccess(
  planId: string,
  slug: string,
  accessToken: string,
  Planes: typeof Planes
): Promise<IssueQRValidationResult> {
  // Validate inputs
  if (!planId || !slug || !accessToken) {
    return {
      valid: false,
      reason: 'invalid_token'
    }
  }

  // Fetch plan with issue QR code
  const plan = await Planes.findById(planId)

  if (!plan) {
    return {
      valid: false,
      reason: 'not_found'
    }
  }

  // Check if issue QR is enabled
  if (!plan.issueQrCode || !plan.issueQrEnabled) {
    return {
      valid: false,
      reason: 'disabled'
    }
  }

  // Verify slug matches
  if (plan.issueQrCode.slug !== slug) {
    return {
      valid: false,
      reason: 'invalid_token'
    }
  }

  // Verify access token matches
  if (plan.issueQrCode.accessToken !== accessToken) {
    return {
      valid: false,
      reason: 'invalid_token'
    }
  }

  // Check expiration
  const now = new Date()
  if (plan.issueQrCode.expiresAt < now) {
    return {
      valid: false,
      reason: 'expired'
    }
  }

  // All validations passed
  return {
    valid: true,
    plan
  }
}

/**
 * Toggle issue QR code enabled status
 * @param planId - Plan ID
 * @param userId - User ID (for ownership check)
 * @param enabled - New enabled state
 * @param Plan - Plan model
 * @returns Updated plan
 */
export async function toggleIssueQR(
  planId: string,
  userId: string,
  enabled: boolean,
  Planes: typeof Planes
): Promise<{ success: boolean, plan?: any, error?: string }> {
  // Validate inputs
  if (!planId || typeof planId !== 'string') {
    return {
      success: false,
      error: 'ID de plan válido es requerido'
    }
  }

  if (!userId || typeof userId !== 'string') {
    return {
      success: false,
      error: 'ID de usuario válido es requerido'
    }
  }

  // Fetch plan
  let plan: any
  try {
    plan = await Planes.findById(planId)
  } catch (error) {
    return {
      success: false,
      error: 'Error al buscar el plan'
    }
  }

  if (!plan) {
    return {
      success: false,
      error: 'Plan no encontrado'
    }
  }

  // Check ownership
  if (plan.createdBy?.toString() !== userId) {
    return {
      success: false,
      error: 'Acceso denegado'
    }
  }

  // Update issueQrEnabled
  const updatedPlan = await Planes.findByIdAndUpdate(planId, {
    $set: {
      issueQrEnabled: enabled
    }
  }, { new: true })

  if (!updatedPlan) {
    return {
      success: false,
      error: 'Error al actualizar el plan'
    }
  }

  return {
    success: true,
    plan: updatedPlan
  }
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  generateIssueQRCode,
  regenerateIssueQRCode,
  validateIssueQRAccess,
  toggleIssueQR
}
