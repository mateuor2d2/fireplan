<script setup lang="ts">
const helpOpen = ref(false)
</script>

<template>
  <div class="h-screen flex items-center justify-center px-4">
    <UButton
      icon="i-lucide-chevron-left"
      to="/"
      size="xl"
      color="neutral"
      variant="subtle"
      class="absolute left-8 top-8 rounded-full z-10"
    />

    <UPageCard
      variant="subtle"
      class="max-w-sm w-full"
    >
      <slot />
    </UPageCard>

    <div class="fixed bottom-6 right-6 z-50">
      <HelpButton @click="helpOpen = true" />
    </div>
    <HelpDrawer v-model:open="helpOpen" />
  </div>
</template>
