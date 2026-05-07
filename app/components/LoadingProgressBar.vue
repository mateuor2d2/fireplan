<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
      <div class="text-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ props.title }}
        </h3>
        <p class="text-sm text-gray-600 mt-1">
          {{ props.description || currentStepDescription }}
        </p>
      </div>

      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progreso</span>
          <span>{{ Math.round(progressPercentage) }}%</span>
        </div>
        <UProgress
          :value="progressPercentage"
          :max="100"
          size="md"
          color="primary"
          class="mb-2"
        />
      </div>

      <!-- Steps List -->
      <div class="space-y-2">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="flex items-center space-x-3"
        >
          <!-- Step Icon -->
          <div class="flex-shrink-0">
            <div
              v-if="step.status === 'completed'"
              class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
            >
              <Icon
                name="i-heroicons-check"
                class="w-3 h-3 text-white"
              />
            </div>
            <div
              v-else-if="step.status === 'current'"
              class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse"
            >
              <Icon
                name="i-heroicons-arrow-path"
                class="w-3 h-3 text-white animate-spin"
              />
            </div>
            <div
              v-else
              class="w-5 h-5 bg-gray-300 rounded-full"
            />
          </div>

          <!-- Step Text -->
          <div class="flex-1">
            <p
              :class="[
                'text-sm font-medium',
                step.status === 'completed' ? 'text-green-700'
                : step.status === 'current' ? 'text-blue-700'
                  : 'text-gray-500'
              ]"
            >
              {{ step.title }}
            </p>
            <p
              v-if="step.description && step.status === 'current'"
              class="text-xs text-gray-600 mt-1"
            >
              {{ step.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Cancel Button (optional) -->
      <div
        v-if="showCancelButton"
        class="mt-4 text-center"
      >
        <UButton
          variant="ghost"
          size="sm"
          @click="$emit('cancel')"
        >
          Cancelar
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface LoadingStep {
  id: string
  title: string
  description?: string
  status: 'pending' | 'current' | 'completed'
}

interface Props {
  isVisible: boolean
  currentStep: string
  showCancelButton?: boolean
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  showCancelButton: false,
  title: 'Cargando Partidas',
  description: ''
})

defineEmits<{
  cancel: []
}>()

// Define the loading steps
const steps = ref<LoadingStep[]>([
  {
    id: 'checking',
    title: 'Verificando configuración',
    description: 'Comprobando configuración del usuario y plan',
    status: 'pending'
  },
  {
    id: 'loading-capitulos',
    title: 'Cargando capítulos',
    description: 'Obteniendo capítulos desde tablas maestras',
    status: 'pending'
  },
  {
    id: 'loading-conceptos',
    title: 'Cargando conceptos',
    description: 'Obteniendo conceptos para cada capítulo',
    status: 'pending'
  },
  {
    id: 'building-tree',
    title: 'Construyendo árbol',
    description: 'Organizando datos en estructura de árbol',
    status: 'pending'
  },
  {
    id: 'finalizing',
    title: 'Finalizando',
    description: 'Guardando datos en el estado',
    status: 'pending'
  }
])

// Computed properties
const currentStepIndex = computed(() => {
  return steps.value.findIndex(step => step.id === props.currentStep)
})

const progressPercentage = computed(() => {
  if (currentStepIndex.value === -1) return 0
  return ((currentStepIndex.value + 1) / steps.value.length) * 100
})

const currentStepDescription = computed(() => {
  const step = steps.value.find(step => step.id === props.currentStep)
  return step?.description || 'Procesando...'
})

// Update step statuses based on current step
watch(() => props.currentStep, (newStep) => {
  steps.value.forEach((step, index) => {
    const stepIndex = steps.value.findIndex(s => s.id === newStep)

    if (index < stepIndex) {
      step.status = 'completed'
    } else if (index === stepIndex) {
      step.status = 'current'
    } else {
      step.status = 'pending'
    }
  })
}, { immediate: true })
</script>
