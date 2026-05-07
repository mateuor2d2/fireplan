// ============================================================================
// QR Code Service
// ============================================================================
// Business logic for QR code generation, validation, and settings management

import { v4 as uuidv4 } from 'uuid'
import { generatePublicQRCode } from '../utils/qr-generator'
import { generateSlug, generateUniqueSlug } from '../utils/slug-generator'
import type {
  IQRService,
  QRGenerateServerOptions,
  QRGenerateResult,
  QRPublicAccessValidation,
  UserQRSettingsDocument
} from '../types/qr'
import type Plan from '../models/Plan'
import type User from '../models/User'

// ============================================================================
// Types
// ============================================================================

/**
 * Service dependencies injection
 */
interface ServiceDependencies {
  Plan: typeof Plan
  User: typeof User
}

// ============================================================================
// Default Expiration Options
// ============================================================================

/**
 * Default expiration days for QR codes
 */
export const DEFAULT_EXPIRATION_DAYS = 30

/**
 * Allowed expiration periods in days
 */
export const EXPIRATION_DAYS_OPTIONS = [30, 90, 180, 360, 720, 1080, 1440] as const

// ============================================================================
// QR Service Implementation
// ============================================================================

/**
 * QR Service class
 * Implements IQRService interface for QR code operations
 */
class QRService implements IQRService {
  private Plan: typeof Plan
  private User: typeof User

  constructor(dependencies: ServiceDependencies) {
    this.Plan = dependencies.Plan
    this.User = dependencies.User
  }

  /**
   * Generate a QR code for a plan
   *
   * @param options - QR generation options
   * @returns QR code data with public URL and base64 image
   */
  async generateForPlan(
    options: QRGenerateServerOptions
  ): Promise<QRGenerateResult> {
    const { planId, userId, slug: customSlug, expirationDays, baseUrl } = options

    // Validate inputs
    if (!planId || typeof planId !== 'string') {
      throw new Error('Valid plan ID is required')
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required')
    }

    // Fetch plan with error handling for deleted plans
    let plan: any
    try {
      plan = await this.Plan.findById(planId)
    } catch (error) {
      throw new Error('Failed to fetch plan. Please try again later.')
    }

    if (!plan) {
      throw new Error('Plan not found or has been deleted')
    }

    // Check ownership (Plan uses createdBy, not userId)
    if (plan.createdBy?.toString() !== userId) {
      throw new Error('Plan access denied')
    }

    // Check if QR already exists
    if (plan.qrCode) {
      throw new Error('QR code already exists for this plan. Use regenerate instead.')
    }

    // Get user settings or use defaults
    let user: any
    try {
      user = await this.User.findById(userId)
    } catch (error) {
      console.warn('Failed to fetch user for QR settings, using defaults')
    }
    const userSettings = user?.qrSettings

    // Determine base URL with fallback chain
    let finalBaseUrl = baseUrl || userSettings?.baseUrl || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Validate and sanitize base URL
    try {
      const url = new URL(finalBaseUrl)
      // Remove trailing slash
      finalBaseUrl = url.origin
    } catch {
      console.warn(`Invalid base URL "${finalBaseUrl}", falling back to localhost`)
      finalBaseUrl = 'http://localhost:3000'
    }

    // Determine expiration days
    const finalExpirationDays
      = expirationDays || userSettings?.expirationDays || DEFAULT_EXPIRATION_DAYS

    // Validate expiration days
    if (!EXPIRATION_DAYS_OPTIONS.includes(finalExpirationDays as any)) {
      throw new Error(`Invalid expiration days. Must be one of: ${EXPIRATION_DAYS_OPTIONS.join(', ')}`)
    }

    // Generate slug from plan name or use custom
    let slug: string
    try {
      if (customSlug) {
        // Use custom slug if provided (truncate if needed)
        const truncatedSlug = customSlug.slice(0, 50)
        const slugResult = await generateUniqueSlug(truncatedSlug, async (testSlug) => {
          const existing = await this.Plan.findOne({
            '_id': { $ne: planId },
            'qrCode.slug': testSlug
          })
          return !!existing
        })
        slug = slugResult.slug
      } else {
        // Generate from plan name
        const planName = (plan.nom_obra || 'plan').slice(0, 50)
        const slugResult = await generateUniqueSlug(planName, async (testSlug) => {
          const existing = await this.Plan.findOne({
            '_id': { $ne: planId },
            'qrCode.slug': testSlug
          })
          return !!existing
        })
        slug = slugResult.slug
      }
    } catch (error) {
      throw new Error('Failed to generate unique slug for QR code. Please try again.')
    }

    // Generate access token (UUID)
    const accessToken = uuidv4()

    // Calculate expiration date
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + finalExpirationDays)

    // Generate QR code image (points to download endpoint)
    const qrResult = await generatePublicQRCode(finalBaseUrl, planId, slug)

    // Generate download URL (QR code will point to this for direct PDF download)
    const publicUrl = `${finalBaseUrl}/public/planes/${planId}/${slug}/download`

    // Create QR code document
    const qrCode = {
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

    // Update plan with QR code
    console.log('[QR SERVICE] Updating plan with QR code:', {
      planId,
      qrCodeSlug: slug,
      qrEnabled: true
    })
    const updateResult = await this.Plan.findByIdAndUpdate(planId, {
      $set: {
        qrCode,
        qrEnabled: true
      }
    })
    console.log('[QR SERVICE] Update result:', {
      success: !!updateResult,
      planId: updateResult?._id?.toString()
    })
    if (!updateResult) {
      throw new Error('Failed to update plan with QR code - plan not found')
    }

    return {
      slug,
      accessToken,
      publicUrl,
      expiresAt,
      qrCodeImage: qrResult.dataUrl,
      enabled: true,
      createdAt: now,
      updatedAt: now
    }
  }

  /**
   * Regenerate a QR code for a plan (new access token)
   *
   * @param planId - Plan ID
   * @param userId - User ID (for ownership check)
   * @returns New QR code data
   */
  async regenerateForPlan(planId: string, userId: string): Promise<QRGenerateResult> {
    // Validate inputs
    if (!planId || typeof planId !== 'string') {
      throw new Error('Valid plan ID is required')
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required')
    }

    // Fetch plan with error handling for deleted plans
    let plan: any
    try {
      plan = await this.Plan.findById(planId)
    } catch (error) {
      throw new Error('Failed to fetch plan. Please try again later.')
    }

    if (!plan) {
      throw new Error('Plan not found or has been deleted')
    }

    // Check ownership (Plan uses createdBy, not userId)
    if (plan.createdBy?.toString() !== userId) {
      throw new Error('Plan access denied')
    }

    // Check if QR exists
    if (!plan.qrCode) {
      throw new Error('QR code does not exist for this plan. Use generate instead.')
    }

    // Get user settings
    let user: any
    try {
      user = await this.User.findById(userId)
    } catch (error) {
      console.warn('Failed to fetch user for QR settings, using defaults')
    }
    const userSettings = user?.qrSettings

    // Determine base URL with fallback chain
    let baseUrl = userSettings?.baseUrl || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Validate and sanitize base URL
    try {
      const url = new URL(baseUrl)
      // Remove trailing slash
      baseUrl = url.origin
    } catch {
      console.warn(`Invalid base URL "${baseUrl}", falling back to localhost`)
      baseUrl = 'http://localhost:3000'
    }

    // Generate new access token
    const accessToken = uuidv4()

    // Calculate new expiration date based on settings
    const expirationDays = userSettings?.expirationDays || DEFAULT_EXPIRATION_DAYS
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    // Regenerate QR code image (points to download endpoint)
    const qrResult = await generatePublicQRCode(baseUrl, planId, plan.qrCode.slug)

    // Generate download URL (QR code will point to this for direct PDF download)
    const publicUrl = `${baseUrl}/public/planes/${planId}/${plan.qrCode.slug}/download`

    console.log('[QR REGENERATE SERVICE] Generated URL:', {
      planId,
      slug: plan.qrCode.slug,
      publicUrl,
      planIdInUrl: publicUrl.includes(planId)
    })

    // Update QR code document
    const updatedQRCode = {
      ...plan.qrCode,
      accessToken,
      expiresAt,
      qrCodeImage: qrResult.dataUrl,
      publicUrl,
      updatedAt: now
    }

    // Update plan
    await this.Plan.findByIdAndUpdate(planId, {
      $set: {
        qrCode: updatedQRCode
      }
    })

    return {
      slug: plan.qrCode.slug,
      accessToken,
      publicUrl,
      expiresAt,
      qrCodeImage: qrResult.dataUrl,
      enabled: plan.qrCode.enabled,
      createdAt: plan.qrCode.createdAt,
      updatedAt: now
    }
  }

  /**
   * Validate public access via QR code
   *
   * @param planId - Plan ID
   * @param slug - QR code slug
   * @param accessToken - Access token from URL
   * @returns Validation result with plan if valid
   */
  async validatePublicAccess(
    planId: string,
    slug: string,
    accessToken: string
  ): Promise<QRPublicAccessValidation> {
    // Validate inputs
    if (!planId || !slug || !accessToken) {
      return {
        valid: false,
        reason: 'invalid_token'
      }
    }

    // Fetch plan with QR code
    const plan = await this.Plan.findById(planId)

    if (!plan) {
      return {
        valid: false,
        reason: 'not_found'
      }
    }

    // Check if QR code exists
    if (!plan.qrCode || !plan.qrEnabled) {
      return {
        valid: false,
        reason: 'disabled'
      }
    }

    // Verify slug matches
    if (plan.qrCode.slug !== slug) {
      return {
        valid: false,
        reason: 'invalid_token'
      }
    }

    // Verify access token matches
    if (plan.qrCode.accessToken !== accessToken) {
      return {
        valid: false,
        reason: 'invalid_token'
      }
    }

    // Check expiration
    const now = new Date()
    if (plan.qrCode.expiresAt < now) {
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
   * Get user QR settings
   *
   * @param userId - User ID
   * @returns User QR settings or null if not set
   */
  async getUserSettings(userId: string): Promise<UserQRSettingsDocument | null> {
    // Validate input
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required')
    }

    // Fetch user
    const user = await this.User.findById(userId)

    if (!user) {
      throw new Error('User not found')
    }

    // Return QR settings if exist
    if (user.qrSettings) {
      return user.qrSettings
    }

    // Return default settings
    const defaultSettings: UserQRSettingsDocument = {
      userId: user._id,
      baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      autoGenerate: true,
      expirationDays: DEFAULT_EXPIRATION_DAYS,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return defaultSettings
  }

  /**
   * Update user QR settings
   *
   * @param userId - User ID
   * @param settings - Partial settings to update
   * @returns Updated user QR settings
   */
  async updateUserSettings(
    userId: string,
    settings: Partial<UserQRSettingsDocument>
  ): Promise<UserQRSettingsDocument> {
    // Validate input
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required')
    }

    // Validate expiration days if provided
    if (settings.expirationDays !== undefined) {
      if (!EXPIRATION_DAYS_OPTIONS.includes(settings.expirationDays as any)) {
        throw new Error(
          `Invalid expiration days. Must be one of: ${EXPIRATION_DAYS_OPTIONS.join(', ')}`
        )
      }
    }

    // Validate base URL if provided
    if (settings.baseUrl !== undefined) {
      try {
        new URL(settings.baseUrl)
      } catch {
        throw new Error('Invalid base URL format')
      }
    }

    // Fetch user
    const user = await this.User.findById(userId)

    if (!user) {
      throw new Error('User not found')
    }

    // Prepare update data
    const now = new Date()
    const updateData: Partial<UserQRSettingsDocument> = {
      ...settings,
      userId: user._id,
      updatedAt: now
    }

    // If creating new settings, add createdAt
    if (!user.qrSettings) {
      updateData.createdAt = now
    }

    // Update user
    await this.User.findByIdAndUpdate(userId, {
      $set: {
        qrSettings: updateData
      }
    })

    // Fetch and return updated user
    const updatedUser = await this.User.findById(userId)

    if (!updatedUser?.qrSettings) {
      throw new Error('Failed to update QR settings')
    }

    return updatedUser.qrSettings
  }
}

// ============================================================================
// Export Factory Function
// ============================================================================

/**
 * Create QR service instance with dependencies
 *
 * @param dependencies - Service dependencies (Plan and User models)
 * @returns QRService instance
 *
 * @example
 * ```typescript
 * import Plan from '~/server/models/Plan'
 * import User from '~/server/models/User'
 *
 * const qrService = createQRService({ Plan, User })
 * const result = await qrService.generateForPlan({ planId, userId })
 * ```
 */
export function createQRService(dependencies: ServiceDependencies): IQRService {
  return new QRService(dependencies)
}

// ============================================================================
// Export Default
// ============================================================================

export default QRService
