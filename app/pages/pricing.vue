<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Precios - FirePlan',
  description: 'Planes de precios para FirePlan. Elige el plan que mejor se adapte a tus necesidades de gestión de emergencias.'
})
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold mb-2">Planes FirePlan</h1>
      <p class="text-gray-500">Elige el plan que mejor se adapte a tu centro de trabajo</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard>
        <template #header>
          <div class="text-center">
            <h3 class="text-lg font-semibold">Starter</h3>
            <p class="text-3xl font-bold">0€</p>
            <p class="text-sm text-gray-500">/mes</p>
          </div>
        </template>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> 1 centro</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Plan de emergencia básico</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Hasta 10 workers</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> 5 equipos QR</li>
          <li class="flex items-center gap-2 text-gray-400"><UIcon name="i-heroicons-x-mark" /> Simulacros</li>
          <li class="flex items-center gap-2 text-gray-400"><UIcon name="i-heroicons-x-mark" /> Mapas</li>
        </ul>
        <template #footer>
          <UButton to="/register" variant="outline" block>Empezar Gratis</UButton>
        </template>
      </UCard>

      <UCard class="ring-2 ring-primary">
        <template #header>
          <div class="text-center">
            <UBadge color="primary" size="sm" class="mb-2">Recomendado</UBadge>
            <h3 class="text-lg font-semibold">Professional</h3>
            <p class="text-3xl font-bold">49€</p>
            <p class="text-sm text-gray-500">/mes</p>
          </div>
        </template>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Hasta 5 centros</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Plan de emergencia completo</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Hasta 100 workers</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Equipos QR ilimitados</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Simulacros</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Mapas</li>
        </ul>
        <template #footer>
          <UButton to="/register" color="primary" block>Elegir Plan</UButton>
        </template>
      </UCard>

      <UCard>
        <template #header>
          <div class="text-center">
            <h3 class="text-lg font-semibold">Enterprise</h3>
            <p class="text-3xl font-bold">Contactar</p>
            <p class="text-sm text-gray-500">/mes</p>
          </div>
        </template>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Centros ilimitados</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Todo lo de Professional</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Workers ilimitados</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> API access</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> Soporte prioritario</li>
          <li class="flex items-center gap-2"><UIcon name="i-heroicons-check" class="text-success" /> On-premise opcional</li>
        </ul>
        <template #footer>
          <UButton to="/contact" variant="outline" block>Contactar</UButton>
        </template>
      </UCard>
    </div>
  </div>
</template>
