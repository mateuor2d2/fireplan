<script setup lang="ts">
const helpOpen = ref(false)
</script>

<template>
  <div class="default-layout-container">
    <ClientOnly>
      <AppHeader />
    </ClientOnly>

    <main class="flex-grow">
      <slot />
    </main>

    <ClientOnly>
      <AppFooter />
    </ClientOnly>

    <div class="fixed bottom-6 right-6 z-50">
      <HelpButton @click="helpOpen = true" />
    </div>
    <HelpDrawer v-model:open="helpOpen" />
  </div>
</template>

<style>
.default-layout-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.flex-grow {
  flex-grow: 1;
}
</style>
