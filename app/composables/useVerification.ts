// ============================================================================
// useVerification Composable
// ============================================================================
// Composable for handling verification code generation, validation, and
// resend countdown logic for Vue components.
//
// This composable provides:
// - Reactive state for loading, errors, verification status
// - sendCode() - calls /api/verification/generate endpoint
// - validateCode() - calls /api/verification/validate endpoint
// - 60-second resend countdown with automatic re-enable
// - All error messages in Spanish
// - reset() method to clear state
//
// ============================================================================

import type { ValidateResult } from '~/server/services/verificationService'

// ============================================================================
// Types
// ============================================================================

/**
 * Options for verification code generation
 */
export interface VerificationOptions {
  obraId: string
  email?: string
  phone?: string
  method: 'email' | 'sms' | 'both'
}

/**
 * Response from the verification generate endpoint
 */
export interface VerificationResponse {
  success: boolean
  data: {
    message: string
    method: string
    expiresAt: string
  }
}

// ============================================================================
// Composable
// ============================================================================

/**
 * Composable for verification code management
 *
 * @example
 * ```vue
 * const {
 *   sending,
 *   verifying,
 *   canResend,
 *   resendCountdown,
 *   error,
 *   verified,
 *   sendCode,
 *   validateCode,
 *   reset
 * } = useVerification()
 *
 * // Send verification code
 * await sendCode({
 *   obraId: '123',
 *   email: 'user@example.com',
 *   method: 'email'
 * })
 *
 * // Validate code
 * const result = await validateCode('123456', '123')
 * ```
 */
export const useVerification = () => {
  // Reactive state
  const verifying = ref(false)
  const sending = ref(false)
  const canResend = ref(true)
  const resendCountdown = ref(0)
  const lastSentAt = ref<Date | null>(null)
  const error = ref<string | null>(null)
  const verified = ref(false)

  /**
   * Send verification code via email/SMS
   * @param options - Verification options (obraId, email, phone, method)
   * @returns Verification response with message, method, and expiration
   */
  const sendCode = async (
    options: VerificationOptions
  ): Promise<VerificationResponse> => {
    sending.value = true
    error.value = null

    try {
      const response = await $fetch<VerificationResponse>('/api/verification/generate', {
        method: 'POST',
        body: options
      })

      // Update state after successful send
      lastSentAt.value = new Date()
      startResendCountdown()

      return response
    } catch (err: any) {
      const message
        = err.data?.message
          || err.message
          || 'Error al enviar código de verificación'
      error.value = message

      return {
        success: false,
        data: {
          message,
          method: options.method,
          expiresAt: ''
        }
      }
    } finally {
      sending.value = false
    }
  }

  /**
   * Validate verification code
   * @param code - 6-digit verification code
   * @param obraId - Associated work/plan ID
   * @returns Validation result with verified status
   */
  const validateCode = async (
    code: string,
    obraId: string
  ): Promise<ValidateResult> => {
    verifying.value = true
    error.value = null

    try {
      const result = await $fetch<ValidateResult>('/api/verification/validate', {
        method: 'POST',
        body: { code, obraId }
      })

      if (result.verified) {
        verified.value = true
      }

      return result
    } catch (err: any) {
      const message
        = err.data?.message
          || err.message
          || 'Error al validar código'
      error.value = message

      return {
        success: false,
        verified: false,
        error: message
      }
    } finally {
      verifying.value = false
    }
  }

  /**
   * Start resend countdown timer (60 seconds)
   * Prevents spam of verification code requests
   */
  const startResendCountdown = (): void => {
    canResend.value = false
    resendCountdown.value = 60

    const interval = setInterval(() => {
      resendCountdown.value--

      if (resendCountdown.value <= 0) {
        clearInterval(interval)
        canResend.value = true
      }
    }, 1000)
  }

  /**
   * Reset verification state
   * Clears all reactive state to initial values
   */
  const reset = (): void => {
    verifying.value = false
    sending.value = false
    canResend.value = true
    resendCountdown.value = 0
    lastSentAt.value = null
    error.value = null
    verified.value = false
  }

  return {
    // State
    verifying,
    sending,
    canResend,
    resendCountdown,
    lastSentAt,
    error,
    verified,

    // Methods
    sendCode,
    validateCode,
    reset
  }
}

// Make it available for auto-import
export default useVerification
