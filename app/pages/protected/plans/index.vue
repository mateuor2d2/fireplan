<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Planes de Emergencia</h1>
      <UButton icon="i-heroicons-plus" @click="openCreate">Nuevo plan</UButton>
    </div>
    <UTable :rows="plans" :columns="columns">
      <template #status-cell="{ row }">
        <UBadge :color="row.status === 'published' ? 'green' : row.status === 'draft' ? 'yellow' : 'gray'">{{ row.status }}</UBadge>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex gap-2">
          <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" color="warning" @click="editPlan(row)" />
          <UButton size="xs" variant="ghost" icon="i-heroicons-trash" color="error" @click="deletePlan(row._id)" />
          <UButton size="xs" variant="ghost" icon="i-heroicons-eye" :to="'/protected/plans/' + row._id" />
        </div>
      </template>
    </UTable>
    <UModal v-model:open="modalOpen">
      <template #header><h3 class="text-lg font-semibold">{{ editing ? 'Editar' : 'Nuevo' }} Plan</h3></template>
      <template #body>
        <div class="space-y-3">
          <USelectMenu v-model="form.centerId" :items="centerOptions" value-key="value" label-key="label" placeholder="Centro" />
          <UInput v-model="form.denominacion" placeholder="Denominacion" />
          <USelect v-model="form.status" :items="['draft', 'published', 'archived']" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="modalOpen = false">Cancelar</UButton>
          <UButton color="primary" :loading="saving" @click="savePlan">{{ editing ? 'Actualizar' : 'Guardar' }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "app" })
const store = useFireplanStore()
const { centers, plans } = storeToRefs(store)
const toast = useToast()
const modalOpen = ref(false)
const editing = ref(false)
const saving = ref(false)
const currentId = ref('')
const form = reactive({ centerId: '', denominacion: '', status: 'draft' })
const columns = [
  { accessorKey: 'datosIdentificativos.denominacion', header: 'Denominacion' },
  { accessorKey: 'version', header: 'Version' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'createdAt', header: 'Creado' },
  { accessorKey: 'actions', header: 'Acciones' },
      { accessorKey: 'view', header: 'Ver' }
]
const centerOptions = computed(() => centers.value.map(c => ({ header: c.name, value: c._id })))
onMounted(() => { store.fetchCenters(); store.fetchPlans() })

function openCreate() {
  editing.value = false
  currentId.value = ''
  Object.assign(form, { centerId: '', denominacion: '', status: 'draft' })
  modalOpen.value = true
}

function editPlan(row: any) {
  editing.value = true
  currentId.value = row._id
  Object.assign(form, {
    centerId: row.centerId || '',
    denominacion: row.datosIdentificativos?.denominacion || '',
    status: row.status || 'draft'
  })
  modalOpen.value = true
}

async function savePlan() {
  saving.value = true
  try {
    const payload = {
      centerId: form.centerId,
      datosIdentificativos: { denominacion: form.denominacion },
      status: form.status
    }
    if (editing.value) {
      await $fetch(`/api/v1/plans/${currentId.value}`, { method: 'PATCH', body: payload })
      toast.add({ title: 'Plan actualizado', color: 'success' })
    } else {
      await store.createPlan(payload)
      toast.add({ title: 'Plan creado', color: 'success' })
    }
    modalOpen.value = false
    await store.fetchPlans()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
  finally { saving.value = false }
}

async function deletePlan(id: string) {
  if (!confirm('Eliminar este plan?')) return
  try {
    await $fetch(`/api/v1/plans/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Plan eliminado', color: 'success' })
    await store.fetchPlans()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
}
</script>
