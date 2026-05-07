<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// import { useOverlay } from '@nuxt/ui/composables/useOverlay'
import { usePresupuestosStore } from '~/stores/presupuestos'
import { useUserStore } from '~/stores/user'
import { useErrorHandler } from '~/composables/useErrorHandler'

// Props
interface Props {
  userId: string
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false
})

const emit = defineEmits(['close', 'save'])

// Store and composables
const presupuestosStore = usePresupuestosStore()
const userStore = useUserStore()
const { handleApiError } = useErrorHandler()
// const overlay = useOverlay()

// State
const isSubmitting = ref(false)
const settingsLoaded = ref(false)

// Form state
const formState = ref({
  enabledCategories: [
    'Protecciones Personales',
    'Protecciones Colectivas',
    'Señalizaciones',
    'Medicina Preventiva',
    'Instalaciones para el personal',
    'Extinción de incendios',
    'Primeros auxilios',
    'Formación y reuniones de obligado cumplimiento'
  ],
  defaultAmortization: 100,
  pricingRules: {
    personalProtection: {
      perWorker: true,
      basePrice: 0
    },
    collectiveProtection: {
      perPerimeter: true,
      basePrice: 0,
      perimeterUnit: 10
    }
  },
  autoCalculation: {
    enabled: true,
    adjustToTarget: false,
    rounding: 'two-decimals'
  },
  defaultItems: [] as Array<{
    concepto: string
    tipo: string
    ud: number
    precioud: number
    amortizacion: number
  }>
})

// Available categories
const availableCategories = [
  'Protecciones Personales',
  'Protecciones Colectivas',
  'Señalizaciones',
  'Medicina Preventiva',
  'Instalaciones para el personal',
  'Extinción de incendios',
  'Primeros auxilios',
  'Formación y reuniones de obligado cumplimiento'
]

// Rounding options
const roundingOptions = [
  { label: 'Sin redondeo', value: 'none' },
  { label: '2 decimales', value: 'two-decimals' },
  { label: 'Euro más cercano', value: 'nearest-euro' }
]

// Load settings on mount
const loadSettings = async () => {
  try {
    console.log('🔧 [SETTINGS] Loading settings for user:', props.userId)
    const response = await $fetch(`/api/users/${props.userId}/presupuesto/settings`)

    if (response.success) {
      formState.value = {
        enabledCategories: response.data.enabledCategories,
        defaultAmortization: response.data.defaultAmortization,
        pricingRules: response.data.pricingRules,
        autoCalculation: response.data.autoCalculation,
        defaultItems: response.data.defaultItems || []
      }
      console.log('✅ [SETTINGS] Settings loaded successfully')
    }
  } catch (error) {
    console.error('❌ [SETTINGS] Error loading settings:', error)
    handleApiError(error, 'Error al cargar configuración')
  } finally {
    settingsLoaded.value = true
  }
}

// Toggle category
const toggleCategory = (category: string) => {
  const index = formState.value.enabledCategories.indexOf(category)
  if (index > -1) {
    formState.value.enabledCategories.splice(index, 1)
  } else {
    formState.value.enabledCategories.push(category)
  }
}

// Save settings
const saveSettings = async () => {
  try {
    isSubmitting.value = true
    console.log('💾 [SETTINGS] Saving settings...')

    const response = await $fetch(`/api/users/${props.userId}/presupuesto/settings`, {
      method: 'POST',
      body: formState.value
    })

    if (response.success) {
      console.log('✅ [SETTINGS] Settings saved successfully')

      // Show success toast
      useToast().add({
        title: 'Configuración Guardada',
        description: 'La configuración del presupuesto se ha guardado correctamente',
        color: 'success'
      })

      // Emit save event
      emit('save', response.data)

      // Close modal
      emit('close')
    }
  } catch (error) {
    console.error('❌ [SETTINGS] Error saving settings:', error)
    handleApiError(error, 'Error al guardar configuración')
  } finally {
    isSubmitting.value = false
  }
}

// Reset to defaults
const resetToDefaults = () => {
  formState.value = {
    enabledCategories: [...availableCategories],
    defaultAmortization: 100,
    pricingRules: {
      personalProtection: {
        perWorker: true,
        basePrice: 0
      },
      collectiveProtection: {
        perPerimeter: true,
        basePrice: 0,
        perimeterUnit: 10
      }
    },
    autoCalculation: {
      enabled: true,
      adjustToTarget: false,
      rounding: 'two-decimals'
    },
    defaultItems: []
  }
}

// Computed properties
const isFormValid = computed(() => {
  return formState.value.enabledCategories.length > 0
    && formState.value.defaultAmortization >= 0
    && formState.value.defaultAmortization <= 100
})

// Load settings on component mount
onMounted(() => {
  loadSettings()
})
</script>

<template>
  <UModal
    :open="props.isOpen"
    :ui="{ wrapper: 'w-full max-w-4xl max-h-[90vh]' }"
    title="Configuración de Presupuesto"
    description="Personaliza la configuración de tu presupuesto de seguridad y salud"
    @update:open="$emit('close')"
  >
    <template #body>
      <div class="p-6 space-y-6">
        <!-- Loading state -->
        <div
          v-if="!settingsLoaded"
          class="flex justify-center py-8"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            class="h-6 w-6 animate-spin"
          />
        </div>

        <!-- Form content -->
        <div
          v-else
          class="space-y-6"
        >
          <!-- Categories Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium">
              Categorías Habilitadas
            </h3>
            <p class="text-sm text-gray-600">
              Selecciona las categorías que estarán disponibles en tu presupuesto
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UButton
                v-for="category in availableCategories"
                :key="category"
                :variant="formState.enabledCategories.includes(category) ? 'solid' : 'outline'"
                :color="formState.enabledCategories.includes(category) ? 'primary' : 'neutral'"
                size="sm"
                class="justify-start"
                @click="toggleCategory(category)"
              >
                <UIcon
                  :name="formState.enabledCategories.includes(category) ? 'i-heroicons-check' : 'i-heroicons-x-mark'"
                  class="mr-2 h-4 w-4"
                />
                {{ category }}
              </UButton>
            </div>
          </div>

          <!-- Default Settings Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium">
              Configuración por Defecto
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Default Amortization -->
              <UFormField
                label="Amortización por Defecto (%)"
                name="defaultAmortization"
              >
                <UInput
                  v-model.number="formState.defaultAmortization"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  icon="i-heroicons-percent-badge"
                />
              </UFormField>

              <!-- Rounding Option -->
              <UFormField
                label="Redondeo"
                name="rounding"
              >
                <USelect
                  v-model="formState.autoCalculation.rounding"
                  :items="roundingOptions"
                  placeholder="Seleccionar redondeo"
                  icon="i-heroicons-calculator"
                />
              </UFormField>
            </div>
          </div>

          <!-- Pricing Rules Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium">
              Reglas de Precios
            </h3>

            <div class="space-y-4">
              <!-- Personal Protection Rules -->
              <div class="border rounded-lg p-4">
                <h4 class="font-medium mb-3">
                  Protecciones Personales
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UFormField
                    label="Calcular por trabajador"
                    name="perWorker"
                  >
                    <USwitch v-model="formState.pricingRules.personalProtection.perWorker" />
                  </UFormField>

                  <UFormField
                    label="Precio base (€)"
                    name="basePrice"
                  >
                    <UInput
                      v-model.number="formState.pricingRules.personalProtection.basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      icon="i-heroicons-currency-euro"
                    />
                  </UFormField>
                </div>
              </div>

              <!-- Collective Protection Rules -->
              <div class="border rounded-lg p-4">
                <h4 class="font-medium mb-3">
                  Protecciones Colectivas
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UFormField
                    label="Calcular por perímetro"
                    name="perPerimeter"
                  >
                    <USwitch v-model="formState.pricingRules.collectiveProtection.perPerimeter" />
                  </UFormField>

                  <UFormField
                    label="Unidad de perímetro (m)"
                    name="perimeterUnit"
                  >
                    <UInput
                      v-model.number="formState.pricingRules.collectiveProtection.perimeterUnit"
                      type="number"
                      min="1"
                      placeholder="10"
                      icon="i-heroicons-cube"
                    />
                  </UFormField>

                  <UFormField
                    label="Precio base (€)"
                    name="basePrice"
                  >
                    <UInput
                      v-model.number="formState.pricingRules.collectiveProtection.basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      icon="i-heroicons-currency-euro"
                    />
                  </UFormField>
                </div>
              </div>
            </div>
          </div>

          <!-- Auto Calculation Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium">
              Cálculo Automático
            </h3>

            <div class="space-y-4">
              <UFormField
                label="Habilitar cálculo automático"
                name="autoCalculationEnabled"
              >
                <USwitch v-model="formState.autoCalculation.enabled" />
              </UFormField>

              <UFormField
                label="Ajustar al presupuesto objetivo"
                name="adjustToTarget"
              >
                <USwitch v-model="formState.autoCalculation.adjustToTarget" />
              </UFormField>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between items-center w-full">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="isSubmitting"
          @click="resetToDefaults"
        >
          Restablecer por Defecto
        </UButton>

        <div class="flex gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isSubmitting"
            @click="$emit('close')"
          >
            Cancelar
          </UButton>

          <UButton
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting || !isFormValid"
            icon="i-heroicons-check"
            @click="saveSettings"
          >
            Guardar Configuración
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
