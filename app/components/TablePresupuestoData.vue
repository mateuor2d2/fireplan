<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ConceptodePresupuesto } from '@/stores/presupuestos'

// Props
const props = defineProps<{
  items: ConceptodePresupuesto[]
  isLoading?: boolean
  isDefault?: boolean
  canEditDefault?: boolean
}>()

const emit = defineEmits(['create', 'update', 'delete'])

// Modal state
const isModalOpen = ref(false)
const currentItem = ref<ConceptodePresupuesto | null>(null)
const isEditing = ref(false)
const deleteModalOpen = ref(false)
const itemToDelete = ref<number | null>(null)

// Form state
const formState = reactive({
  id: null as number | null,
  concepto: '',
  tipo: '',
  ud: 1,
  precioud: 0,
  amortizacion: 100,
  total: 0
})

// Calculate total automatically
const calculatedTotal = computed(() => {
  return formState.ud * formState.precioud
})

// Available types for presupuesto items
const availableTypes = [
  'Protecciones Personales',
  'Protecciones Colectivas',
  'Señalizaciones',
  'Medicina Preventiva',
  'Instalaciones para el personal',
  'Extinción de incendios',
  'Primeros auxilios',
  'Formación y reuniones de obligado cumplimiento'
]

// Open create modal
function openCreateModal() {
  formState.id = null
  formState.concepto = ''
  formState.tipo = ''
  formState.ud = 1
  formState.precioud = 0
  formState.amortizacion = 100
  formState.total = 0
  isEditing.value = false
  isModalOpen.value = true
}

// Open edit modal
function openEditModal(item: ConceptodePresupuesto) {
  formState.id = item.id
  formState.concepto = item.concepto
  formState.tipo = item.tipo
  formState.ud = item.ud
  formState.precioud = item.precioud
  formState.amortizacion = item.amortizacion || 100
  formState.total = item.total
  isEditing.value = true
  isModalOpen.value = true
}

// Handle form submission
async function handleSubmit() {
  try {
    const itemData = {
      id: formState.id,
      concepto: formState.concepto,
      tipo: formState.tipo,
      ud: formState.ud,
      precioud: formState.precioud,
      amortizacion: formState.amortizacion,
      total: calculatedTotal.value
    }

    if (isEditing.value && itemData.id) {
      await emit('update', itemData)
    } else {
      await emit('create', itemData)
    }

    isModalOpen.value = false
  } catch (error) {
    console.error('Error saving item:', error)
  }
}

// Handle delete
function confirmDelete(id: number) {
  itemToDelete.value = id
  deleteModalOpen.value = true
}

async function handleDelete() {
  if (itemToDelete.value) {
    await emit('delete', itemToDelete.value)
    deleteModalOpen.value = false
  }
}

// Table columns
const columns = [
  {
    accessorKey: 'concepto',
    header: 'Concepto',
    cell: ({ row }) => row.original.concepto
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.tipo)
  },
  {
    accessorKey: 'ud',
    header: 'Unidades',
    cell: ({ row }) => row.original.ud
  },
  {
    accessorKey: 'precioud',
    header: 'Precio UD',
    cell: ({ row }) => `€${row.original.precioud.toFixed(2)}`
  },
  {
    accessorKey: 'amortizacion',
    header: 'Amortización',
    cell: ({ row }) => `${row.original.amortizacion || 100}%`
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => h('span', { class: 'font-semibold' }, `€${row.original.total.toFixed(2)}`)
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const canEdit = !props.isDefault || props.canEditDefault
      if (!canEdit) return null

      return h('div', { class: 'flex gap-2' }, [
        h(resolveComponent('UButton'), {
          icon: 'i-heroicons-pencil',
          size: 'xs',
          variant: 'ghost',
          onClick: () => openEditModal(row.original)
        }),
        h(resolveComponent('UButton'), {
          icon: 'i-heroicons-trash',
          size: 'xs',
          variant: 'ghost',
          color: 'error',
          onClick: () => confirmDelete(row.original.id!)
        })
      ])
    }
  }
]

// Filter items
const filteredItems = computed(() => props.items)
</script>

<template>
  <UCard class="overflow-hidden">
    <template #header>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 class="text-lg font-medium">
            Presupuesto
          </h3>
          <p
            v-if="!isLoading"
            class="text-sm text-gray-500 mt-1"
          >
            {{ items.length }} {{ items.length === 1 ? 'ítem' : 'ítems' }}
          </p>
          <USkeleton
            v-else
            class="h-4 w-32"
          />
        </div>
        <div class="flex gap-2">
          <UButton
            v-if="!isDefault || canEditDefault"
            color="primary"
            icon="i-heroicons-plus"
            :disabled="isLoading"
            label="Nuevo Ítem"
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
        No hay ítems
      </h3>
      <p class="mt-2 text-sm text-gray-500">
        Comienza agregando un nuevo ítem de presupuesto
      </p>
      <UButton
        v-if="!isDefault || canEditDefault"
        color="primary"
        variant="solid"
        icon="i-heroicons-plus"
        class="mt-4"
        @click="openCreateModal"
      >
        Agregar Ítem
      </UButton>
    </div>

    <!-- Table -->
    <UTable
      v-else
      :data="filteredItems"
      :columns="columns"
      class="w-full"
    />

    <!-- Create/Edit Modal -->
    <UModal
      v-model:open="isModalOpen"
      :title="isEditing ? 'Editar Ítem de Presupuesto' : 'Nuevo Ítem de Presupuesto'"
      :description="`${isEditing ? 'Actualizar' : 'Crear'} un ítem de presupuesto`"
      class="max-w-lg"
    >
      <template #body>
        <UForm
          :state="formState"
          class="w-full space-y-4"
          @submit="handleSubmit"
        >
          <!-- Concepto -->
          <UFormField
            label="Concepto"
            name="concepto"
            required
          >
            <UInput
              v-model="formState.concepto"
              placeholder="Ej: Casco de seguridad"
              icon="i-heroicons-tag"
            />
          </UFormField>

          <!-- Tipo -->
          <UFormField
            label="Tipo"
            name="tipo"
            required
          >
            <USelect
              v-model="formState.tipo"
              :items="availableTypes"
              placeholder="Seleccionar tipo"
              icon="i-heroicons-folder"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <!-- Unidades -->
            <UFormField
              label="Unidades"
              name="ud"
              required
            >
              <UInput
                v-model.number="formState.ud"
                type="number"
                min="1"
                placeholder="1"
                icon="i-heroicons-hashtag"
              />
            </UFormField>

            <!-- Precio por unidad -->
            <UFormField
              label="Precio por unidad (€)"
              name="precioud"
              required
            >
              <UInput
                v-model.number="formState.precioud"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                icon="i-heroicons-currency-euro"
              />
            </UFormField>
          </div>

          <!-- Amortización -->
          <UFormField
            label="Amortización (%)"
            name="amortizacion"
          >
            <UInput
              v-model.number="formState.amortizacion"
              type="number"
              min="0"
              max="100"
              placeholder="100"
              icon="i-heroicons-percent-badge"
            />
          </UFormField>

          <!-- Total (auto-calculated) -->
          <UFormField
            label="Total (€)"
            name="total"
          >
            <UInput
              :model-value="calculatedTotal.toFixed(2)"
              readonly
              disabled
              icon="i-heroicons-currency-euro"
              class="font-semibold"
            />
          </UFormField>
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
            Cancelar
          </UButton>
          <UButton
            color="primary"
            :loading="isLoading"
            icon="i-heroicons-check"
            @click="handleSubmit"
          >
            {{ isEditing ? 'Actualizar' : 'Crear' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Modal -->
    <UModal
      v-model:open="deleteModalOpen"
      title="Confirmar Eliminación"
      description="¿Estás seguro de que quieres eliminar este ítem? Esta acción no se puede deshacer."
    >
      <template #body>
        <div class="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div class="text-red-500 text-xl flex-shrink-0">
            ⚠️
          </div>
          <div>
            <p class="text-sm font-medium text-red-800 dark:text-red-200">
              Esta acción es permanente
            </p>
            <p class="text-sm text-red-600 dark:text-red-300">
              El ítem se eliminará permanentemente del sistema.
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
            Cancelar
          </UButton>
          <UButton
            color="error"
            :loading="isLoading"
            icon="i-heroicons-trash"
            @click="handleDelete"
          >
            Eliminar
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>
