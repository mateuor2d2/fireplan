<script setup lang="ts">
import { h, ref, computed, onMounted, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useLoading } from '~/composables/useLoading'
import type { MasterTableItem, MasterTableType } from '~/stores/masterTables'
import { useMasterTablesStore } from '~/stores/masterTables'

// Composable
const { withLoading } = useLoading()

// Import UI components
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const USwitch = resolveComponent('USwitch')
const UForm = resolveComponent('UForm')
const UFormField = resolveComponent('UFormField')
const UInput = resolveComponent('UInput')
const UModal = resolveComponent('UModal')
const UPagination = resolveComponent('UPagination')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const router = useRouter()
const route = useRoute()

// Search and pagination state
const searchQuery = ref('')
const isLoading = ref(false)
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchField = ref('description')
const showSearchOptions = ref(false)

// Modal state
const isModalOpen = ref(false)
const currentItem = ref<MasterTableItem | null>(null)
const isEditing = ref(false)
const deleteModalOpen = ref(false)
const itemToDelete = ref<string | null>(null)

// Form refs for validation
const formRef = ref(null)

// Search field definitions
interface SearchField {
  label: string
  name: string
  icon: string
}

const searchFields = computed<SearchField[]>(() => [
  { label: 'Description', name: 'description', icon: 'i-lucide-search' },
  { label: 'ID', name: 'id', icon: 'i-lucide-hash' }
])

// Handle search field change
function onSearchFieldChange(field: string) {
  searchField.value = field
  performSearch()
}

// Perform search with debounce
let searchTimeout: NodeJS.Timeout
function performSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 300)
}

const props = withDefaults(defineProps<{
  tableType: string
  items: MasterTableItem[]
  isLoading?: boolean
  totalItems?: number
  currentPage?: number
  pageSize?: number
  defaultItems?: MasterTableItem[]
  canEditDefault?: boolean
  isDefault?: boolean
  columns?: TableColumn<MasterTableItem>[]
}>(), {
  isLoading: false,
  totalItems: 0,
  currentPage: 1,
  pageSize: 10,
  defaultItems: () => [],
  canEditDefault: false,
  isDefault: false,
  columns: () => []
})

const emit = defineEmits(['create', 'update', 'delete', 'fetch', 'page-change', 'reset'])

// Fetch data when component is mounted or when page changes
onMounted(() => {
  fetchData()
})

// Watch for route changes
watch(() => route.query, () => {
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page as string, 10)
  }
  fetchData()
}, { immediate: true })

// Watch for items prop changes to update filtered items
watch(() => props.items, () => {
  // This will trigger reactivity when items change
  console.log('Items updated:', props.items)
}, { deep: true })

// Fetch data with loading state
async function fetchData() {
  await withLoading(async () => {
    try {
      isLoading.value = true
      await emit('fetch', {
        page: currentPage.value,
        pageSize: pageSize.value,
        search: searchQuery.value,
        searchField: searchField.value
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.add({
        title: 'Error',
        description: 'Failed to fetch data',
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
    } finally {
      isLoading.value = false
    }
  })
}

// Handle page change
function handlePageChange(page: number) {
  currentPage.value = page
  router.push({ query: { ...route.query, page } })
}

// Computed properties for form bindings
const formId = computed({
  get: () => currentItem.value?.id || 0,
  set: (value: number) => {
    if (currentItem.value) {
      currentItem.value.id = value
    }
  }
})

const formDescription = computed({
  get: () => currentItem.value?.description || '',
  set: (value: string) => {
    if (currentItem.value) {
      currentItem.value.description = value
    }
  }
})

const formIsActive = computed({
  get: () => currentItem.value?.isActive ?? true,
  set: (value: boolean) => {
    if (currentItem.value) {
      currentItem.value.isActive = value
    }
  }
})

const formIsDefault = computed({
  get: () => currentItem.value?.isDefault ?? false,
  set: (value: boolean) => {
    if (currentItem.value) {
      currentItem.value.isDefault = value
    }
  }
})

const formCreatedBy = computed({
  get: () => currentItem.value?.createdBy || '',
  set: (value: string) => {
    if (currentItem.value) {
      currentItem.value.createdBy = value
    }
  }
})

const formUpdatedBy = computed({
  get: () => currentItem.value?.updatedBy || '',
  set: (value: string) => {
    if (currentItem.value) {
      currentItem.value.updatedBy = value
    }
  }
})

const formMguser = computed({
  get: () => currentItem.value?.mguser || '',
  set: (value: string) => {
    if (currentItem.value) {
      currentItem.value.mguser = value
    }
  }
})

// Date fields - for display only
const formCreatedAt = computed(() => currentItem.value?.createdAt ? new Date(currentItem.value.createdAt).toLocaleString() : '-')
const formUpdatedAt = computed(() => currentItem.value?.updatedAt ? new Date(currentItem.value.updatedAt).toLocaleString() : '-')

// Modal management
function openCreateModal() {
  currentItem.value = {
    id: Math.max(0, ...props.items.map(i => i.id || 0)) + 1,
    description: '',
    isActive: true
  } as MasterTableItem
  isEditing.value = false
  isModalOpen.value = true
}

function openEditModal(item: MasterTableItem) {
  console.log('openEditModal called with:', item)
  currentItem.value = { ...item }
  isEditing.value = true
  isModalOpen.value = true
  console.log('Modal state set:', { isEditing: isEditing.value, isModalOpen: isModalOpen.value })
}

async function handleSubmit() {
  if (!currentItem.value) return

  try {
    if (isEditing.value) {
      await emit('update', currentItem.value)
      toast.add({
        title: 'Success',
        description: 'Item updated successfully',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })
    } else {
      await emit('create', currentItem.value)
      toast.add({
        title: 'Success',
        description: 'Item created successfully',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })
    }
    isModalOpen.value = false
    fetchData()
  } catch (error) {
    console.error('Error saving item:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to save item',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

function confirmDelete(id: string) {
  itemToDelete.value = id
  deleteModalOpen.value = true
}

async function onDelete() {
  if (!itemToDelete.value) return

  try {
    await emit('delete', itemToDelete.value)
    deleteModalOpen.value = false
    toast.add({
      title: 'Success',
      description: 'Item deleted successfully',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    fetchData()
  } catch (error) {
    console.error('Error deleting item:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete item',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    itemToDelete.value = null
  }
}

// Filter items based on search query
const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items

  const query = searchQuery.value.toLowerCase()
  return props.items.filter(item =>
    String(item[searchField.value as keyof MasterTableItem] || '').toLowerCase().includes(query)
  )
})

// Table columns
const masterTableStore = useMasterTablesStore()

const columns = computed<TableColumn<MasterTableItem>[]>(() => {
  if (!props.items.length) return []

  // Get columns from the store
  const storeColumns = masterTableStore.getTableColumns(props.tableType as MasterTableType)

  const baseColumns: TableColumn<MasterTableItem>[] = [
    // ID column with custom rendering
    {
      accessorKey: 'id',
      header: storeColumns.find(col => col.id === 'id')?.label || 'ID',
      cell: ({ row }) => h('div', { class: 'font-mono text-xs' }, row.original.id)
    },
    // Description column
    {
      accessorKey: 'description',
      header: storeColumns.find(col => col.id === 'description')?.label || 'Description'
    },
    // isActive column with custom badge
    {
      accessorKey: 'isActive',
      header: storeColumns.find(col => col.id === 'isActive')?.label || 'Status',
      cell: ({ row }) => {
        const isActive = row.original.isActive !== false
        return h(UBadge, {
          color: isActive ? 'success' : 'neutral',
          variant: 'subtle',
          size: 'sm',
          label: isActive ? 'Active' : 'Inactive',
          icon: isActive ? 'i-lucide-check-circle' : 'i-lucide-x-circle'
        })
      }
    },
    // Optional date columns from store
    ...storeColumns
      .filter(col => ['createdAt', 'updatedAt'].includes(col.id))
      .map(col => ({
        accessorKey: col.id,
        header: col.label,
        cell: ({ row }: { row: any }) => {
          const date = row.original[col.id]
          return date ? new Date(date).toLocaleDateString() : '-'
        }
      })),
    // Actions column
    {
      id: 'actions',
      cell: ({ row }) => {
        // Check if we can edit this item
        const canEdit = !props.isDefault || props.canEditDefault

        if (!canEdit) return null

        return h(UDropdownMenu, {
          items: getRowItems(row.original),
          ui: { button: { variant: 'ghost', color: 'neutral' } }
        }, {
          default: () => h(UButton, {
            icon: 'i-lucide-more-horizontal',
            color: 'gray',
            variant: 'ghost',
            padded: false
          })
        })
      }
    }
  ]

  return baseColumns
})

function getRowItems(row: MasterTableItem) {
  return [
    {
      label: 'Edit',
      icon: 'i-lucide-edit',
      onSelect() {
        console.log('Edit clicked for item:', row)
        openEditModal(row)
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash-2',
      onSelect() {
        console.log('Delete clicked for item:', row)
        confirmDelete(String(row.id))
      }
    }
  ]
}
</script>

<template>
  <UCard class="overflow-hidden">
    <template #header>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 class="text-lg font-medium">
            {{ tableType }}
          </h3>
          <p
            v-if="!isLoading"
            class="text-sm text-gray-500 mt-1"
          >
            {{ totalItems }} {{ totalItems === 1 ? 'item' : 'items' }}
          </p>
          <USkeleton
            v-else
            class="h-4 w-32"
          />
        </div>
        <div class="flex flex-wrap gap-2 w-full sm:w-auto">
          <UInput
            v-model="searchQuery"
            placeholder="Search..."
            icon="i-heroicons-magnifying-glass"
            class="flex-1 min-w-[200px]"
          />

          <UButton
            color="primary"
            icon="i-heroicons-plus"
            :disabled="isLoading"
            label="Add Item"
            @click="openCreateModal"
          />
        </div>
      </div>
    </template>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex justify-center py-8"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="h-6 w-6 animate-spin"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!filteredItems.length"
      class="py-8 text-center"
    >
      <UIcon
        name="i-heroicons-inbox"
        class="h-12 w-12 mx-auto text-gray-400"
      />
      <h3 class="mt-4 text-lg font-medium">
        {{ searchQuery ? 'No results found' : 'No items' }}
      </h3>
      <p class="mt-2 text-sm text-gray-500">
        {{ searchQuery ? 'No items match your search.' : 'Get started by adding a new item.' }}
      </p>
      <UButton
        v-if="!searchQuery"
        color="primary"
        variant="solid"
        icon="i-heroicons-plus"
        class="mt-4"
        @click="openCreateModal"
      >
        Add Item
      </UButton>
    </div>

    <!-- Table -->
    <UTable
      v-else
      :data="filteredItems"
      :columns="columns"
      class="w-full"
    />

    <!-- Pagination -->
    <div
      v-if="totalItems > pageSize"
      class="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-800"
    >
      <div class="text-sm text-gray-500">
        Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to
        <span class="font-medium">{{ Math.min(currentPage * pageSize, totalItems) }}</span> of
        <span class="font-medium">{{ totalItems }}</span> results
      </div>

      <UPagination
        v-model="currentPage"
        :page-count="pageSize"
        :total="totalItems"
        :ui="{
          wrapper: 'flex items-center gap-1',
          rounded: '!rounded-full min-w-[32px] justify-center',
          default: {
            activeButton: {
              variant: 'solid'
            }
          }
        }"
        @update:model-value="handlePageChange"
      />
    </div>
  </UCard>

  <!-- Create/Edit Modal -->
  <UModal
    v-model:open="isModalOpen"
    :title="isEditing ? 'Edit Item' : 'Add New Item'"
    :description="`${isEditing ? 'Update' : 'Create'} a new ${tableType.toLowerCase()} item`"
    class="max-w-md"
  >
    <template #title>
      <h3 class="text-lg font-medium">
        {{ isEditing ? 'Edit Item' : 'Add New Item' }}
      </h3>
    </template>
    <template #body>
      <UForm
        ref="formRef"
        :state="currentItem"
        class="w-full space-y-4"
        @submit="handleSubmit"
      >
        <!-- ID Field -->
        <UFormField
          label="ID"
          name="id"
          required
        >
          <UInput
            v-model.number="formId"
            type="number"
            placeholder="Enter ID"
          />
        </UFormField>

        <!-- Description Field -->
        <UFormField
          label="Description"
          name="description"
          required
        >
          <UInput
            v-model="formDescription"
            placeholder="Enter description"
          />
        </UFormField>

        <!-- Is Active Toggle -->
        <UFormField
          label="Status"
          name="isActive"
          description="Toggle to activate or deactivate this item"
        >
          <USwitch v-model="formIsActive" />
        </UFormField>

        <!-- Is Default Toggle -->
        <UFormField
          v-if="props.canEditDefault"
          label="Default"
          name="isDefault"
          description="Toggle to set as default item"
        >
          <USwitch v-model="formIsDefault" />
        </UFormField>

        <!-- Read-only fields when editing -->
        <template v-if="isEditing">
          <!-- Created At (read-only) -->
          <UFormField
            label="Created At"
            name="createdAt"
          >
            <UInput
              :model-value="formCreatedAt"
              readonly
              disabled
            />
          </UFormField>

          <!-- Updated At (read-only) -->
          <UFormField
            label="Updated At"
            name="updatedAt"
          >
            <UInput
              :model-value="formUpdatedAt"
              readonly
              disabled
            />
          </UFormField>

          <!-- Created By -->
          <UFormField
            label="Created By"
            name="createdBy"
          >
            <UInput
              v-model="formCreatedBy"
              :readonly="!props.canEditDefault"
              :disabled="!props.canEditDefault"
            />
          </UFormField>

          <!-- Updated By -->
          <UFormField
            label="Updated By"
            name="updatedBy"
          >
            <UInput
              v-model="formUpdatedBy"
              :readonly="!props.canEditDefault"
              :disabled="!props.canEditDefault"
            />
          </UFormField>

          <!-- User ID -->
          <UFormField
            v-if="props.canEditDefault"
            label="User ID"
            name="mguser"
          >
            <UInput v-model="formMguser" />
          </UFormField>
        </template>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="isLoading"
          @click="isModalOpen = false"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          :loading="isLoading"
          icon="i-lucide-check"
          @click="handleSubmit"
        >
          {{ isEditing ? 'Update' : 'Create' }}
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Delete Modal -->
  <UModal
    v-model:open="deleteModalOpen"
    title="Confirm Deletion"
    description="Are you sure you want to delete this item? This action cannot be undone."
  >
    <template #header>
      <h3 class="text-lg font-medium">
        Confirm Deletion
      </h3>
    </template>
    <template #body>
      <div class="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div class="text-red-500 text-xl flex-shrink-0">
          ⚠️
        </div>
        <div>
          <p class="text-sm font-medium text-red-800 dark:text-red-200">
            This action is permanent
          </p>
          <p class="text-sm text-red-600 dark:text-red-300">
            The item will be permanently removed from the system.
          </p>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="isLoading"
          @click="deleteModalOpen = false"
        >
          Cancel
        </UButton>
        <UButton
          color="error"
          :loading="isLoading"
          icon="i-lucide-trash-2"
          @click="onDelete"
        >
          Delete
        </UButton>
      </div>
    </template>
  </UModal>
</template>
