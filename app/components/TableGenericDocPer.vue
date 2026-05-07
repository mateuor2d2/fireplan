<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'

interface ColumnField {
  id: string
  label: string
  sortable?: boolean
  required?: boolean
}

const props = defineProps<{
  title: string
  data: Array<Record<string, any>>
  columns: Array<ColumnField>
}>()

const emit = defineEmits(['update'])

// Modal state
const isModalOpen = ref(false)
const showDeleteConfirm = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const itemToDelete = ref<Record<string, any> | null>(null)

// Form state
const formState = reactive<Record<string, any>>({})

// Check if all required fields are filled
const isFormValid = computed(() => {
  const requiredColumns = props.columns.filter(col => col.required)
  const isValid = !props.columns.some(column =>
    column.required && (!formState[column.id] || formState[column.id].trim() === '')
  )

  console.log('🔍 TableGenericDocPer - isFormValid check:')
  console.log('🔍 TableGenericDocPer - requiredColumns:', requiredColumns)
  console.log('🔍 TableGenericDocPer - formState:', formState)
  console.log('🔍 TableGenericDocPer - isValid:', isValid)

  return isValid
})

// Initialize form with empty values based on columns, excluding actions
const initializeForm = () => {
  props.columns
    .filter(column => column.id !== 'actions')
    .forEach((column) => {
      formState[column.id] = ''
    })
}

// Open modal for adding/editing
const openModal = (item = null) => {
  console.log('🔵 TableGenericDocPer - openModal called')
  console.log('🔵 TableGenericDocPer - item:', item)
  console.log('🔵 TableGenericDocPer - props.data:', props.data)
  console.log('🔵 TableGenericDocPer - props.title:', props.title)

  isEditing.value = !!item
  console.log('🔵 TableGenericDocPer - isEditing:', isEditing.value)

  // Reset form state
  Object.keys(formState).forEach(key => delete formState[key])

  // Initialize form with empty values for all columns except 'actions'
  props.columns
    .filter(column => column.id !== 'actions')
    .forEach((column) => {
      formState[column.id] = item ? item[column.id] || '' : ''
    })

  console.log('🔵 TableGenericDocPer - formState after init:', formState)
  isModalOpen.value = true
  console.log('🔵 TableGenericDocPer - modal opened')
}

// Handle form submission
const handleSubmit = async () => {
  isSubmitting.value = true

  try {
    // Create a clean item data object with only the columns we want
    const itemData: Record<string, any> = {}
    props.columns
      .filter(column => column.id !== 'actions')
      .forEach((column) => {
        itemData[column.id] = formState[column.id]
      })

    console.log('🟢 TableGenericDocPer - handleSubmit START')
    console.log('🟢 TableGenericDocPer - props.title:', props.title)
    console.log('🟢 TableGenericDocPer - isEditing:', isEditing.value)
    console.log('🟢 TableGenericDocPer - itemData:', itemData)
    console.log('🟢 TableGenericDocPer - props.data BEFORE:', props.data)
    console.log('🟢 TableGenericDocPer - formState:', formState)

    if (isEditing.value) {
      // Find and update existing item
      const index = props.data.findIndex(item =>
        item.id === itemData.id
        || (item.nombre && item.nombre === itemData.nombre)
      )

      console.log('🟡 TableGenericDocPer - EDITING mode, found index:', index)

      if (index !== -1) {
        const updatedData = [...props.data]
        updatedData[index] = { ...updatedData[index], ...itemData }
        console.log('🟡 TableGenericDocPer - EDITING - emitting update with updatedData:', updatedData)
        emit('update', updatedData)
      }
    } else {
      // Add new item with generated ID
      const newItem = {
        ...itemData,
        id: Date.now().toString() // Simple ID generation
      }
      const newData = [...props.data, newItem]
      console.log('🟡 TableGenericDocPer - ADDING - emitting update with newData:', newData)
      emit('update', newData)
    }

    isModalOpen.value = false
  } catch (error) {
    console.error('Error saving item:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Confirm delete
const confirmDelete = (item: Record<string, any>) => {
  itemToDelete.value = item
  showDeleteConfirm.value = true
}

// Handle delete
const handleDelete = async () => {
  if (!itemToDelete.value) return

  isSubmitting.value = true

  try {
    const index = props.data.findIndex(
      item => item.id === itemToDelete.value?.id || item.nombre === itemToDelete.value?.nombre
    )

    if (index !== -1) {
      const newData = props.data.filter((_, i) => i !== index)
      emit('update', newData)
    }

    showDeleteConfirm.value = false
    itemToDelete.value = null
  } catch (error) {
    console.error('Error deleting item:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Form validation
const validate = (state: any) => {
  const errors: any[] = []
  props.columns
    .filter(column => column.id !== 'actions')
    .forEach((column) => {
      if (column.required && !state[column.id]) {
        errors.push({ path: column.id, message: 'Campo requerido' })
      }
    })
  return errors.length ? errors : null
}

// Initialize form on component mount
initializeForm()
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">
        {{ title }}
      </h3>
      <UButton
        color="primary"
        icon="i-heroicons-plus"
        @click="openModal()"
      >
        Añadir {{ title }}
      </UButton>
    </div>

    <!-- Table -->

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              v-for="column in columns.filter(col => col.id !== 'actions')"
              :key="column.id"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {{ column.label }}
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="item in data"
            :key="item.id || item.nombre"
          >
            <td
              v-for="column in columns.filter(col => col.id !== 'actions')"
              :key="column.id"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
            >
              {{ item[column.id] }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex space-x-2 justify-end">
                <UButton
                  color="neutral"
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
          <tr v-if="data.length === 0">
            <td
              :colspan="columns.length"
              class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              No hay elementos registrados
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <UModal
      v-model:open="isModalOpen"
      :title="isEditing ? `Editar ${title}` : `Añadir ${title}`"
      :description="isEditing ? `Modifica los datos del ${title.toLowerCase()}` : `Completa los campos para añadir un nuevo ${title.toLowerCase()}`"
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
                {{ isEditing ? `Editar ${title}` : `Añadir ${title}` }}
              </h3>
              <UButton
                color="neutral"
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
          >
            <UFormField
              v-for="column in columns.filter(col => col.id !== 'actions')"
              :key="column.id"
              :label="column.label"
              :name="column.id"
              :required="column.required"
            >
              <UInput
                v-model="formState[column.id]"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-3 pt-4">
              <UButton
                type="button"
                color="neutral"
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
                :disabled="!isFormValid || isSubmitting"
                @click="handleSubmit"
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
      description="¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer."
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
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="showDeleteConfirm = false"
              />
            </div>
          </template>

          <div class="text-gray-700 dark:text-gray-300">
            ¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
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
