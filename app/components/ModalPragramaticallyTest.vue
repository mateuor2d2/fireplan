<template>
  <UModal
    fullscreen
    title="Modal fullscreen"
  >
    <UButton
      label="Open"
      color="neutral"
      variant="subtle"
    />

    <template #body>
      <Placeholder class="h-full" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
defineProps<{
  count: number
}>()

const emit = defineEmits<{ close: [boolean] }>()
</script>
