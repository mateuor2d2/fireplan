import { ref, computed, readonly } from 'vue'
import type { IPlan } from '~/server/types/planes'
import type { QRCodeState } from '~/types/qr'

/**
 * QR List Item - Enhanced plan data with QR-specific computed properties
 */
export interface QRListItem extends IPlan {
  qrCodeState?: QRCodeState | null
  daysUntilExpiration?: number
  expiresAtDisplay?: string
}

/**
 * Composable for QR code list management
 * Provides reactive state management for listing and managing all user's QR codes
 */
export function useQRList() {
  const userStore = useUserStore()
  const toast = useToast()

  // Local state
  const loading = ref(false)
  const error = ref<string | null>(null)
  const plansWithQR = ref<QRListItem[]>([])

  /**
   * Get QR code state from plan data
   */
  function getQRCodeState(plan: IPlan): QRCodeState | null {
    if (!plan.qrCode) return null

    if (!plan.qrEnabled) {
      return 'disabled'
    }

    const now = new Date()
    const expiresAt = new Date(plan.qrCode.expiresAt)

    if (expiresAt < now) {
      return 'expired'
    }

    return 'active'
  }

  /**
   * Format expiration date for display (DD/MM/YYYY)
   */
  function formatExpirationDate(expiresAt: Date | string): string {
    const date = new Date(expiresAt)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  /**
   * Calculate days until expiration
   */
  function calculateDaysUntilExpiration(expiresAt: Date | string): number {
    const date = new Date(expiresAt)
    const now = new Date()
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * Enhance plan with QR-specific computed properties
   */
  function enhancePlanWithQRData(plan: IPlan): QRListItem {
    const qrCodeState = getQRCodeState(plan)
    const daysUntilExpiration = plan.qrCode ? calculateDaysUntilExpiration(plan.qrCode.expiresAt) : 0
    const expiresAtDisplay = plan.qrCode ? formatExpirationDate(plan.qrCode.expiresAt) : ''

    return {
      ...plan,
      qrCodeState,
      daysUntilExpiration,
      expiresAtDisplay
    }
  }

  /**
   * Load all user's plans and filter for those with QR codes
   */
  async function loadPlansWithQR() {
    loading.value = true
    error.value = null

    try {
      if (!userStore.user?._id) {
        throw new Error('Usuario no autenticado')
      }

      // Fetch all user's plans
      const response = await $fetch<any>('/api/planes', {
        method: 'GET',
        params: {
          userId: userStore.user._id.toString(),
          $limit: '1000' // Get all plans to filter for QR codes
        }
      })

      // Filter plans that have QR codes
      const plans = (response.data || response) as IPlan[]
      const plansWithQRCode = plans.filter(plan => plan.qrCode)

      // Enhance each plan with QR-specific data
      plansWithQR.value = plansWithQRCode
        .map(enhancePlanWithQRData)
        // Sort by updatedAt descending (newest first)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch (err: any) {
      const message = err?.message || err?.data?.message || 'Error al cargar los códigos QR'
      error.value = message
      console.error('Error loading QR codes:', err)

      toast.add({
        title: 'Error',
        description: message,
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle'
      })
    } finally {
      loading.value = false
    }
  }

  /**
   * Regenerate QR code with new access token
   */
  async function regenerateQR(planId: string): Promise<boolean> {
    try {
      await $fetch(`/api/planes/${planId}/regenerate-qr`, {
        method: 'POST'
      })

      toast.add({
        title: 'Código QR regenerado',
        description: 'El código QR se ha regenerado correctamente con un nuevo token de acceso',
        color: 'green',
        icon: 'i-heroicons-check-circle'
      })

      // Reload the list
      await loadPlansWithQR()
      return true
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Error al regenerar el código QR'

      toast.add({
        title: 'Error',
        description: message,
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle'
      })
      return false
    }
  }

  /**
   * Toggle QR code enabled/disabled state
   */
  async function toggleQR(planId: string, enabled: boolean): Promise<boolean> {
    try {
      await $fetch(`/api/planes/${planId}/toggle-qr`, {
        method: 'POST',
        body: { enabled }
      })

      toast.add({
        title: enabled ? 'QR habilitado' : 'QR deshabilitado',
        description: enabled
          ? 'El código QR se ha habilitado correctamente'
          : 'El código QR se ha deshabilitado correctamente',
        color: 'green',
        icon: 'i-heroicons-check-circle'
      })

      // Reload the list
      await loadPlansWithQR()
      return true
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Error al actualizar el código QR'

      toast.add({
        title: 'Error',
        description: message,
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle'
      })
      return false
    }
  }

  /**
   * Generate QR code for a plan that doesn't have one
   */
  async function generateQR(planId: string, expirationDays?: number): Promise<boolean> {
    try {
      // Get user's QR settings
      const qrSettings = await userStore.getQRSettings()

      await $fetch(`/api/planes/${planId}/generate-qr`, {
        method: 'POST',
        body: {
          expirationDays: expirationDays ?? qrSettings.expirationDays,
          baseUrl: qrSettings.baseUrl
        }
      })

      toast.add({
        title: 'Código QR generado',
        description: 'El código QR se ha generado correctamente',
        color: 'green',
        icon: 'i-heroicons-check-circle'
      })

      // Reload the list
      await loadPlansWithQR()
      return true
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Error al generar el código QR'

      toast.add({
        title: 'Error',
        description: message,
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle'
      })
      return false
    }
  }

  // Computed properties for statistics
  const hasQRCodes = computed(() => plansWithQR.value.length > 0)

  const totalCount = computed(() => plansWithQR.value.length)

  const activeCount = computed(() =>
    plansWithQR.value.filter((plan) => {
      if (!plan.qrEnabled || !plan.qrCode) return false
      const now = new Date()
      const expiresAt = new Date(plan.qrCode.expiresAt)
      return expiresAt > now
    }).length
  )

  const expiredCount = computed(() =>
    plansWithQR.value.filter((plan) => {
      if (!plan.qrCode) return false
      const now = new Date()
      const expiresAt = new Date(plan.qrCode.expiresAt)
      return expiresAt <= now
    }).length
  )

  const disabledCount = computed(() =>
    plansWithQR.value.filter(plan => !plan.qrEnabled).length
  )

  // Auto-load on mount (can be disabled with parameter)
  async function init(autoLoad = true) {
    if (autoLoad) {
      await loadPlansWithQR()
    }
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    plansWithQR: readonly(plansWithQR),

    // Computed statistics
    hasQRCodes,
    totalCount,
    activeCount,
    expiredCount,
    disabledCount,

    // Methods
    loadPlansWithQR,
    regenerateQR,
    toggleQR,
    generateQR,
    init,
    getQRCodeState,
    formatExpirationDate
  }
}
