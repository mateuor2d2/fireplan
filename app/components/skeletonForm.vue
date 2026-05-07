<script lang="ts" setup>

</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Upper Menu Skeleton -->
    <div class="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-b-lg" />

    <div class="flex flex-1">
      <!-- Lateral Menu Skeleton -->
      <div class="w-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-r-lg" />

      <!-- Form Skeleton -->
      <div class="flex-1 p-4 space-y-4">
        <USkeleton class="h-12 w-full rounded-md" />
        <USkeleton class="h-8 w-3/4 rounded-md" />
        <USkeleton class="h-8 w-1/2 rounded-md" />
        <USkeleton class="h-8 w-full rounded-md" />
        <USkeleton class="h-8 w-3/4 rounded-md" />
        <USkeleton class="h-8 w-1/2 rounded-md" />
        <USkeleton class="h-12 w-full rounded-md" />
        <USkeleton class="h-8 w-3/4 rounded-md" />
        <USkeleton class="h-8 w-1/2 rounded-md" />
      </div>
    </div>
  </div>
</template>

<style>

</style>
