<template>
  <div class="container mx-auto px-4 py-8 max-w-5xl">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Mis Códigos QR
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Gestiona todos tus códigos QR de planes en un solo lugar
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex justify-center items-center py-20"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-12 h-12 animate-spin text-primary"
      />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex justify-center items-center py-20"
    >
      <UCard class="max-w-md w-full">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-8 h-8 text-red-500"
            />
            <h3 class="text-xl font-bold">
              Error
            </h3>
          </div>
        </template>

        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ error }}
        </p>

        <UButton
          icon="i-heroicons-arrow-path"
          variant="outline"
          @click="loadPlansWithQR"
        >
          Reintentar
        </UButton>
      </UCard>
    </div>

    <!-- QR Codes Content -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Info Alert -->
      <UAlert
        icon="i-heroicons-information-circle"
        color="blue"
        variant="soft"
        title="Acerca de los Códigos QR"
        description="Los códigos QR permiten el acceso público a tus planes mediante un enlace escaneable. Desde aquí puedes ver, regenerar, habilitar o deshabilitar todos tus códigos QR."
        class="mb-6"
      />

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Total QR Codes -->
        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UIcon
                name="i-heroicons-qrcode"
                class="w-6 h-6 text-blue-600 dark:text-blue-400"
              />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ totalCount }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Total QR
              </p>
            </div>
          </div>
        </UCard>

        <!-- Active QR Codes -->
        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UIcon
                name="i-heroicons-check-circle"
                class="w-6 h-6 text-green-600 dark:text-green-400"
              />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ activeCount }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Activos
              </p>
            </div>
          </div>
        </UCard>

        <!-- Expired QR Codes -->
        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <UIcon
                name="i-heroicons-clock"
                class="w-6 h-6 text-yellow-600 dark:text-yellow-400"
              />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ expiredCount }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Expirados
              </p>
            </div>
          </div>
        </UCard>

        <!-- Disabled QR Codes -->
        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <UIcon
                name="i-heroicons-x-circle"
                class="w-6 h-6 text-red-600 dark:text-red-400"
              />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ disabledCount }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Deshabilitados
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- QR Codes List -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-list-bullet"
                class="w-5 h-5 text-primary"
              />
              <h3 class="text-lg font-medium">
                Códigos QR de Mis Planes
              </h3>
            </div>
            <UButton
              icon="i-heroicons-arrow-path"
              variant="outline"
              size="sm"
              :loading="loading"
              @click="loadPlansWithQR"
            >
              Actualizar
            </UButton>
          </div>
        </template>

        <!-- Empty State -->
        <div
          v-if="!hasQRCodes"
          class="text-center py-12"
        >
          <UIcon
            name="i-heroicons-qrcode"
            class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600"
          />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tienes códigos QR generados
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Los códigos QR se generan automáticamente cuando creas un nuevo plan (si está activado en tu configuración)
          </p>
          <UButton
            icon="i-heroicons-plus"
            to="/protected/logged"
            color="primary"
          >
            Ir a Mis Planes
          </UButton>
        </div>

        <!-- QR Codes List -->
        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="plan in plansWithQR"
            :key="plan._id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <!-- Plan Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  {{ getPlanName(plan) }}
                </h4>
                <p
                  v-if="plan.desc_obra"
                  class="text-sm text-gray-600 dark:text-gray-400 line-clamp-1"
                >
                  {{ plan.desc_obra }}
                </p>
              </div>
              <QRStatusBadge
                :state="plan.qrCodeState"
                size="md"
                class="shrink-0 ml-3"
              />
            </div>

            <!-- QR Details -->
            <div class="flex flex-wrap items-center gap-4 text-sm mb-3">
              <!-- Expiration Date -->
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-calendar"
                  class="w-4 h-4 text-gray-500 dark:text-gray-400"
                />
                <span class="text-gray-600 dark:text-gray-400">
                  {{ getExpirationLabel(plan) }}
                </span>
              </div>

              <!-- Public URL -->
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-link"
                  class="w-4 h-4 text-gray-500 dark:text-gray-400"
                />
                <a
                  :href="getPublicUrl(plan)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:underline truncate max-w-xs inline-block"
                >
                  {{ getPublicUrl(plan) }}
                </a>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <!-- View Plan Link -->
              <UButton
                :to="`/protected/logged/${plan._id}`"
                variant="ghost"
                color="gray"
                size="sm"
                icon="i-heroicons-eye"
              >
                Ver plan
              </UButton>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2">
                <!-- Toggle Enable/Disable -->
                <UButton
                  :icon="plan.qrEnabled ? 'i-heroicons-check' : 'i-heroicons-x-mark'"
                  :variant="plan.qrEnabled ? 'outline' : 'soft'"
                  :color="plan.qrEnabled ? 'gray' : 'red'"
                  size="sm"
                  :loading="processingPlan === plan._id"
                  @click="handleToggleQR(plan)"
                >
                  {{ plan.qrEnabled ? 'Deshabilitar' : 'Habilitar' }}
                </UButton>

                <!-- Regenerate QR -->
                <UButton
                  icon="i-heroicons-arrow-path"
                  variant="outline"
                  size="sm"
                  :loading="processingPlan === plan._id"
                  @click="handleRegenerateQR(plan)"
                >
                  Regenerar
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Settings Link -->
      <UCard>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-cog-6-tooth"
              class="w-5 h-5 text-gray-500 dark:text-gray-400"
            />
            <div>
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                Configuración de Códigos QR
              </h4>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Ajusta la URL base, generación automática y período de expiración
              </p>
            </div>
          </div>
          <UButton
            to="/protected/settings/qr"
            variant="outline"
            size="sm"
            icon="i-heroicons-cog-6-tooth"
          >
            Configurar
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QRListItem } from '~/composables/useQRList'

// Page meta - requires authentication
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Use QR list composable
const {
  loading,
  error,
  plansWithQR,
  hasQRCodes,
  totalCount,
  activeCount,
  expiredCount,
  disabledCount,
  loadPlansWithQR,
  regenerateQR,
  toggleQR
} = useQRList()

// Track which plan is being processed
const processingPlan = ref<string | null>(null)

/**
 * Get plan name from various possible fields
 */
function getPlanName(plan: QRListItem): string {
  return plan.nom_obra || plan.ob_obra_nom || 'Sin nombre'
}

/**
 * Get public URL for QR code
 */
function getPublicUrl(plan: QRListItem): string {
  if (!plan.qrCode) return '#'

  // Check if publicUrl is already set
  if ('publicUrl' in plan.qrCode && plan.qrCode.publicUrl) {
    return plan.qrCode.publicUrl as string
  }

  // Construct URL from slug
  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || window.location.origin
  return `${baseUrl}/public/planes/${plan._id}/${plan.qrCode.slug}`
}

/**
 * Get expiration label based on QR code state
 */
function getExpirationLabel(plan: QRListItem): string {
  if (!plan.qrCode) return 'Sin fecha de expiración'

  const expiresAtDisplay = plan.expiresAtDisplay || ''
  const daysUntilExpiration = plan.daysUntilExpiration || 0

  if (plan.qrCodeState === 'expired') {
    return `Expiró el ${expiresAtDisplay}`
  }

  if (plan.qrCodeState === 'disabled') {
    return `Deshabilitado (expira el ${expiresAtDisplay})`
  }

  if (daysUntilExpiration === 0) {
    return `Expira hoy (${expiresAtDisplay})`
  }

  if (daysUntilExpiration === 1) {
    return `Expira mañana (${expiresAtDisplay})`
  }

  return `Expira en ${daysUntilExpiration} días (${expiresAtDisplay})`
}

/**
 * Handle regenerate QR code
 */
async function handleRegenerateQR(plan: QRListItem) {
  processingPlan.value = plan._id

  try {
    await regenerateQR(plan._id)
  } finally {
    processingPlan.value = null
  }
}

/**
 * Handle toggle QR code enable/disable
 */
async function handleToggleQR(plan: QRListItem) {
  processingPlan.value = plan._id

  try {
    await toggleQR(plan._id, !plan.qrEnabled)
  } finally {
    processingPlan.value = null
  }
}

// Load QR codes on mount
onMounted(() => {
  loadPlansWithQR()
})
</script>
