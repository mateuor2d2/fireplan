<script setup lang="ts">
import { useUserStore } from '../../stores/user'
import ObraSwitcher from '../../components/ObraSwitcher.vue'

definePageMeta({ middleware: 'auth', layout: 'app' })

interface Obra {
  _id: string
  nom_obra: string
  createdAt: string
}

const userStore = useUserStore()
const obras = ref<Obra[]>([])
const isLoading = ref(true)

onMounted(async () => {
  if (userStore.user.role !== 'control') {
    await navigateTo('/protected/logged')
    return
  }

  try {
    const data = await $fetch<{ obras: Obra[] }>('/api/obras/my-obras')
    obras.value = data.obras || []
  } catch {
    obras.value = []
  } finally {
    isLoading.value = false
  }
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[--ui-text-highlighted]">
          Mis Obras
        </h1>
        <p class="text-sm text-[--ui-text-muted] mt-1">
          Obras donde colaboras
        </p>
      </div>
      <ObraSwitcher />
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard v-for="i in 3" :key="i">
        <div class="animate-pulse space-y-3">
          <div class="h-5 bg-[--ui-bg-accented] rounded w-3/4" />
          <div class="h-4 bg-[--ui-bg-accented] rounded w-1/2" />
          <div class="h-9 bg-[--ui-bg-accented] rounded w-1/3" />
        </div>
      </UCard>
    </div>

    <div v-else-if="obras.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
      <UIcon name="i-lucide-building-2" class="text-4xl text-[--ui-text-dimmed] mb-3" />
      <p class="text-[--ui-text-muted]">
        No tienes acceso a ninguna obra
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="obra in obras"
        :key="obra._id"
        class="transition-shadow duration-200 hover:shadow-lg hover:shadow-[--ui-bg-elevated]/50"
      >
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-[--ui-bg-accented]">
              <UIcon name="i-lucide-hard-hat" class="text-xl text-[--ui-text-dimmed]" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-[--ui-text-highlighted] truncate">
                {{ obra.nom_obra }}
              </h3>
              <p class="text-xs text-[--ui-text-muted] mt-0.5">
                {{ formatDate(obra.createdAt) }}
              </p>
            </div>
          </div>

          <NuxtLink
            :to="`/protected/planes/${obra._id}/dashboard`"
            class="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-[--ui-primary] text-[--ui-bg] text-sm font-medium transition-opacity hover:opacity-90"
          >
            <UIcon name="i-lucide-eye" class="text-base" />
            Ver obra
          </NuxtLink>
        </div>
      </UCard>
    </div>
  </div>
</template>
