<script setup lang="ts">
useSeoMeta({
  title: 'Presupuestos Detallados - Prevenius',
  description: 'Gestiona presupuestos de obra con estructura jerárquica, cálculos automáticos y tablas maestras configurables.'
})
</script>

<template>
  <div>
    <UPageHero
      title="Presupuestos Detallados para tus Obras"
      description="Estructura jerárquica profesional con cálculos automáticos. Ahorra tiempo y evita errores."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <UPageSection
      title="Estructura Jerárquica Profesional"
      description="Organiza tu presupuesto de obra de forma clara y profesional con nuestra estructura multinivel."
      :features="[
        { name: 'Capítulos y partidas', description: 'Estructura jerárquica: Capítulos → Partidas → Conceptos. Organiza tu presupuesto de forma lógica.', icon: 'i-lucide-folder-tree' },
        { name: 'Cálculos automáticos', description: 'El sistema calcula automáticamente importes, totales y porcentajes. Sin errores manuales.', icon: 'i-lucide-calculator' },
        { name: 'Presupuesto total de obra', description: 'Visualiza el presupuesto total de obra y de seguridad por separado o conjunto.', icon: 'i-lucide-coins' },
        { name: 'Precio por hora', description: 'Calcula el precio por hora de seguridad en base al presupuesto y duración de la obra.', icon: 'i-lucide-clock' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Tablas Maestras Configurables"
      description="Personaliza tus catálogos de precios y conceptos según las necesidades de cada proyecto."
      :features="[
        { name: 'Catálogo de precios', description: 'Mantén una base de datos de precios actualizada que puedes reutilizar en todos tus proyectos.', icon: 'i-lucide-database' },
        { name: 'Conceptos predefinidos', description: 'Crea plantillas de conceptos habituales para agilizar la creación de nuevos presupuestos.', icon: 'i-lucide-file-plus' },
        { name: 'Importación y exportación', description: 'Importa datos de otros proyectos o exporta tus presupuestos en múltiples formatos.', icon: 'i-lucide-download' }
      ]"
    />

    <USeparator />

    <UPageCTA
      title="Empieza a gestionar tus presupuestos"
      description="Crea presupuestos profesionales en minutos con nuestro sistema de cálculo automático."
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
