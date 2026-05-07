/**
 * usePaymentGuard Composable
 *
 * Manages payment flow for printing safety plans.
 *
 * Implements the pay-to-print model:
 * - Users can create and fill plans for free
 * - Payment is required only when generating/printing PDFs
 * - Triggers payment flow if no payment exists
 * - Returns user to print page after successful payment
 *
 * @example Basic usage in print button handler
 * ```typescript
 * const { requirePaymentOrTrigger } = usePaymentGuard()
 *
 * async function handlePrint(planId: string) {
 *   await requirePaymentOrTrigger(planId)
 *   // If we reach here, payment exists or flow was triggered
 *   await generatePdf()
 * }
 * ```
 *
 * @example Check payment status without triggering flow
 * ```typescript
 * const { hasPayment, paymentStatus, checkPayment } = usePaymentGuard()
 *
 * onMounted(async () => {
 *   hasPayment.value = await checkPayment(planId)
 * })
 * ```
 *
 * @example Show loading and error states
 * ```typescript
 * const { isLoading, error, checkPayment } = usePaymentGuard()
 *
 * async function checkStatus() {
 *   await checkPayment(planId)
 *   if (error.value) {
 *     // Show error to user
 *   }
 * }
 * ```
 */

export const usePaymentGuard = () => {
  const hasPayment = ref(false)
  const paymentStatus = ref<'none' | 'pending' | 'succeeded' | 'failed'>('none')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Check if payment exists for a plan
   *
   * @param planId - The plan ID to check payment status for
   * @returns Promise resolving to true if payment exists, false otherwise
   *
   * @remarks
   * Calls `/api/payments/status/${planId}` to get payment status.
   * Updates hasPayment and paymentStatus refs from API response.
   */
  const checkPayment = async (planId: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        hasPayment: boolean
        status: 'none' | 'pending' | 'succeeded' | 'failed'
        paymentId?: string
        amount?: number
        createdAt?: string
      }>(`/api/payments/status/${planId}`)

      // Update refs from API response
      hasPayment.value = response.hasPayment
      paymentStatus.value = response.status

      return response.hasPayment
    } catch (err: any) {
      console.error('Error checking payment:', err)

      // Handle specific error messages
      if (err.statusMessage) {
        error.value = err.statusMessage
      } else if (err.data?.message) {
        error.value = err.data.message
      } else {
        error.value = 'Error al verificar el estado del pago'
      }

      // Reset to default state on error
      hasPayment.value = false
      paymentStatus.value = 'none'

      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Require payment or trigger payment flow
   *
   * Checks if payment exists for the plan. If no payment exists,
   * redirects to the payment flow with a return URL.
   *
   * @param planId - The plan ID to check payment for
   * @param returnUrl - Optional URL to return to after payment (defaults to print page)
   *
   * @remarks
   * If payment exists, function returns normally and caller can proceed.
   * If no payment, navigates to `/payment` page and does not return.
   */
  const requirePaymentOrTrigger = async (planId: string, returnUrl?: string) => {
    const paid = await checkPayment(planId)

    if (!paid) {
      // Trigger payment flow
      const returnPath = returnUrl || `/protected/planes/${planId}/print`
      await navigateTo(`/payment?planId=${planId}&returnUrl=${encodeURIComponent(returnPath)}`)
    }
    // If paid, execution continues (caller can proceed with print)
  }

  /**
   * Reset payment status (useful for testing or manual state management)
   */
  const resetPaymentStatus = () => {
    hasPayment.value = false
    paymentStatus.value = 'none'
    error.value = null
  }

  /**
   * Refresh payment status from API
   *
   * @param planId - The plan ID to refresh payment status for
   *
   * @remarks
   * Useful for polling after payment completion or manual refresh.
   */
  const refreshPaymentStatus = async (planId: string) => {
    return await checkPayment(planId)
  }

  return {
    hasPayment,
    paymentStatus,
    isLoading,
    error,
    checkPayment,
    requirePaymentOrTrigger,
    resetPaymentStatus,
    refreshPaymentStatus
  }
}
