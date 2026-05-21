<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-2">FirePlan — Mi Dashboard</h1>
    <p class="text-gray-500 mb-6">Bienvenido, {{ userStore.user?.name || userStore.user?.email }}</p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-building-office-2" class="w-5 h-5" />
            <span class="font-semibold">Mis Centros</span>
          </div>
        </template>
        <p class="text-3xl font-bold">{{ centers.length }}</p>
        <p class="text-sm text-gray-500">Centros asignados</p>
      </UCard>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-users" class="w-5 h-5" />
            <span class="font-semibold">Compañeros</span>
          </div>
        </template>
        <p class="text-3xl font-bold">{{ workers.length }}</p>
        <p class="text-sm text-gray-500">Workers en mis centros</p>
      </UCard>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-shield-check" class="w-5 h-5" />
            <span class="font-semibold">Mi Rol</span>
          </div>
        </template>
        <p class="text-xl font-bold capitalize">{{ myEmergencyRole }}</p>
        <p class="text-sm text-gray-500">Rol en plan de emergencia</p>
      </UCard>
    </div>
    <h2 class="text-lg font-semibold mb-3">Mis Centros Asignados</h2>
    <div v-if="loading" class="text-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" />
    </div>
    <div v-else-if="centers.length === 0" class="text-gray-500 py-8 text-center">No tienes centros asignados.</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard v-for="center in centers" :key="center._id" class="hover:shadow-lg transition-shadow">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-semibold">{{ center.name }}</span>
            <UBadge :color="center.status === 'active' ? 'success' : 'neutral'" size="sm">{{ center.status === 'active' ? 'Activo' : 'Inactivo' }}</UBadge>
          </div>
        </template>
        <div class="space-y-2 text-sm">
          <p v-if="center.activity"><strong>Actividad:</strong> {{ center.activity }}</p>
          <p v-if="center.address?.city"><strong>Ciudad:</strong> {{ center.address.city }}</p>
          <p v-if="center.maxOccupancy"><strong>Ocupación máx:</strong> {{ center.maxOccupancy }}</p>
        </div>
        <template #footer>
          <UButton :to="`/protected/centers/${center._id}`" size="sm" block>Ver Detalles</UButton>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const userStore = useUserStore()
definePageMeta({ layout: "app" })
const store = useFireplanStore()
const { centers, loading } = storeToRefs(store)
const workers = ref<any[]>([])
const myEmergencyRole = ref('No asignado')
onMounted(async () => {
  await store.fetchCenters()
  if (centers.value.length > 0) {
    const centerIds = centers.value.map(c => c._id).join(',')
    try { const res = await $fetch(`/api/v1/workers?centerId=${centerIds}`) as any; workers.value = res.data || [] } catch (e) { }
  }
})
</script>
