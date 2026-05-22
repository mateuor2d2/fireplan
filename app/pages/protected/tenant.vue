<template>
  <div class="p-6">
    <!-- Accesos rapidos -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <UButton to="/protected/centers" icon="i-heroicons-building-office-2" color="primary" variant="soft" block class="h-20 flex-col"><span class="text-sm font-semibold">Centros</span></UButton>
      <UButton to="/protected/plans" icon="i-heroicons-document-text" color="primary" variant="soft" block class="h-20 flex-col"><span class="text-sm font-semibold">Planes</span></UButton>
      <UButton to="/protected/workers" icon="i-heroicons-fire-extinguisher" color="primary" variant="soft" block class="h-20 flex-col"><span class="text-sm font-semibold">Equipos</span></UButton>
      <UButton to="/protected/incidents" icon="i-heroicons-exclamation-triangle" color="primary" variant="soft" block class="h-20 flex-col"><span class="text-sm font-semibold">Incidentes</span></UButton>
      <UButton to="/protected/simulacros" icon="i-heroicons-clipboard-document-check" color="primary" variant="soft" block class="h-20 flex-col"><span class="text-sm font-semibold">Simulacros</span></UButton>
      <UButton to="/protected/mapas" icon="i-heroicons-map" color="primary" variant="soft" block class="h-20 flex-col"><span class="text-sm font-semibold">Mapas</span></UButton>
    </div>

    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">FirePlan — Gestion Tenant</h1>
        <p class="text-gray-500">Administra tus centros y personal</p>
      </div>
      <UButton to="/protected/centers" icon="i-heroicons-plus" color="primary">Nuevo Centro</UButton>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2"><UIcon name="i-heroicons-building-office-2" class="w-5 h-5" /><span class="font-semibold">Centros</span></div>
        </template>
        <p class="text-3xl font-bold">{{ centers.length }}</p>
      </UCard>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2"><UIcon name="i-heroicons-users" class="w-5 h-5" /><span class="font-semibold">Workers</span></div>
        </template>
        <p class="text-3xl font-bold">{{ workers.length }}</p>
      </UCard>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2"><UIcon name="i-heroicons-document-text" class="w-5 h-5" /><span class="font-semibold">Planes</span></div>
        </template>
        <p class="text-3xl font-bold">{{ plans.length }}</p>
      </UCard>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2"><UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" /><span class="font-semibold">Incidentes</span></div>
        </template>
        <p class="text-3xl font-bold">{{ incidents.length }}</p>
      </UCard>
    </div>
    <h2 class="text-lg font-semibold mb-3">Centros</h2>
    <div v-if="loading" class="text-center py-8"><UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" /></div>
    <div v-else-if="centers.length === 0" class="text-gray-500 py-8 text-center">No hay centros registrados. <UButton to="/protected/centers" variant="link">Crear uno</UButton></div>
    <div v-else class="space-y-3">
      <UCard v-for="center in centers" :key="center._id">
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ center.name }}</span>
              <UBadge :color="center.status === 'active' ? 'success' : 'neutral'" size="sm">{{ center.status === 'active' ? 'Activo' : 'Inactivo' }}</UBadge>
            </div>
            <div class="flex gap-2">
              <UButton :to="`/protected/centers/${center._id}`" size="xs" variant="ghost" icon="i-heroicons-eye" />
              <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" color="warning" @click="$router.push(`/protected/centers/${center._id}`)" />
              <UButton size="xs" variant="ghost" icon="i-heroicons-trash" color="error" @click="deleteCenter(center._id)" />
            </div>
          </div>
        </template>
        <div class="flex gap-4 text-sm text-gray-600">
          <span v-if="center.activity">{{ center.activity }}</span>
          <span v-if="center.address?.city">{{ center.address.city }}</span>
          <span v-if="center.maxOccupancy">Max: {{ center.maxOccupancy }}</span>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "app" })
const store = useFireplanStore()
const { centers, plans, incidents, loading } = storeToRefs(store)
const workers = ref<any[]>([])
const toast = useToast()
onMounted(async () => {
  await store.fetchCenters()
  await store.fetchPlans()
  await store.fetchIncidents()
  try { const res = await $fetch('/api/v1/workers') as any; workers.value = res.data || [] } catch (e) {}
})
async function deleteCenter(id: string) {
  if (!confirm('Eliminar este centro?')) return
  try {
    await $fetch(`/api/v1/centers/${id}`, { method: 'DELETE' })
    await store.fetchCenters()
    toast.add({ title: 'Centro eliminado', color: 'success' })
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
}
</script>
