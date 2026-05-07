<script setup lang="ts">
import { useUserStore } from '../../stores/user'

definePageMeta({ middleware: 'auth', layout: 'app' })

const userStore = useUserStore()

onMounted(() => {
  if (userStore.user.role === 'control') {
    navigateTo('/protected/colaborador')
  }
})
</script>

<template>
  <div
    v-if="userStore.user.role !== 'control'"
    class="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pt-6"
  >
    <UCard>
      <ElementBase
        title="Obras"
        url="/api/planes"
        tipo="planes"
      />
    </UCard>

    <UCard>
      <ElementBase
        title="Partidas"
        url="/api/conceptos"
        tipo="conceptos"
      />
    </UCard>
  </div>
</template>
