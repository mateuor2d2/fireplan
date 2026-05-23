<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Incidentes</h1>
      <UButton icon="i-heroicons-plus" @click="openCreate">Nuevo incidente</UButton>
    </div>
    <UTable :rows="incidents" :columns="columns">
      <template #severity-data="{ row }">
        <UBadge :color="row.severity === 'critico' ? 'red' : row.severity === 'grave' ? 'orange' : row.severity === 'moderado' ? 'yellow' : 'green'">{{ row.severity }}</UBadge>
      </template>
      <template #status-data="{ row }">
        <UBadge :color="row.status === 'open' ? 'red' : row.status === 'in_progress' ? 'yellow' : 'green'">{{ row.status }}</UBadge>
      </template>
      <template #actions-data="{ row }">
        <div class="flex gap-2">
          <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" color="warning" @click="editIncident(row)" />
          <UButton size="xs" variant="ghost" icon="i-heroicons-trash" color="error" @click="deleteIncident(row._id)" />
            <UButton size="xs" variant="ghost" icon="i-heroicons-eye" :to="'/protected/incidents/' + row._id" />
        </div>
      </template>
    </UTable>
    <UModal v-model:open="modalOpen">
      <template #header><h3 class="text-lg font-semibold">{{ editing ? 'Editar' : 'Nuevo' }} Incidente</h3></template>
      <template #body>
        <div class="space-y-3">
          <USelectMenu v-model="form.centerId" :items="centerOptions" value-key="value" label-key="label" placeholder="Centro" />
          <UInput v-model="form.title" placeholder="Titulo" />
          <USelect v-model="form.type" :options="['real','simulacro','prueba']" />
          <UInput v-model="form.category" placeholder="Categoria" />
          <USelect v-model="form.severity" :options="['leve','moderado','grave','critico']" />
          <UInput v-model="form.zone" placeholder="Zona" />
          <USelect v-model="form.status" :options="['open','in_progress','resolved','closed']" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="modalOpen = false">Cancelar</UButton>
          <UButton color="primary" :loading="saving" @click="saveIncident">{{ editing ? 'Actualizar' : 'Guardar' }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "app" })
const store = useFireplanStore()
const { centers, incidents } = storeToRefs(store)
const toast = useToast()
const modalOpen = ref(false)
const editing = ref(false)
const saving = ref(false)
const currentId = ref('')
const form = reactive({ centerId: '', title: '', type: 'real', category: '', severity: 'leve', zone: '', status: 'open' })
const columns = [
  { key: 'code', label: 'Codigo' },
  { key: 'title', label: 'Titulo' },
  { key: 'type', label: 'Tipo' },
  { key: 'category', label: 'Categoria' },
  { key: 'severity', label: 'Severidad' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '' }
]
const centerOptions = computed(() => centers.value.map(c => ({ label: c.name, value: c._id })))
onMounted(() => { store.fetchCenters(); store.fetchIncidents() })

function openCreate() {
  editing.value = false
  currentId.value = ''
  Object.assign(form, { centerId: '', title: '', type: 'real', category: '', severity: 'leve', zone: '', status: 'open' })
  modalOpen.value = true
}

function editIncident(row: any) {
  editing.value = true
  currentId.value = row._id
  Object.assign(form, {
    centerId: row.centerId || '', title: row.title || '', type: row.type || 'real',
    category: row.category || '', severity: row.severity || 'leve', zone: row.location?.zone || '', status: row.status || 'open'
  })
  modalOpen.value = true
}

async function saveIncident() {
  saving.value = true
  try {
    const payload = {
      centerId: form.centerId, title: form.title, type: form.type,
      category: form.category, severity: form.severity,
      location: { zone: form.zone }, status: form.status
    }
    if (editing.value) {
      await $fetch(`/api/v1/incidents/${currentId.value}`, { method: 'PATCH', body: payload })
      toast.add({ title: 'Incidente actualizado', color: 'success' })
    } else {
      await store.createIncident({ ...payload, detectedAt: new Date(), startedAt: new Date() })
      toast.add({ title: 'Incidente creado', color: 'success' })
    }
    modalOpen.value = false
    await store.fetchIncidents()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
  finally { saving.value = false }
}

async function deleteIncident(id: string) {
  if (!confirm('Eliminar este incidente?')) return
  try {
    await $fetch(`/api/v1/incidents/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Incidente eliminado', color: 'success' })
    await store.fetchIncidents()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
}
</script>
