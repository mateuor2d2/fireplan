<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Incidentes</h1>
      <UButton icon="i-heroicons-plus" @click="isOpen = true">Nuevo incidente</UButton>
    </div>
    <UTable :rows="incidents" :columns="columns">
      <template #severity-data="{ row }">
        <UBadge :color="row.severity === 'critico' ? 'red' : row.severity === 'grave' ? 'orange' : row.severity === 'moderado' ? 'yellow' : 'green'">{{ row.severity }}</UBadge>
      </template>
      <template #status-data="{ row }">
        <UBadge :color="row.status === 'open' ? 'red' : row.status === 'in_progress' ? 'yellow' : 'green'">{{ row.status }}</UBadge>
      </template>
    </UTable>
    <UModal v-model="isOpen">
      <template #header><h3 class="text-lg font-semibold">Nuevo Incidente</h3></template>
      <template #body>
        <UForm :state="form" @submit="onSubmit">
          <UFormGroup label="Centro" name="centerId">
            <USelect v-model="form.centerId" :options="centerOptions" required />
          </UFormGroup>
          <UFormGroup label="Titulo" name="title"><UInput v-model="form.title" required /></UFormGroup>
          <UFormGroup label="Tipo" name="type">
            <USelect v-model="form.type" :options="['real','simulacro','prueba']" required />
          </UFormGroup>
          <UFormGroup label="Categoria" name="category"><UInput v-model="form.category" required /></UFormGroup>
          <UFormGroup label="Severidad" name="severity">
            <USelect v-model="form.severity" :options="['leve','moderado','grave','critico']" required />
          </UFormGroup>
          <UFormGroup label="Zona" name="zone"><UInput v-model="form.zone" required /></UFormGroup>
          <UButton type="submit" block class="mt-4">Crear</UButton>
        </UForm>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const store = useFireplanStore()
const { centers, incidents } = storeToRefs(store)
const isOpen = ref(false)
const form = reactive({ centerId: '', title: '', type: 'real', category: '', severity: 'leve', zone: '' })
const columns = [
  { key: 'code', label: 'Codigo' },
  { key: 'title', label: 'Titulo' },
  { key: 'type', label: 'Tipo' },
  { key: 'category', label: 'Categoria' },
  { key: 'severity', label: 'Severidad' },
  { key: 'status', label: 'Estado' }
]
const centerOptions = computed(() => centers.value.map(c => ({ label: c.name, value: c._id })))
onMounted(() => { store.fetchCenters(); store.fetchIncidents() })
async function onSubmit() {
  await store.createIncident({
    centerId: form.centerId, title: form.title, type: form.type,
    category: form.category, severity: form.severity,
    location: { zone: form.zone }, detectedAt: new Date(), startedAt: new Date()
  })
  isOpen.value = false
  Object.assign(form, { centerId: '', title: '', type: 'real', category: '', severity: 'leve', zone: '' })
}
</script>
