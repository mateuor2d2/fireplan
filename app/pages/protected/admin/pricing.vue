<script setup lang="ts">
import type { PricingConfig } from '~/types/admin'

// Meta and middleware
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Stores
const userStore = useUserStore()

// Reactive state
const isLoading = ref(false)
const isSaving = ref(false)
const pricing = ref<PricingConfig>({
  planPrice: 2900,
  defaultPrecioPSS: 99
})

// Form state
const form = ref({
  planPrice: 2900,
  defaultPrecioPSS: 99
})

const hasChanges = computed(() => {
  return form.value.planPrice !== pricing.value.planPrice
    || form.value.defaultPrecioPSS !== pricing.value.defaultPrecioPSS
})

// Load pricing configuration
async function loadPricing() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/admin/pricing')

    if (!response.ok) {
      throw new Error('Error al cargar configuración')
    }

    const data = await response.json()
    pricing.value = data.pricing

    // Reset form to loaded values
    form.value.planPrice = data.pricing.planPrice
    form.value.defaultPrecioPSS = data.pricing.defaultPrecioPSS
  } catch (error) {
    console.error('Error loading pricing:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Error al cargar configuración de precios',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Save pricing configuration
async function savePricing() {
  isSaving.value = true
  try {
    const response = await $fetch('/api/admin/pricing', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planPrice: form.value.planPrice,
        defaultPrecioPSS: form.value.defaultPrecioPSS
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.statusMessage || 'Error al guardar')
    }

    const data = await response.json()
    pricing.value = data.pricing

    const toast = useToast()
    toast.add({
      title: 'Configuración Guardada',
      description: 'Los precios se han actualizado correctamente',
      color: 'success'
    })

    // Reset form to saved values
    form.value.planPrice = data.pricing.planPrice
    form.value.defaultPrecioPSS = data.pricing.defaultPrecioPSS
  } catch (error) {
    console.error('Error saving pricing:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.message || 'Error al guardar configuración de precios',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

// Reset form
function resetForm() {
  form.value.planPrice = pricing.value.planPrice
  form.value.defaultPrecioPSS = pricing.value.defaultPrecioPSS
}

onMounted(async () => {
  if (userStore.isAdmin) {
    await loadPricing()
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Configuración de Precios
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Configura los precios por defecto para Plan de Seguridad y Personalización de Unidades
      </p>
    </div>

    <!-- Admin Check -->
    <div
      v-if="!userStore.isAdmin"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
    >
      <div class="flex items-center space-x-3">
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="text-red-500 text-xl"
        />
        <div>
          <h3 class="text-lg font-semibold text-red-800 dark:text-red-200">
            Acceso Denegado
          </h3>
          <p class="text-red-700 dark:text-red-300 mt-1">
            Solo los administradores pueden acceder a esta sección.
          </p>
        </div>
      </div>
    </div>

    <!-- Admin Interface -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex justify-center py-12"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="text-blue-500 text-4xl animate-spin"
        />
      </div>

      <!-- Pricing Configuration Card -->
      <UCard
        v-else
        class="space-y-6"
      >
        <template #header>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Precios del Sistema
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Configura los precios que se aplicarán por defecto en toda la aplicación
          </p>
        </template>

        <!-- Plan Price Section -->
        <div class="space-y-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-200">
                  Precio del Plan
                </h3>
                <p class="text-sm text-blue-700 dark:text-blue-300">
                  Coste único de generación de Plan de Seguridad (€29.00 por defecto)
                </p>
              </div>
              <UIcon
                name="i-heroicons-document-text"
                class="text-blue-500 text-2xl"
              />
            </div>

            <div class="space-y-4">
              <UFormField
                label="Precio (en céntimos)"
                :error="undefined"
              >
                <UInput
                  v-model="form.planPrice"
                  type="number"
                  step="100"
                  min="100"
                  placeholder="2900"
                >
                  <template #suffix>
                    <span class="text-gray-500">¢</span>
                  </template>
                </UInput>
              </UFormField>

              <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span>Actual: €{{ (form.planPrice / 100).toFixed(2) }}</span>
                <span>({{ (form.planPrice / 100).toFixed(2) }} céntimos)</span>
              </div>
            </div>
          </div>

          <!-- Default PSS Price Section -->
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-green-900 dark:text-green-200">
                  Personalización PSS (€ por unidad)
                </h3>
                <p class="text-sm text-green-700 dark:text-green-300">
                  Precio por defecto por unidad para usuarios que personalizan sus unidades
                </p>
              </div>
              <UIcon
                name="i-heroicons-calculator"
                class="text-green-500 text-2xl"
              />
            </div>

            <div class="space-y-4">
              <UFormField
                label="Precio (en céntimos)"
                :error="undefined"
              >
                <UInput
                  v-model="form.defaultPrecioPSS"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="99"
                >
                  <template #suffix>
                    <span class="text-gray-500">¢</span>
                  </template>
                </UInput>
              </UFormField>

              <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span>Actual: €{{ form.defaultPrecioPSS.toFixed(2) }}</span>
                <span>({{ form.defaultPrecioPSS }} céntimos)</span>
              </div>

              <UAlert
                icon="i-heroicons-information-circle"
                color="blue"
                variant="soft"
                class="mt-4"
              >
                Este valor se usará como preciopor defecto para nuevos usuarios y aquellos que no hayan personalizado su valor.
              </UAlert>
            </div>
          </div>

          <!-- Currency Note -->
          <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <UIcon
                name="i-heroicons-currency-euro"
                class="text-gray-500 text-xl mt-1"
              />
              <div class="flex-1">
                <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                  Todos los precios están en EUR (€)
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Los valores se almacenan en céntimos en la base de datos para evitar redondeo.
                </p>
              </div>
            </div>
          </div>

          <!-- Save/Reset Actions -->
          <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <UButton
              icon="i-heroicons-arrow-path"
              label="Restaurar"
              color="gray"
              variant="ghost"
              :disabled="!hasChanges"
              @click="resetForm"
            />
            <UButton
              icon="i-heroicons-check"
              label="Guardar Cambios"
              color="green"
              :loading="isSaving"
              :disabled="!hasChanges || isSaving"
              @click="savePricing"
            />
          </div>
        </div>
      </UCard>

      <!-- Info Card -->
      <UCard class="space-y-6">
        <template #header>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Información Adicional
          </h2>
        </template>

        <div class="space-y-4">
          <UAlert
            icon="i-heroicons-lightbulb"
            color="yellow"
            variant="soft"
          >
            <h4 class="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Cambios en los precios
            </h4>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              Los cambios en la configuración de precios se aplicarán únicamente a los nuevos planes y usuarios. Los planes existentes no se verán afectados.
            </p>
          </UAlert>

          <UAlert
            icon="i-heroicons-shield-check"
            color="green"
            variant="soft"
          >
            <h4 class="font-semibold text-green-800 dark:text-green-200 mb-2">
              Seguridad de los Precios
            </h4>
            <p class="text-sm text-green-700 dark:text-green-300 mt-2">
              Los precios se validan en el lado del servidor. Los usuarios no pueden modificar precios mediante la API.
            </p>
          </UAlert>
        </div>
      </UCard>
    </div>
  </div>
</template>
