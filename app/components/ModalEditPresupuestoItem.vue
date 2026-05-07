<script setup lang="ts">
import { usePresupuestosStore } from '@/stores/presupuestos'
import { useUserStore } from '@/stores/user'
import type { ConceptodePresupuesto } from '@/stores/presupuestos'

interface Props {
  modelValue: boolean
  presupuestoItem: ConceptodePresupuesto | null
  isEdit: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', item: ConceptodePresupuesto): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const presupuestosStore = usePresupuestosStore()
const userStore = useUserStore()
const toast = useToast()

const isLoading = ref(false)

// Form state
const state = reactive({
  concepto: '',
  tipo: '',
  ud: 1,
  precioud: 0,
  amortizacion: 100,
  total: 0
})

// Calculate total automatically
const calculatedTotal = computed(() => {
  return state.ud * state.precioud
})

// Watch for changes and update total
watch([() => state.ud, () => state.precioud], () => {
  state.total = calculatedTotal.value
})

// Populate form from presupuesto item
const populateFormFromItem = (item: ConceptodePresupuesto) => {
  state.concepto = item.concepto || ''
  state.tipo = item.tipo || ''
  state.ud = item.ud || 1
  state.precioud = item.precioud || 0
  state.amortizacion = item.amortizacion || 100
  state.total = item.total || calculatedTotal.value
}

// Initialize form when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.presupuestoItem) {
      populateFormFromItem(props.presupuestoItem)
    } else {
      // Reset for new item
      state.concepto = ''
      state.tipo = ''
      state.ud = 1
      state.precioud = 0
      state.amortizacion = 100
      state.total = 0
    }
  }
})

// Handle form submission
const onSubmit = async () => {
  try {
    isLoading.value = true

    const userId = userStore.user._id
    const itemData = {
      concepto: state.concepto,
      tipo: state.tipo,
      ud: state.ud,
      precioud: state.precioud,
      amortizacion: state.amortizacion,
      total: state.total
    }

    let savedItem: ConceptodePresupuesto

    if (props.isEdit && props.presupuestoItem?.id) {
      // Update existing item
      await presupuestosStore.updateUserPresupuestoItem(userId, props.presupuestoItem.id, itemData)
      savedItem = { ...props.presupuestoItem, ...itemData }
    } else {
      // Create new item
      savedItem = await presupuestosStore.createUserPresupuestoItem(userId, itemData)
    }

    toast.add({
      title: 'Éxito',
      description: props.isEdit ? 'Ítem de presupuesto actualizado correctamente' : 'Ítem de presupuesto creado correctamente',
      color: 'success'
    })

    emit('saved', savedItem)
    closeModal()
  } catch (error) {
    console.error('Error saving presupuesto item:', error)
    toast.add({
      title: 'Error',
      description: 'Error al guardar el ítem de presupuesto',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Handle delete
const deleteItem = async () => {
  if (!props.presupuestoItem?.id) return

  const confirmed = confirm(`¿Estás seguro de que quieres eliminar "${state.concepto}"?`)
  if (!confirmed) return

  try {
    isLoading.value = true

    await presupuestosStore.deleteUserPresupuestoItem(userStore.user._id, props.presupuestoItem.id)

    toast.add({
      title: 'Éxito',
      description: 'Ítem de presupuesto eliminado correctamente',
      color: 'success'
    })

    emit('saved', { ...props.presupuestoItem, id: null } as ConceptodePresupuesto)
    closeModal()
  } catch (error) {
    console.error('Error deleting presupuesto item:', error)
    toast.add({
      title: 'Error',
      description: 'Error al eliminar el ítem de presupuesto',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Modal state management
const isModalOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// Close modal
const closeModal = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <UModal
    v-model:open="isModalOpen"
    :title="isEdit ? 'Editar Ítem de Presupuesto' : 'Nuevo Ítem de Presupuesto'"
    :description="isEdit ? 'Modifica los datos del ítem de presupuesto' : 'Crea un nuevo ítem de presupuesto'"
  >
    <template #body>
      <div class="p-6 space-y-6">
        <UForm
          :state="state"
          class="space-y-6"
          @submit="onSubmit"
        >
          <!-- Información Básica -->
          <UCard class="overflow-hidden">
            <template #header>
              <div class="flex items-center space-x-2">
                <UIcon
                  name="i-heroicons-calculator"
                  class="w-5 h-5 text-primary-500"
                />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Información del Ítem
                </h2>
              </div>
            </template>

            <div class="space-y-4">
              <UFormField
                label="Concepto"
                name="concepto"
                required
                help="Nombre del concepto o material de seguridad"
              >
                <UInput
                  v-model="state.concepto"
                  placeholder="Ej: Casco de seguridad, Gafas de protección..."
                  :disabled="isLoading"
                  size="lg"
                  icon="i-heroicons-tag"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Tipo"
                name="tipo"
                required
                help="Categoría del ítem de presupuesto"
              >
                <USelectMenu
                  v-model="state.tipo"
                  :items="presupuestosStore.tipo_conceptos"
                  :disabled="isLoading"
                  placeholder="Seleccionar tipo"
                  icon="i-heroicons-folder"
                  class="w-full"
                />
              </UFormField>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UFormField
                  label="Unidades"
                  name="ud"
                  required
                  help="Cantidad de unidades"
                >
                  <UInput
                    v-model.number="state.ud"
                    type="number"
                    min="1"
                    :disabled="isLoading"
                    placeholder="1"
                    icon="i-heroicons-hashtag"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Precio por unidad (€)"
                  name="precioud"
                  required
                  help="Precio unitario"
                >
                  <UInput
                    v-model.number="state.precioud"
                    type="number"
                    step="0.01"
                    min="0"
                    :disabled="isLoading"
                    placeholder="0.00"
                    icon="i-heroicons-currency-euro"
                    class="w-full"
                  >
                    <template #trailing>
                      <span class="text-gray-500 dark:text-gray-400 text-sm">EUR</span>
                    </template>
                  </UInput>
                </UFormField>

                <UFormField
                  label="Amortización (%)"
                  name="amortizacion"
                  help="Porcentaje de amortización"
                >
                  <UInput
                    v-model.number="state.amortizacion"
                    type="number"
                    min="0"
                    max="100"
                    :disabled="isLoading"
                    placeholder="100"
                    icon="i-heroicons-percent-badge"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField
                label="Total (€)"
                name="total"
                help="Total calculado automáticamente"
              >
                <UInput
                  :value="state.total.toFixed(2)"
                  type="number"
                  disabled
                  icon="i-heroicons-currency-euro"
                  class="w-full font-semibold text-lg"
                >
                  <template #trailing>
                    <span class="text-gray-500 dark:text-gray-400 text-sm">EUR</span>
                  </template>
                </UInput>
              </UFormField>
            </div>
          </UCard>

          <!-- Actions -->
          <div class="flex justify-between">
            <div>
              <UButton
                v-if="isEdit && presupuestoItem?.id"
                color="error"
                variant="ghost"
                :loading="isLoading"
                icon="i-heroicons-trash"
                @click="deleteItem"
              >
                Eliminar
              </UButton>
            </div>

            <div class="flex space-x-3">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="isLoading"
                @click="closeModal"
              >
                Cancelar
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="isLoading"
                :disabled="isLoading"
                :icon="isEdit ? 'i-heroicons-pencil' : 'i-heroicons-plus'"
              >
                {{ isEdit ? 'Guardar Cambios' : 'Crear Ítem' }}
              </UButton>
            </div>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
