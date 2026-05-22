<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Centros</h1>
      <UButton icon="i-heroicons-plus" @click="openCreate">Nuevo centro</UButton>
    </div>
    <UTable :rows="centers" :columns="columns">
      <template #name-data="{ row }">
        <NuxtLink :to="'/protected/centers/' + row._id" class="text-primary hover:underline">{{ row.name }}</NuxtLink>
      </template>
      <template #status-data="{ row }">
        <UBadge :color="row.status === 'active' ? 'green' : 'gray'">{{ row.status }}</UBadge>
      </template>
      <template #actions-data="{ row }">
        <div class="flex gap-2">
          <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" color="warning" @click="editCenter(row)" />
          <UButton size="xs" variant="ghost" icon="i-heroicons-trash" color="error" @click="deleteCenter(row._id)" />
        </div>
      </template>
    </UTable>
    <UModal v-model:open="modalOpen">
      <template #header><h3 class="text-lg font-semibold">{{ editing ? 'Editar' : 'Nuevo' }} Centro</h3></template>
      <template #body>
        <div class="space-y-3">
          <UInput v-model="form.name" placeholder="Nombre" required />
          <UInput v-model="form.activity" placeholder="Actividad" />
          <UInput v-model="form.sector" placeholder="Sector" />
          <UInput v-model="form.maxOccupancy" placeholder="Aforo max" type="number" />
          <USelect v-model="form.status" :options="['active', 'inactive']" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="modalOpen = false">Cancelar</UButton>
          <UButton color="primary" :loading="saving" @click="saveCenter">{{ editing ? 'Actualizar' : 'Guardar' }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "app" })
const store = useFireplanStore()
const { centers } = storeToRefs(store)
const toast = useToast()
const modalOpen = ref(false)
const editing = ref(false)
const saving = ref(false)
const currentId = ref('')
const form = reactive({ name: '', activity: '', sector: '', maxOccupancy: '', status: 'active' })
const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'activity', label: 'Actividad' },
  { key: 'sector', label: 'Sector' },
  { key: 'maxOccupancy', label: 'Aforo' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '' }
]
onMounted(() => store.fetchCenters())

function openCreate() {
  editing.value = false
  currentId.value = ''
  Object.assign(form, { name: '', activity: '', sector: '', maxOccupancy: '', status: 'active' })
  modalOpen.value = true
}

function editCenter(row: any) {
  editing.value = true
  currentId.value = row._id
  Object.assign(form, {
    name: row.name || '', activity: row.activity || '', sector: row.sector || '',
    maxOccupancy: row.maxOccupancy?.toString() || '', status: row.status || 'active'
  })
  modalOpen.value = true
}

async function saveCenter() {
  saving.value = true
  try {
    const payload = {
      name: form.name, activity: form.activity, sector: form.sector,
      maxOccupancy: parseInt(form.maxOccupancy) || undefined, status: form.status
    }
    if (editing.value) {
      await $fetch(`/api/v1/centers/${currentId.value}`, { method: 'PATCH', body: payload })
      toast.add({ title: 'Centro actualizado', color: 'success' })
    } else {
      await store.createCenter(payload)
      toast.add({ title: 'Centro creado', color: 'success' })
    }
    modalOpen.value = false
    await store.fetchCenters()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
  finally { saving.value = false }
}

async function deleteCenter(id: string) {
  if (!confirm('Eliminar este centro?')) return
  try {
    await $fetch(`/api/v1/centers/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Centro eliminado', color: 'success' })
    await store.fetchCenters()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
}
</script>
