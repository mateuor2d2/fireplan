<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-2">FirePlan — Centro Administrador</h1>
    <p class="text-gray-500 mb-6">Gestiona tu centro y personal</p>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2"><UIcon name="i-heroicons-building-office-2" class="w-5 h-5" /><span class="font-semibold">Mi Centro</span></div>
        </template>
        <p class="text-lg font-bold">{{ myCenter?.name || 'Sin centro' }}</p>
      </UCard>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2"><UIcon name="i-heroicons-users" class="w-5 h-5" /><span class="font-semibold">Workers</span></div>
        </template>
        <p class="text-3xl font-bold">{{ workers.length }}</p>
      </UCard>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2"><UIcon name="i-heroicons-fire-extinguisher" class="w-5 h-5" /><span class="font-semibold">Equipos</span></div>
        </template>
        <p class="text-3xl font-bold">0</p>
      </UCard>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2"><UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5" /><span class="font-semibold">Simulacros</span></div>
        </template>
        <p class="text-3xl font-bold">0</p>
      </UCard>
    </div>
    <div v-if="myCenter" class="mb-6">
      <h2 class="text-lg font-semibold mb-3">Mi Centro: {{ myCenter.name }}</h2>
      <UCard>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <p v-if="myCenter.activity"><strong>Actividad:</strong> {{ myCenter.activity }}</p>
          <p v-if="myCenter.sector"><strong>Sector:</strong> {{ myCenter.sector }}</p>
          <p v-if="myCenter.address?.street"><strong>Dirección:</strong> {{ myCenter.address.street }}, {{ myCenter.address.city }}</p>
          <p v-if="myCenter.maxOccupancy"><strong>Ocupación máx:</strong> {{ myCenter.maxOccupancy }}</p>
        </div>
        <div class="mt-4 flex gap-2">
          <UButton :to="`/protected/centers/${myCenter._id}/plan`" icon="i-heroicons-document-text">Plan de Emergencia</UButton>
          <UButton :to="`/protected/equipos?centerId=${myCenter._id}`" icon="i-heroicons-fire-extinguisher" variant="outline">Equipos</UButton>
        </div>
      </UCard>
    </div>
    <h2 class="text-lg font-semibold mb-3">Workers del Centro</h2>
    <div v-if="workers.length === 0" class="text-gray-500 py-4">No hay workers asignados.</div>
    <div v-else class="space-y-2">
      <UCard v-for="worker in workers" :key="worker._id">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-semibold">{{ worker.name }}</span>
            <UBadge size="sm">{{ worker.emergencyRole }}</UBadge>
          </div>
        </template>
        <div class="text-sm text-gray-600">
          <p v-if="worker.email">{{ worker.email }}</p>
          <p v-if="worker.phone">{{ worker.phone }}</p>
          <p v-if="worker.role">Rol: {{ worker.role }}</p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useFireplanStore()
const { centers, loading } = storeToRefs(store)
const workers = ref<any[]>([])
const myCenter = computed(() => centers.value[0] || null)
onMounted(async () => {
  await store.fetchCenters()
  if (myCenter.value) {
    try { const res = await $fetch(`/api/v1/workers?centerId=${myCenter.value._id}`) as any; workers.value = res.data || [] } catch (e) { }
  }
})
</script>
