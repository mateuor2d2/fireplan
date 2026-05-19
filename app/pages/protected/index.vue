<template>
  <div class=p-6>
    <h1 class=text-2xl font-bold mb-6>FirePlan — Dashboard</h1>
    <div class=grid grid-cols-1 md:grid-cols-3 gap-4>
      <UCard>
        <template #header>
          <div class=flex items-center gap-2>
            <UIcon name=i-heroicons-building-office-2 class=w-5 h-5 />
            <span class=font-semibold>Centros</span>
          </div>
        </template>
        <p class=text-3xl font-bold>{{ centers.length }}</p>
        <p class=text-sm text-gray-500>Centros registrados</p>
        <UButton to=/protected/centers class=mt-4 block>Ver centros</UButton>
      </UCard>

      <UCard>
        <template #header>
          <div class=flex items-center gap-2>
            <UIcon name=i-heroicons-document-text class=w-5 h-5 />
            <span class=font-semibold>Planes</span>
          </div>
        </template>
        <p class=text-3xl font-bold>{{ plans.length }}</p>
        <p class=text-sm text-gray-500>Planes de emergencia</p>
        <UButton to=/protected/plans class=mt-4 block>Ver planes</UButton>
      </UCard>

      <UCard>
        <template #header>
          <div class=flex items-center gap-2>
            <UIcon name=i-heroicons-exclamation-triangle class=w-5 h-5 />
            <span class=font-semibold>Incidentes</span>
          </div>
        </template>
        <p class=text-3xl font-bold>{{ incidents.length }}</p>
        <p class=text-sm text-gray-500>Incidentes registrados</p>
        <UButton to=/protected/incidents class=mt-4 block>Ver incidentes</UButton>
      </UCard>
    </div>
  </div>
</template>

<script setup lang=ts>
const store = useFireplanStore()
const { centers, plans, incidents, loading } = storeToRefs(store)

onMounted(() => {
  store.fetchCenters()
  store.fetchPlans()
  store.fetchIncidents()
})
</script>
