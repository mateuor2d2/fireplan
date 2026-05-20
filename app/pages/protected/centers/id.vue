<template>
  <div class="p-6">
    <UButton icon="i-heroicons-arrow-left" variant="ghost" @click="$router.back()" class="mb-4">Volver</UButton>
    <div v-if="center">
      <h1 class="text-2xl font-bold mb-2">{{ center.name }}</h1>
      <UBadge :color="center.status === 'active' ? 'green' : 'gray'" class="mb-4">{{ center.status }}</UBadge>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UCard>
          <template #header><span class="font-semibold">Informacion</span></template>
          <p><strong>Actividad:</strong> {{ center.activity || 'N/A' }}</p>
          <p><strong>Sector:</strong> {{ center.sector || 'N/A' }}</p>
          <p><strong>Aforo:</strong> {{ center.maxOccupancy || 'N/A' }}</p>
        </UCard>
        <UCard>
          <template #header><span class="font-semibold">Direccion</span></template>
          <p>{{ center.address?.street || 'N/A' }}</p>
          <p>{{ center.address?.city || 'N/A' }} {{ center.address?.postalCode || '' }}</p>
        </UCard>
      </div>
    </div>
    <div v-else class="text-center py-10"><UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin mx-auto" /></div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const center = ref(null)
onMounted(async () => {
  const id = route.params.id
  const res = await $fetch('/api/v1/centers/' + id) as any
  center.value = res.data
})
</script>
