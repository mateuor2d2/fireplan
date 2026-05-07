<script setup lang="ts">
interface ErrorModalProps {
  modelValue?: boolean
  isOpen?: boolean
  title?: string
  message: string
  details?: string
  errors?: string[]
}

interface ErrorModalEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:isOpen', value: boolean): void
  (e: 'close'): void
  (e: 'retry'): void
}

const props = withDefaults(defineProps<ErrorModalProps>(), {
  modelValue: undefined,
  isOpen: undefined,
  title: 'Error de Validación',
  details: '',
  errors: () => []
})

const emit = defineEmits<ErrorModalEmits>()

// Computed property for modal state (supports both v-model patterns)
const modalOpen = computed({
  get: () => props.modelValue ?? props.isOpen ?? false,
  set: (value: boolean) => {
    if (props.modelValue !== undefined) {
      emit('update:modelValue', value)
    } else {
      emit('update:isOpen', value)
    }
  }
})

// Computed properties for better organization
const hasDetails = computed(() => Boolean(props.details))
const hasErrors = computed(() => props.errors && props.errors.length > 0)

// Close modal handler
function closeModal() {
  modalOpen.value = false
  emit('close')
}

// Retry action handler
function retryAction() {
  emit('retry')
  closeModal()
}

// Keyboard shortcuts
onKeyStroke('Escape', () => {
  if (modalOpen.value) {
    closeModal()
  }
})
</script>

<template>
  <UModal
    v-model="modalOpen"
    :ui="{
      wrapper: 'flex min-h-full items-center justify-center p-4',
      inner: 'relative max-w-lg w-full'
    }"
    aria-labelledby="error-modal-title"
    aria-describedby="error-modal-description"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-6 h-6 text-red-500"
            />
          </div>
          <h3
            id="error-modal-title"
            class="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {{ title }}
          </h3>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-x-mark"
          aria-label="Cerrar modal de error"
          @click="closeModal"
        />
      </div>
    </template>

    <template #body>
      <div
        id="error-modal-description"
        class="sr-only"
      >
        Modal de error que muestra información sobre errores de validación del formulario
      </div>

      <div class="space-y-4">
        <!-- Main Error Message -->
        <div class="text-gray-700 dark:text-gray-300 leading-relaxed">
          {{ message }}
        </div>

        <!-- Error Details (if provided) -->
        <div
          v-if="hasDetails"
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
        >
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Detalles del error:
          </h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {{ details }}
          </p>
        </div>

        <!-- Multiple Error List (if provided) -->
        <div
          v-if="hasErrors"
          class="space-y-2"
        >
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">
            Errores encontrados:
          </h4>
          <ul class="space-y-2">
            <li
              v-for="(error, index) in errors"
              :key="index"
              class="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
            >
              <UIcon
                name="i-heroicons-x-circle"
                class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              />
              <span class="text-sm text-red-700 dark:text-red-300">
                {{ error }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Help Text -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-heroicons-information-circle"
              class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
            />
            <div class="text-sm text-blue-700 dark:text-blue-300">
              <p class="font-medium mb-1">
                ¿Qué puedes hacer?
              </p>
              <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Revisa los campos marcados en rojo</li>
                <li>Asegúrate de que todos los campos requeridos estén completos</li>
                <li>Verifica que los valores cumplan con los formatos requeridos</li>
                <li>Si el problema persiste, contacta con soporte técnico</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          v-if="$slots.retry"
          color="primary"
          variant="soft"
          @click="retryAction"
        >
          <slot name="retry-text">
            Reintentar
          </slot>
        </UButton>
        <UButton
          color="neutral"
          @click="closeModal"
        >
          Entendido
        </UButton>
      </div>
    </template>
  </UModal>
</template>
