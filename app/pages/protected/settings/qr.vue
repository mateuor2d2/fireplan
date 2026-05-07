<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Configuración de Códigos QR
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Configura cómo se generan los códigos QR para tus planes de seguridad
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
          @click="loadSettings"
        >
          Reintentar
        </UButton>
      </UCard>
    </div>

    <!-- Settings Content -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Info Card -->
      <UAlert
        icon="i-heroicons-information-circle"
        color="blue"
        variant="soft"
        title="Acerca de los Códigos QR"
        description="Los códigos QR permiten el acceso público a tus planes mediante un enlace escaneable. Puedes configurar la URL base, si se generan automáticamente al crear planes y el período de validez."
        class="mb-6"
      />

      <!-- QR Settings Form -->
      <QRConfigForm
        :model-value="qrSettings"
        :loading="saving"
        @save="handleSave"
        @reset="handleReset"
      />

      <!-- Additional Info Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <!-- How it works -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-light-bulb"
                class="w-5 h-5 text-yellow-500"
              />
              <h3 class="text-lg font-medium">
                Cómo funciona
              </h3>
            </div>
          </template>
          <div class="space-y-3 text-sm">
            <p class="text-gray-700 dark:text-gray-300">
              <span class="font-medium">1.</span> Al crear un plan, se genera un código QR automáticamente (si está activado)
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              <span class="font-medium">2.</span> El código QR contiene un enlace público único con fecha de expiración
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              <span class="font-medium">3.</span> Al escanear el QR, cualquiera puede ver el plan y descargar el PDF
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              <span class="font-medium">4.</span> El código QR se incrusta automáticamente en el PDF del plan
            </p>
          </div>
        </UCard>

        <!-- Tips -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-sparkles"
                class="w-5 h-5 text-purple-500"
              />
              <h3 class="text-lg font-medium">
                Consejos
              </h3>
            </div>
          </template>
          <div class="space-y-3 text-sm">
            <p class="text-gray-700 dark:text-gray-300">
              📱 Usa una URL base corta y fácil de recordar para compartir códigos QR
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              ⏰ Elige un período de expiración según la duración de tus proyectos
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              🔄 Puedes regenerar códigos QR con un nuevo token desde la página del plan
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              📊 Los códigos QR deshabilitados no permiten el acceso público
            </p>
          </div>
        </UCard>
      </div>

      <!-- Current QR Codes Summary -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-qr-code"
                class="w-5 h-5 text-primary"
              />
              <h3 class="text-lg font-medium">
                Mis Códigos QR Activos
              </h3>
            </div>
            <UButton
              icon="i-heroicons-arrow-right"
              variant="outline"
              size="sm"
              to="/protected/logged"
            >
              Ver planes
            </UButton>
          </div>
        </template>

        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <UIcon
            name="i-heroicons-information-circle"
            class="w-12 h-12 mx-auto mb-3 opacity-50"
          />
          <p>Los códigos QR se gestionan desde la página de cada plan</p>
          <p class="text-sm mt-2">
            Ve a "Mis Planes" para ver y gestionar los códigos QR de cada plan
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QRSettings } from '~/types/qr'

// Page meta - requires authentication
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const userStore = useUserStore()
const toast = useToast()

// State
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const qrSettings = ref<QRSettings>({
  autoGenerate: true,
  baseUrl: 'http://localhost:3000',
  expirationDays: 30
})

// Methods
async function loadSettings() {
  loading.value = true
  error.value = null

  try {
    const settings = await userStore.getQRSettings()
    qrSettings.value = settings
  } catch (err: any) {
    console.error('Error loading QR settings:', err)
    error.value = err.message || 'No se pudieron cargar la configuración'
  } finally {
    loading.value = false
  }
}

async function handleSave(settings: QRSettings) {
  saving.value = true

  try {
    await userStore.updateQRSettings(settings)
    qrSettings.value = settings

    toast.add({
      title: 'Configuración guardada',
      description: 'Tus preferencias de códigos QR han sido actualizadas',
      color: 'green',
      icon: 'i-heroicons-check-circle'
    })
  } catch (err: any) {
    throw err // Re-throw to let form handle error
  } finally {
    saving.value = false
  }
}

function handleReset() {
  // Reload settings from server
  loadSettings()

  toast.add({
    title: 'Configuración restablecida',
    description: 'Se han cargado los valores guardados',
    color: 'blue',
    icon: 'i-heroicons-arrow-path'
  })
}

// Load settings on mount
onMounted(() => {
  loadSettings()
})
</script>
