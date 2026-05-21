<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-2">FirePlan — Administración</h1>
    <p class="text-gray-500 mb-6">Panel de control global</p>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2"><UIcon name="i-heroicons-building-office" class="w-5 h-5" /><span class="font-semibold">Tenants</span></div>
        </template>
        <p class="text-3xl font-bold">{{ tenants.length }}</p>
      </UCard>
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
          <div class="flex items-center gap-2"><UIcon name="i-heroicons-user-group" class="w-5 h-5" /><span class="font-semibold">Usuarios</span></div>
        </template>
        <p class="text-3xl font-bold">0</p>
      </UCard>
    </div>
    <h2 class="text-lg font-semibold mb-3">Tenants</h2>
    <div v-if="tenants.length === 0" class="text-gray-500 py-4">No hay tenants registrados.</div>
    <div v-else class="space-y-2">
      <UCard v-for="tenant in tenants" :key="tenant._id">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-semibold">{{ tenant.name }}</span>
            <UBadge :color="tenant.subscriptionStatus === 'active' ? 'success' : 'neutral'" size="sm">{{ tenant.subscriptionStatus }}</UBadge>
          </div>
        </template>
        <div class="text-sm text-gray-600">
          <p v-if="tenant.cif">CIF: {{ tenant.cif }}</p>
          <p v-if="tenant.email">{{ tenant.email }}</p>
          <p>Plan: {{ tenant.plan }}</p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "app" })
const store = useFireplanStore()
const { centers } = storeToRefs(store)
const tenants = ref<any[]>([])
const workers = ref<any[]>([])
onMounted(async () => {
  await store.fetchCenters()
  try { const t = await $fetch('/api/v1/tenants') as any; tenants.value = t.data || [] } catch (e) { }
  try { const w = await $fetch('/api/v1/workers') as any; workers.value = w.data || [] } catch (e) { }
})
</script>
