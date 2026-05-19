<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Centros</h1>
      <UButton icon="i-heroicons-plus" @click="isOpen = true">Nuevo centro</UButton>
    </div>
    <UTable :rows="centers" :columns="columns">
      <template #name-data="{ row }">
        <NuxtLink :to="'/protected/centers/' + row._id" class="text-primary hover:underline">{{ row.name }}</NuxtLink>
      </template>
      <template #status-data="{ row }">
        <UBadge :color="row.status === 'active' ? 'green' : 'gray'">{{ row.status }}</UBadge>
      </template>
    </UTable>
    <UModal v-model="isOpen">
      <template #header><h3 class="text-lg font-semibold">Nuevo Centro</h3></template>
      <template #body>
        <UForm :state="form" @submit="onSubmit">
          <UFormGroup label="Nombre" name="name"><UInput v-model="form.name" required /></UFormGroup>
          <UFormGroup label="Actividad" name="activity"><UInput v-model="form.activity" /></UFormGroup>
          <UFormGroup label="Sector" name="sector"><UInput v-model="form.sector" /></UFormGroup>
          <UFormGroup label="Aforo max" name="maxOccupancy"><UInput v-model="form.maxOccupancy" type="number" /></UFormGroup>
          <UButton type="submit" block class="mt-4">Crear</UButton>
        </UForm>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const store = useFireplanStore()
const { centers } = storeToRefs(store)
const isOpen = ref(false)
const form = reactive({ name: '', activity: '', sector: '', maxOccupancy: '' })
const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'activity', label: 'Actividad' },
  { key: 'sector', label: 'Sector' },
  { key: 'maxOccupancy', label: 'Aforo' },
  { key: 'status', label: 'Estado' }
]
onMounted(() => store.fetchCenters())
async function onSubmit() {
  await store.createCenter({
    name: form.name, activity: form.activity, sector: form.sector,
    maxOccupancy: parseInt(form.maxOccupancy) || undefined
  })
  isOpen.value = false
  Object.assign(form, { name: '', activity: '', sector: '', maxOccupancy: '' })
}
</script>
