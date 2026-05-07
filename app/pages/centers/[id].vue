<template>
  <div class="p-6">
    <div v-if="center" class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">{{ center.name }}</h1>
        <div class="flex gap-2">
          <UButton
            icon="i-heroicons-pencil"
            label="Editar"
            :to="`/centers/${center._id}/edit`"
            color="gray"
          />
          <UButton
            icon="i-heroicons-document-text"
            label="Nuevo Plan"
            :to="`/centers/${center._id}/plans/new`"
            color="primary"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-building-office" />
              <span class="font-semibold">Información General</span>
            </div>
          </template>

          <dl class="space-y-2">
            <div class="flex justify-between">
              <dt class="text-gray-500">Dirección:</dt>
              <dd>{{ center.address }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Actividad:</dt>
              <dd>{{ center.activity }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Sector:</dt>
              <dd>{{ center.sector }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Ocupación máxima:</dt>
              <dd>{{ center.maxOccupancy || 'No especificado' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Estado:</dt>
              <dd>
                <UBadge
                  :color="center.status === 'active' ? 'green' : 'gray'"
                  :label="center.status"
                />
              </dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-user" />
              <span class="font-semibold">Contacto</span>
            </div>
          </template>

          <dl class="space-y-2">
            <div class="flex justify-between">
              <dt class="text-gray-500">Persona de contacto:</dt>
              <dd>{{ center.contactPerson || 'No especificado' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Teléfono:</dt>
              <dd>{{ center.phone || 'No especificado' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Email:</dt>
              <dd>{{ center.email || 'No especificado' }}</dd>
            </div>
          </dl>
        </UCard>
      </div>

      <!-- Planes de Emergencia -->
      <div class="mt-6">
        <h2 class="text-xl font-semibold mb-4">Planes de Emergencia</h2>
        <div v-if="plans.length === 0" class="text-gray-500 text-center py-8">
          No hay planes de emergencia. <NuxtLink :to="`/centers/${center._id}/plans/new`" class="text-primary underline">Crear uno</NuxtLink>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UCard v-for="plan in plans" :key="plan._id">
            <template #header>
              <div class="flex justify-between items-center">
                <span class="font-semibold">{{ plan.type }} - {{ plan.normativa }}</span>
                <UBadge
                  :color="plan.status === 'active' ? 'green' : plan.status === 'draft' ? 'yellow' : 'gray'"
                  :label="plan.status"
                />
              </div>
            </template>
            <p class="text-sm text-gray-500">Versión {{ plan.version }} - {{ plan.phases?.filter(p => p.completed).length || 0 }}/7 fases</p>
            <div class="mt-4 flex gap-2">
              <UButton size="sm" :to="`/plans/${plan._id}`" label="Ver" />
              <UButton size="sm" color="gray" variant="ghost" :to="`/plans/${plan._id}/edit`" label="Editar" />
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <ULoadingIcon />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const toast = useToast()

const center = ref(null)
const plans = ref([])
const loading = ref(true)

const centerId = route.params.id as string

async function fetchCenter() {
  try {
    const response = await $fetch(`/api/v1/centers/${centerId}`)
    center.value = response.data
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'red'
    })
  }
}

async function fetchPlans() {
  try {
    const response = await $fetch('/api/v1/plans', {
      query: { centerId }
    })
    plans.value = response.data
  } catch (error) {
    // Silencioso - puede que no haya planes
  }
}

onMounted(async () => {
  await fetchCenter()
  await fetchPlans()
  loading.value = false
})
</script>
