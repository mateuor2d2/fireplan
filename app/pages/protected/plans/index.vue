<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Planes de Emergencia</h1>
      <UButton icon="i-heroicons-plus" @click="isOpen = true">Nuevo plan</UButton>
    </div>
    <UTable :rows="plans" :columns="columns">
      <template #status-data="{ row }">
        <UBadge :color="row.status === 'published' ? 'green' : row.status === 'draft' ? 'yellow' : 'gray'">{{ row.status }}</UBadge>
      </template>
    </UTable>
    <UModal v-model="isOpen">
      <template #header><h3 class="text-lg font-semibold">Nuevo Plan</h3></template>
      <template #body>
        <UForm :state="form" @submit="onSubmit">
          <UFormGroup label="Centro" name="centerId">
            <USelect v-model="form.centerId" :options="centerOptions" required />
          </UFormGroup>
          <UFormGroup label="Denominacion" name="denominacion">
            <UInput v-model="form.denominacion" />
          </UFormGroup>
          <UButton type="submit" block class="mt-4">Crear</UButton>
        </UForm>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const store = useFireplanStore()
const { centers, plans } = storeToRefs(store)
const isOpen = ref(false)
const form = reactive({ centerId: '', denominacion: '' })
const columns = [
  { key: 'datosIdentificativos.denominacion', label: 'Denominacion' },
  { key: 'version', label: 'Version' },
  { key: 'status', label: 'Estado' },
  { key: 'createdAt', label: 'Creado' }
]
const centerOptions = computed(() => centers.value.map(c => ({ label: c.name, value: c._id })))
onMounted(() => { store.fetchCenters(); store.fetchPlans() })
async function onSubmit() {
  await store.createPlan({
    centerId: form.centerId,
    datosIdentificativos: { denominacion: form.denominacion }
  })
  isOpen.value = false
  Object.assign(form, { centerId: '', denominacion: '' })
}
</script>
