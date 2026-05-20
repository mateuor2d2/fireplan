<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Sobre FirePlan',
  description: 'Conoce FirePlan, la plataforma de gestión de planes de emergencia y autoprotección.'
})
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div class="text-center mb-10">
      <LogoPro class="w-24 h-24 mx-auto mb-4" />
      <h1 class="text-3xl font-bold mb-2">Sobre FirePlan</h1>
      <p class="text-gray-500">Plan de Emergencia y Autoprotección</p>
    </div>

    <UCard class="mb-6">
      <template #header>
        <h2 class="text-xl font-semibold">Nuestra Misión</h2>
      </template>
      <p>
        FirePlan nace con el objetivo de simplificar la gestión de planes de emergencia y autoprotección 
        en centros de trabajo. Queremos que cada empresa, independientemente de su tamaño, 
        pueda cumplir con la normativa de prevención de riesgos laborales de forma sencilla y eficiente.
      </p>
    </UCard>

    <UCard class="mb-6">
      <template #header>
        <h2 class="text-xl font-semibold">¿Qué ofrecemos?</h2>
      </template>
      <ul class="space-y-3">
        <li class="flex items-start gap-3">
          <UIcon name="i-heroicons-document-text" class="w-6 h-6 text-primary mt-0.5" />
          <div>
            <strong>Plan de Emergencia Digital</strong>
            <p class="text-sm text-gray-500">Crea y mantén tu plan conforme al RD 393/2007 con todos los capítulos y anexos.</p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <UIcon name="i-heroicons-qr-code" class="w-6 h-6 text-primary mt-0.5" />
          <div>
            <strong>Gestión de Equipos QR</strong>
            <p class="text-sm text-gray-500">Controla extintores, detectores y equipos de emergencia con códigos QR.</p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <UIcon name="i-heroicons-users" class="w-6 h-6 text-primary mt-0.5" />
          <div>
            <strong>Fichaje Inteligente</strong>
            <p class="text-sm text-gray-500">Informa a cada trabajador de su rol en emergencias al fichar.</p>
          </div>
        </li>
        <li class="flex items-start gap-3">
          <UIcon name="i-heroicons-clipboard-document-check" class="w-6 h-6 text-primary mt-0.5" />
          <div>
            <strong>Simulacros</strong>
            <p class="text-sm text-gray-500">Programa, ejecuta y evalúa simulacros de evacuación con informes completos.</p>
          </div>
        </li>
      </ul>
    </UCard>

    <div class="text-center">
      <UButton to="/register" color="primary" size="lg">Empezar con FirePlan</UButton>
    </div>
  </div>
</template>
