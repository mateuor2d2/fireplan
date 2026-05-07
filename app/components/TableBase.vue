<script lang="ts" setup>
import type { MasterTableItem, MasterTableType } from '~/stores/masterTables'
import { useMasterTablesStore } from '~/stores/masterTables'

const props = defineProps<{
  title: string
  tableType: MasterTableType
  loading?: boolean
}>()

const emit = defineEmits(['update'])
const masterTablesStore = useMasterTablesStore()

// Initialize the table when component mounts
onMounted(async () => {
  await masterTablesStore.setCurrentTable(props.tableType)
})

// Get current table data
const currentTable = computed(() => masterTablesStore.getCurrentTable)
const items = computed(() => currentTable.value?.user || [])
const columns = computed(() => {
  const baseColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'description', label: 'Descripción', sortable: true },
    { key: 'isActive', label: 'Activo' },
    { key: 'actions', label: 'Acciones' }
  ] as any[]
  return baseColumns
})

// Modal state
const isModalOpen = ref(false)
const isEditing = ref(false)
const currentItem = ref<MasterTableItem | null>(null)
const showDeleteConfirm = ref(false)
const itemToDelete = ref<MasterTableItem | null>(null)
const isSubmitting = ref(false)

// Form state
const formState = reactive({
  id: 0,
  description: '',
  isActive: true
})

// Actions for dropdown menu
const actions = (row: MasterTableItem) => [
  [
    {
      label: 'Editar',
      icon: 'i-heroicons-pencil-square-20-solid',
      click: () => openEditModal(row)
    }
  ],
  [
    {
      label: 'Borrar',
      icon: 'i-heroicons-trash',
      click: () => confirmDelete(row)
    }
  ]
]

// Modal functions
function openCreateModal() {
  isEditing.value = false
  resetForm()
  isModalOpen.value = true
}

function openEditModal(item: MasterTableItem) {
  isEditing.value = true
  currentItem.value = item
  Object.assign(formState, {
    id: item.id,
    description: item.description,
    isActive: item.isActive ?? true
  })
  isModalOpen.value = true
}

function resetForm() {
  Object.assign(formState, {
    id: 0,
    description: '',
    isActive: true
  })
  currentItem.value = null
}

function confirmDelete(item: MasterTableItem) {
  itemToDelete.value = item
  showDeleteConfirm.value = true
}

// CRUD operations
async function handleSubmit() {
  isSubmitting.value = true
  try {
    if (isEditing.value && currentItem.value?._id) {
      await masterTablesStore.updateItem(props.tableType, currentItem.value._id, {
        id: formState.id,
        description: formState.description,
        isActive: formState.isActive
      })
    } else {
      await masterTablesStore.createItem(props.tableType, {
        id: formState.id,
        description: formState.description,
        isActive: formState.isActive
      })
    }
    isModalOpen.value = false
    resetForm()
    emit('update')
  } catch (error) {
    console.error('Error saving item:', error)
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete() {
  if (!itemToDelete.value?._id) return

  isSubmitting.value = true
  try {
    await masterTablesStore.deleteItem(props.tableType, itemToDelete.value._id)
    showDeleteConfirm.value = false
    itemToDelete.value = null
    emit('update')
  } catch (error) {
    console.error('Error deleting item:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Validation
const validate = (state: any) => {
  const errors = []
  if (!state.description) errors.push({ path: 'description', message: 'La descripción es requerida' })
  if (!state.id) errors.push({ path: 'id', message: 'El ID es requerido' })
  return errors
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold leading-6 text-gray-900">
          {{ title }}
        </h3>
        <UButton
          icon="i-heroicons-plus"
          size="sm"
          color="primary"
          variant="solid"
          label="Añadir"
          :trailing="false"
          @click="openCreateModal"
        />
      </div>
    </template>
    <UTable
      :columns="columns"
      :rows="items"
      :loading="loading || masterTablesStore.isLoading"
    >
      <template #actions-data="{ row }">
        <ClientOnly>
          <UDropdownMenu :items="actions(row)">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-ellipsis-horizontal-20-solid"
            />
          </UDropdownMenu>
        </ClientOnly>
      </template>
      <template #isActive-data="{ row }">
        <UBadge
          :color="(row as any).isActive ? 'success' : 'error'"
          variant="subtle"
        >
          {{ (row as any).isActive ? 'Activo' : 'Inactivo' }}
        </UBadge>
      </template>
    </UTable>
  </UCard>

  <!-- Create/Edit Modal -->
  <UModal v-model="isModalOpen">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900">
            {{ isEditing ? "Editar" : "Añadir" }} {{ title }}
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
        @submit="handleSubmit"
      >
        <div class="space-y-4">
          <UFormField
            label="ID"
            name="id"
          >
            <UInput
              v-model="formState.id"
              type="number"
              placeholder="ID único"
              :disabled="isEditing"
            />
          </UFormField>

          <UFormField
            label="Descripción"
            name="description"
          >
            <UTextarea
              v-model="formState.description"
              placeholder="Descripción del elemento"
              rows="3"
            />
          </UFormField>

          <UFormField
            label="Estado"
            name="isActive"
          >
            <USwitch v-model="formState.isActive" />
            <span class="ml-2 text-sm text-gray-600">
              {{ formState.isActive ? 'Activo' : 'Inactivo' }}
            </span>
          </UFormField>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="neutral"
              variant="outline"
              :disabled="isSubmitting"
              @click="isModalOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="isSubmitting"
            >
              {{ isEditing ? "Guardar" : "Crear" }}
            </UButton>
          </div>
        </template>
      </UForm>
    </UCard>
  </UModal>

  <!-- Delete Confirmation Modal -->
  <UModal v-model="showDeleteConfirm">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900">
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

      <div class="py-4">
        <p class="text-sm text-gray-600">
          ¿Estás seguro de que quieres eliminar "{{ itemToDelete?.description }}"?
          Esta acción no se puede deshacer.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="isSubmitting"
            @click="showDeleteConfirm = false"
          >
            Cancelar
          </UButton>
          <UButton
            color="error"
            :loading="isSubmitting"
            @click="handleDelete"
          >
            Eliminar
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
