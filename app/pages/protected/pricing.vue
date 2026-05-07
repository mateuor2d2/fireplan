<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'app'
})
</script>

<template>
  <PricingContent />
</template>
