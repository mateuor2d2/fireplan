<script setup lang="ts">
// Use process.client to avoid SSR issues with colorMode
const colorMode = useColorMode()
const isDark = ref(false)

// Only access colorMode on client
onMounted(() => {
  isDark.value = colorMode.value === 'dark'
})

// Watch for color mode changes
watch(() => colorMode.value, (newValue) => {
  isDark.value = newValue === 'dark'
})

const color = computed(() => isDark.value ? '#020618' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'es'
  }
})

useSeoMeta({
  titleTemplate: '%s - Prevenius'
})
</script>

<template>
  <UApp>
    <ClientOnly>
      <NuxtLoadingIndicator />
    </ClientOnly>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
