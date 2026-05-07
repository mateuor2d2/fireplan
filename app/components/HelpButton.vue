<script setup lang="ts">
const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <UButton
    color="neutral"
    variant="soft"
    icon="i-heroicons-question-mark-circle"
    size="sm"
    class="rounded-full"
    @click="emit('click')"
  >
    <span class="hidden sm:inline">Ayuda</span>
  </UButton>
</template>
