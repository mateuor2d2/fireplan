<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">
        Capítulos
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
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="item in capitulos"
            :key="item._id"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ item.id }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ item.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ item.description }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              <UBadge
                :color="item.isActive ? 'success' : 'error'"
                variant="subtle"
              >
                {{ item.isActive ? 'Sí' : 'No' }}
              </UBadge>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex space-x-2 justify-end">
                <UButton
                  color="secondary"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  @click="openModal(item)"
                />
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  @click="confirmDelete(item)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="capitulos.length === 0">
            <td
              :colspan="columns.length"
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
      description="Añadir o editar capítulos de obra"
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
              label="Seleccionar Capítulo Existente"
              name="existingCapitulo"
            >
              <USelect
                v-model="selectedExistingCapitulo"
                :items="availableCapitulos"
                placeholder="Selecciona un capítulo existente"
                searchable
                class="w-full"
                @change="loadCapituloData"
              />
            </UFormField>

            <UFormField
              label="Nombre"
              name="name"
              required
            >
              <UInput
                v-model="formState.name"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Descripción"
              name="description"
              required
            >
              <UTextarea
                v-model="formState.description"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="ID"
              name="id"
            >
              <UInput
                v-model.number="formState.id"
                type="number"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Activo"
              name="isActive"
            >
              <USwitch v-model="formState.isActive" />
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

          <!-- Switch to delete from master table (only for user chapters) -->
          <div
            v-if="itemToDelete && !itemToDelete.isDefault"
            class="mt-4"
          >
            <UCheckbox
              v-model="deleteFromMasterTable"
              label="Eliminar también de la tabla maestra"
              :disabled="isSubmitting"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Esta opción solo está disponible para capítulos creados por el usuario
            </p>
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
import { useMasterTablesStore } from '~/stores/masterTables'
import { useRequestHeaders } from '#imports'

const planesStore = usePlanesStore()
const masterTablesStore = useMasterTablesStore()

// Form state
const formState = reactive({
  _id: undefined,
  id: 0,
  name: '',
  description: '',
  isActive: true,
  isDefault: false
})

// Modal state
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const showDeleteConfirm = ref(false)
const itemToDelete = ref(null)
const deleteFromMasterTable = ref(false)

// Load master table data when component is mounted
onMounted(async () => {
  await masterTablesStore.setCurrentTable('capitulo')
})

// Computed property for available capitulos (combining default and user chapters)
const availableCapitulos = computed(() => {
  const defaultCapitulos = masterTablesStore.defaultTables.capitulo || []
  const userCapitulos = masterTablesStore.userTables.capitulo || []
  const allCapitulos = [...defaultCapitulos, ...userCapitulos].filter(chapter => chapter.isActive)

  // Transform to match USelect expected format
  return allCapitulos.map(capitulo => ({
    ...capitulo,
    label: capitulo.name,
    value: capitulo._id
  }))
})

// Selected existing capitulo for loading into form
const selectedExistingCapitulo = ref(null)
// Track original data to detect changes
const originalCapituloData = ref(null)

// Method to load selected capitulo data into form
function loadCapituloData() {
  if (selectedExistingCapitulo.value) {
    const selected = availableCapitulos.value.find(
      cap => cap.value === selectedExistingCapitulo.value
    )
    if (selected) {
      // Remove the transformed properties before loading into form
      const { label, value, ...formData } = selected
      Object.assign(formState, formData)
      isEditing.value = true
      // Track original data to detect changes
      originalCapituloData.value = { ...formData }
    }
  }
}

// Table columns
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nombre' },
  { key: 'description', label: 'Descripción' },
  { key: 'isActive', label: 'Activo' },
  { key: 'actions', label: 'Acciones' }
]

// Validation function
const validate = (state: any) => {
  const errors = []
  if (!state.name) errors.push({ path: 'name', message: 'El nombre es requerido' })
  if (!state.description) errors.push({ path: 'description', message: 'La descripción es requerida' })
  return errors
}

// Computed
const capitulos = computed(() => masterTablesStore.userTables.capitulo || [])

// Methods
function openModal(item = null) {
  isEditing.value = !!item
  if (item) {
    console.log('Opening modal with item:', item)
    // When editing an existing item, we need to check if it's from the transformed data or direct table data
    if (item.label && item.value) {
      // This is from the select dropdown (transformed data)
      console.log('Item is from select dropdown (transformed)')
      // Remove the transformed properties before loading into form
      const { label, value, ...formData } = item
      Object.assign(formState, formData)
      originalCapituloData.value = { ...formData }
    } else {
      // This is from the table directly (untransformed data)
      console.log('Item is from table directly (untransformed)')
      Object.assign(formState, { ...item })
      originalCapituloData.value = { ...item }
    }
    console.log('Form state after loading:', formState)
    console.log('Original data tracked:', originalCapituloData.value)
  } else {
    resetForm()
  }
  isModalOpen.value = true
}

function resetForm() {
  Object.assign(formState, {
    _id: undefined,
    id: 0,
    name: '',
    description: '',
    isActive: true,
    isDefault: false
  })
  selectedExistingCapitulo.value = null
  originalCapituloData.value = null
}

async function handleSubmit() {
  isSubmitting.value = true
  try {
    const newItem = { ...formState }
    console.log('Submitting form with data:', newItem)
    console.log('Is editing:', isEditing.value)
    console.log('Original data:', originalCapituloData.value)

    // Check if we're editing an existing chapter and if it was modified
    if (isEditing.value && originalCapituloData.value) {
      console.log('Comparing newItem:', newItem)
      console.log('With originalCapituloData:', originalCapituloData.value)
      // Check if the chapter was actually modified
      const isModified = JSON.stringify(newItem) !== JSON.stringify(originalCapituloData.value)
      console.log('Is modified:', isModified)

      if (isModified) {
        console.log('Chapter was modified, processing update/create')
        // If it's a default chapter, create a new user-specific one instead of updating
        if (originalCapituloData.value.isDefault) {
          console.log('Original was default chapter, creating new user chapter')
          // Remove the _id to create a new item
          delete newItem._id
          newItem.isDefault = false // Make it a user chapter
          const createdItem = await masterTablesStore.createItem('capitulo', newItem)
          // The item is already added to the store by createItem, no need to push again
        } else {
          console.log('Updating existing user chapter with ID:', formState._id)
          // Update existing user chapter
          const updatedItem = await masterTablesStore.updateItem('capitulo', formState._id, newItem)
          // Update the local table data directly for immediate feedback
          const index = masterTablesStore.userTables.capitulo.findIndex(item => item._id === formState._id)
          if (index !== -1) {
            masterTablesStore.userTables.capitulo[index] = updatedItem
          }
        }
      } else {
        console.log('Chapter was not modified, doing nothing')
      }
      // If not modified, do nothing
    } else {
      console.log('Creating new chapter')
      // Creating a new chapter
      newItem.isDefault = false // Always create as user chapter
      const createdItem = await masterTablesStore.createItem('capitulo', newItem)
      // The item is already added to the store by createItem, no need to push again
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

function confirmDelete(item) {
  itemToDelete.value = item
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!itemToDelete.value || !itemToDelete.value._id) return

  try {
    isSubmitting.value = true

    // Check if we should delete from master table
    if (deleteFromMasterTable.value && !itemToDelete.value.isDefault) {
      // Delete from master table by calling the API with a special flag
      const { error } = await $fetch(`/api/mastertable/${itemToDelete.value._id}`, {
        method: 'DELETE',
        query: {
          tableType: 'capitulo',
          deleteFromMaster: true
        },
        headers: useRequestHeaders(['cookie'])
      })

      if (error) {
        throw new Error(error.message || 'Error deleting from master table')
      }

      // Also remove from local store
      await masterTablesStore.loadTables('capitulo')
    } else {
      // Delete from user table only
      await masterTablesStore.deleteItem('capitulo', itemToDelete.value._id)
    }

    showDeleteConfirm.value = false
    itemToDelete.value = null
    deleteFromMasterTable.value = false // Reset the switch
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
