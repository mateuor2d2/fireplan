import { ref, computed, readonly } from 'vue'
import { usePlanesStore } from '~/stores/planes'
import type { QRCodeDisplay, QRSettings, ExpirationDays } from '~/types/qr'

/**
 * Composable for QR code operations
 * Provides reactive state management for QR code generation and status
 */
export function useQRCode() {
  const planesStore = usePlanesStore()

  // Local state for operations
  const isGenerating = ref(false)
  const isRegenerating = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Computed state from store
  const qrCode = computed(() => planesStore.planActual?.qrCode ?? null)
  const qrEnabled = computed(() => planesStore.planActual?.qrEnabled ?? true)
  const hasQRCode = computed(() => Boolean(qrCode.value))

  // QR code state computed
  const qrCodeState = computed<'active' | 'disabled' | 'expired' | null>(() => {
    if (!qrCode.value) return null
    return planesStore.getQRCodeState() ?? null
  })

  // Computed helpers
  const isQRActive = computed(() => qrCodeState.value === 'active')
  const isQRDisabled = computed(() => qrCodeState.value === 'disabled')
  const isQRExpired = computed(() => qrCodeState.value === 'expired')

  // Days until expiration
  const daysUntilExpiration = computed(() => {
    if (!qrCode.value) return null
    const expiresAt = new Date(qrCode.value.expiresAt)
    const now = new Date()
    return Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  })

  // Expiration date display (DD/MM/YYYY)
  const expiresAtDisplay = computed(() => {
    if (!qrCode.value) return null
    const expiresAt = new Date(qrCode.value.expiresAt)
    const day = String(expiresAt.getDate()).padStart(2, '0')
    const month = String(expiresAt.getMonth() + 1).padStart(2, '0')
    const year = expiresAt.getFullYear()
    return `${day}/${month}/${year}`
  })

  // Public URL
  const publicUrl = computed(() => {
    if (!qrCode.value) return null
    return qrCode.value.publicUrl || `/public/planes/${planesStore.planActual?._id}/${qrCode.value.slug}`
  })

  /**
   * Clear messages
   */
  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  /**
   * Generate QR code for the current plan
   */
  async function generateQRCode(options?: {
    expirationDays?: ExpirationDays
    baseUrl?: string
  }): Promise<QRCodeDisplay | null> {
    try {
      isGenerating.value = true
      clearMessages()

      const result = await planesStore.generateQRCode(options)

      if (result) {
        successMessage.value = 'Código QR generado correctamente'

        // Return formatted QR display data
        return {
          slug: result.slug,
          publicUrl: result.publicUrl,
          expiresAt: new Date(result.expiresAt),
          expiresAtDisplay: expiresAtDisplay.value || '',
          qrCodeImage: result.qrCodeImage,
          enabled: result.enabled ?? true,
          daysUntilExpiration: daysUntilExpiration.value || 0,
          state: qrCodeState.value || 'active'
        }
      }

      return null
    } catch (err: any) {
      const message = err?.message || err?.data?.message || 'Error al generar el código QR'
      error.value = message
      return null
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Regenerate QR code with new access token
   */
  async function regenerateQRCode(): Promise<QRCodeDisplay | null> {
    try {
      isRegenerating.value = true
      clearMessages()

      const result = await planesStore.regenerateQRCode()

      if (result) {
        successMessage.value = 'Código QR regenerado correctamente'

        // Return formatted QR display data
        return {
          slug: result.slug,
          publicUrl: result.publicUrl,
          expiresAt: new Date(result.expiresAt),
          expiresAtDisplay: expiresAtDisplay.value || '',
          qrCodeImage: result.qrCodeImage,
          enabled: result.enabled ?? true,
          daysUntilExpiration: daysUntilExpiration.value || 0,
          state: qrCodeState.value || 'active'
        }
      }

      return null
    } catch (err: any) {
      const message = err?.message || err?.data?.message || 'Error al regenerar el código QR'
      error.value = message
      return null
    } finally {
      isRegenerating.value = false
    }
  }

  /**
   * Check if plan has an active QR code
   */
  function hasActiveQRCode(): boolean {
    return planesStore.hasActiveQRCode()
  }

  /**
   * Get QR code display data
   */
  function getQRCodeDisplay(): QRCodeDisplay | null {
    if (!qrCode.value) return null

    return {
      slug: qrCode.value.slug,
      publicUrl: publicUrl.value || '',
      expiresAt: new Date(qrCode.value.expiresAt),
      expiresAtDisplay: expiresAtDisplay.value || '',
      qrCodeImage: qrCode.value.qrCodeImage,
      enabled: qrCode.value.enabled ?? true,
      daysUntilExpiration: daysUntilExpiration.value || 0,
      state: qrCodeState.value || 'active'
    }
  }

  return {
    // State
    isGenerating: readonly(isGenerating),
    isRegenerating: readonly(isRegenerating),
    error: readonly(error),
    successMessage: readonly(successMessage),

    // Computed
    qrCode,
    qrEnabled,
    hasQRCode,
    qrCodeState,
    isQRActive,
    isQRDisabled,
    isQRExpired,
    daysUntilExpiration,
    expiresAtDisplay,
    publicUrl,

    // Methods
    generateQRCode,
    regenerateQRCode,
    hasActiveQRCode,
    getQRCodeDisplay,
    clearMessages
  }
}
