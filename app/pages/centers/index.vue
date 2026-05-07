<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Centros de Trabajo</h1>
      <UButton
        icon="i-heroicons-plus"
        label="Nuevo Centro"
        to="/centers/new"
        color="primary"
      />
    </div>

    <div class="mb-4">
      <UInput
        v-model="search"
        placeholder="Buscar centros..."
        icon="i-heroicons-magnifying-glass"
        @keyup.enter="fetchCenters"
      />
    </div>

    <UTable
      :rows="centers"
      :columns="columns"
      :loading="loading"
    >
      <template #status-data="{ row }">
        <UBadge
          :color="row.status === 'active' ? 'green' : 'gray'"
          :label="row.status"
        />
      </template>

      <template #actions-data="{ row }">
        <div class="flex gap-2">
          <UButton
            icon="i-heroicons-eye"
            color="gray"
            variant="ghost"
            :to="`/centers/${row._id}`"
          />
          <UButton
            icon="i-heroicons-pencil"
            color="gray"
            variant="ghost"
            :to="`/centers/${row._id}/edit`"
          />
          <UButton
            icon="i-heroicons-trash"
            color="red"
            variant="ghost"
            @click="deleteCenter(row._id)"
          />
        </div>
      </template>
    </UTable>

    <div class="flex justify-center mt-4">
      <UPagination
        v-model="page"
        :total="total"
        :page-count="limit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()

const search = ref('')
const page = ref(1)
const limit = ref(20)
const loading = ref(false)
const centers = ref([])
const total = ref(0)

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'address', label: 'Dirección' },
  { key: 'activity', label: 'Actividad' },
  { key: 'sector', label: 'Sector' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: 'Acciones' }
]

async function fetchCenters() {
  loading.value = true
  try {
    const response = await $fetch('/api/v1/centers', {
      query: {
        page: page.value,
        limit: limit.value,
        search: search.value
      }
    })
    centers.value = response.data
    total.value = response.pagination.total
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

async function deleteCenter(id: string) {
  if (!confirm('¿Eliminar este centro?')) return
  try {
    await $fetch(`/api/v1/centers/${id}`, { method: 'DELETE' })
    toast.add({
      title: 'Éxito',
      description: 'Centro eliminado',
      color: 'green'
    })
    fetchCenters()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'red'
    })
  }
}

onMounted(fetchCenters)
watch(page, fetchCenters)
</script>
