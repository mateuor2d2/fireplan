<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">
        Capítulos de la Obra
      </h3>
      <UButton
        color="primary"
        icon="i-heroicons-plus"
        @click="openModal()"
      >
        Añadir Capítulo
      </UButton>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Capítulo
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Descripción
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="(item, index) in capitulos"
            :key="index"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ item.capitulo }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ item.descripcion }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex space-x-2 justify-end">
                <UButton
                  color="secondary"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  @click="openModal(item, index)"
                />
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  @click="confirmDelete(index)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="capitulos.length === 0">
            <td
              colspan="3"
              class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              No hay capítulos registrados
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <UModal
      v-model:open="isModalOpen"
      title="Gestión de Capítulos"
      description="Añadir o editar capítulos de la obra"
    >
      <template #content>
        <UCard
          :ui="{
            base: 'flex flex-col',
            rounded: 'rounded-lg',
            ring: 'ring-1 ring-gray-200 dark:ring-gray-800',
            divide: 'divide-y divide-gray-200 dark:divide-gray-800'
          }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ isEditing ? 'Editar Capítulo' : 'Añadir Capítulo' }}
              </h3>
              <UButton
                color="secondary"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="isModalOpen = false"
              />
            </div>
          </template>

          <UForm
            :validate="validate"
            :state="formState"
            class="w-full space-y-4"
            @submit="handleSubmit"
          >
            <UFormField
              label="Capítulo"
              name="capitulo"
              required
            >
              <UInput
                v-model="formState.capitulo"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Descripción"
              name="descripcion"
              required
            >
              <UTextarea
                v-model="formState.descripcion"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-3 pt-4">
              <UButton
                type="button"
                color="secondary"
                variant="soft"
                label="Cancelar"
                :disabled="isSubmitting"
                @click="isModalOpen = false"
              />
              <UButton
                type="submit"
                :loading="isSubmitting"
                color="primary"
                variant="solid"
                :label="isEditing ? 'Actualizar' : 'Añadir'"
                @click.prevent="handleSubmit"
              />
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="showDeleteConfirm"
      title="Confirmar eliminación"
      description="Confirmar la eliminación del capítulo"
    >
      <template #content>
        <UCard
          :ui="{
            base: 'flex flex-col',
            rounded: 'rounded-lg',
            ring: 'ring-1 ring-gray-200 dark:ring-gray-800',
            divide: 'divide-y divide-gray-200 dark:divide-gray-800'
          }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Confirmar eliminación
              </h3>
              <UButton
                color="secondary"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="showDeleteConfirm = false"
              />
            </div>
          </template>

          <div class="text-gray-700 dark:text-gray-300">
            ¿Estás seguro de que deseas eliminar este capítulo? Esta acción no se puede deshacer.
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="secondary"
                variant="soft"
                label="Cancelar"
                :disabled="isSubmitting"
                @click="showDeleteConfirm = false"
              />
              <UButton
                color="error"
                variant="solid"
                label="Eliminar"
                :loading="isSubmitting"
                @click="handleDelete"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { usePlanesStore } from '~/stores/planes'

const planesStore = usePlanesStore()

// Form state
const formState = reactive({
  capitulo: '',
  descripcion: ''
})

// Modal state
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const showDeleteConfirm = ref(false)
const editIndex = ref<number | null>(null)
const deleteIndex = ref<number | null>(null)

// Validation function
const validate = (state: any) => {
  const errors = []
  if (!state.capitulo) errors.push({ path: 'capitulo', message: 'El capítulo es requerido' })
  if (!state.descripcion) errors.push({ path: 'descripcion', message: 'La descripción es requerida' })
  return errors
}

// Computed
const capitulos = computed(() => planesStore.planActual.desc_cap_obra || [])

// Methods
function openModal(item: any = null, index: number | null = null) {
  isEditing.value = !!item
  editIndex.value = index

  if (item) {
    Object.assign(formState, { ...item })
  } else {
    resetForm()
  }
  isModalOpen.value = true
}

function resetForm() {
  Object.assign(formState, {
    capitulo: '',
    descripcion: ''
  })
  editIndex.value = null
}

async function handleSubmit() {
  isSubmitting.value = true
  try {
    const newItem = { ...formState }

    if (isEditing.value && editIndex.value !== null) {
      // Update existing item
      const updatedCapitulos = [...capitulos.value]
      updatedCapitulos[editIndex.value] = newItem
      await planesStore.updateAllCapituloObra(updatedCapitulos)
    } else {
      // Add new item
      await planesStore.addCapituloObra(newItem)
    }

    isModalOpen.value = false
    resetForm()
  } catch (error: any) {
    console.error('Error saving chapter:', error)
    // Show error to user
    useToast().add({
      title: 'Error',
      description: error.message || 'Error al guardar el capítulo',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

function confirmDelete(index: number) {
  deleteIndex.value = index
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (deleteIndex.value === null) return

  try {
    isSubmitting.value = true

    const updatedCapitulos = [...capitulos.value]
    updatedCapitulos.splice(deleteIndex.value, 1)
    await planesStore.updateAllCapituloObra(updatedCapitulos)

    showDeleteConfirm.value = false
    deleteIndex.value = null
  } catch (error: any) {
    console.error('Error deleting chapter:', error)
    // Show error to user
    useToast().add({
      title: 'Error',
      description: error.message || 'Error al eliminar el capítulo',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
