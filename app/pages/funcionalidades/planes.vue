<script setup lang="ts">
useSeoMeta({
  title: 'Planes de Seguridad y Salud - Prevenius',
  description: 'Gestión completa de Planes de Seguridad y Salud con creación guiada paso a paso. Datos de obra, contratistas, promotores y más.'
})
</script>

<template>
  <div>
    <UPageHero
      title="Gestión Completa de Planes de Seguridad y Salud"
      description="Crea planes de seguridad profesionales con nuestro sistema guiado paso a paso. Nunca olvides un campo requerido."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <UPageSection
      title="Creación Guiada de Planes"
      description="Un proceso intuitivo que te guía por cada sección requerida por la normativa vigente."
      :features="[
        { name: 'Creación guiada paso a paso', description: 'Nunca olvides un campo — el formulario te guía por cada sección requerida', icon: 'i-lucide-list-checks' },
        { name: 'Datos completos de obra', description: 'Nombre, dirección, población, superficie, plantas, presupuesto, duración, condiciones del entorno', icon: 'i-lucide-building-2' },
        { name: 'Gestión de contratistas y promotores', description: 'CIF, dirección, recurso preventivo, email. Toda la información legal requerida.', icon: 'i-lucide-users' },
        { name: 'Duplicación de planes', description: 'Copia planes existentes para nuevas obras similares y ahorra horas de trabajo', icon: 'i-lucide-copy' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Equipamiento e Instalaciones"
      description="Gestiona todos los elementos de seguridad y bienestar de tu obra de forma centralizada."
      :features="[
        { name: 'Equipamiento de obra', description: 'Extintores, duchas, lavabos, comedores, vestuarios, botiquín y más', icon: 'i-lucide-box' },
        { name: 'Instalaciones', description: 'Instalación eléctrica, suministro de agua y otras infraestructuras', icon: 'i-lucide-plug' },
        { name: 'Condiciones del entorno', description: 'Orografía, clima, accesos y características del terreno', icon: 'i-lucide-mountain' }
      ]"
    />

    <USeparator />

    <UPageCTA
      title="Crea tu primer plan de seguridad"
      description="Comienza ahora y descubre lo fácil que es cumplir con la normativa de prevención de riesgos laborales."
      :links="[{
        label: 'Comenzar Gratis',
        icon: 'i-lucide-user-plus',
        to: '/signup'
      }, {
        label: 'Solicitar Demo',
        icon: 'i-lucide-play',
        variant: 'subtle',
        to: '/contact'
      }]"
      variant="naked"
      class="overflow-hidden"
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[250px] size-40 sm:size-50 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageCTA>
  </div>
</template>
