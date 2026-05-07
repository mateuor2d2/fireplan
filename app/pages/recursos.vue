<script setup lang="ts">
useSeoMeta({
  title: 'Recursos Gratuitos - Prevenius',
  description: 'Guías, plantillas y herramientas gratuitas para profesionales de la seguridad en construcción. Todo lo que necesitas para cumplir con la normativa.'
})

const recursos = [
  {
    title: 'Guía del RD 1627/1997',
    description: 'Resumen completo del Real Decreto con checklist de cumplimiento y campos obligatorios en un plan de seguridad.',
    icon: 'i-lucide-book-open',
    badge: 'Descarga gratuita'
  },
  {
    title: 'Plantilla de Plan de Seguridad',
    description: 'Ejemplo completo de plan de seguridad en PDF con estructura de capítulos, partidas y evaluación de riesgos.',
    icon: 'i-lucide-file-text',
    badge: 'Descarga gratuita'
  },
  {
    title: 'Calculadora de Presupuesto de Seguridad',
    description: 'Herramienta online para calcular el presupuesto estimado de seguridad de tu obra. Introduce datos y obtén resultados al instante.',
    icon: 'i-lucide-calculator',
    badge: 'Herramienta online'
  }
]

const articulos = [
  {
    title: 'Guía Completa del RD 1627/1997',
    description: 'Todo lo que necesitas saber sobre el Real Decreto de seguridad en construcción.',
    icon: 'i-lucide-scale',
    to: '/blog'
  },
  {
    title: 'Cómo Redactar un Plan de Seguridad Paso a Paso',
    description: 'Tutorial completo para crear tu primer plan de seguridad profesional.',
    icon: 'i-lucide-list-ordered',
    to: '/blog'
  },
  {
    title: 'Errores Comunes en Evaluaciones de Riesgo',
    description: 'Los errores más frecuentes y cómo evitarlos en tus evaluaciones.',
    icon: 'i-lucide-alert-triangle',
    to: '/blog'
  }
]
</script>

<template>
  <div>
    <UPageHero
      title="Recursos Gratuitos para Profesionales de la Construcción"
      description="Guías, plantillas y herramientas para mejorar tu gestión de seguridad. Todo diseñado específicamente para el sector construcción español."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <!-- Featured Resources -->
    <UPageSection
      title="Recursos Destacados"
      description="Descarga nuestras guías y plantillas gratuitas para mejorar tu gestión de seguridad."
    >
      <UPageGrid>
        <UPageCard
          v-for="resource in recursos"
          :key="resource.title"
          :title="resource.title"
          :description="resource.description"
          :icon="resource.icon"
          spotlight
        >
          <template #badge>
            <UBadge variant="subtle" color="success">{{ resource.badge }}</UBadge>
          </template>
        </UPageCard>
      </UPageGrid>
    </UPageSection>

    <USeparator />

    <!-- Blog Articles Preview -->
    <UPageSection
      title="Artículos Recomendados"
      description="Lecturas esenciales para profesionales de la seguridad en construcción."
    >
      <UPageGrid>
        <UPageCard
          v-for="articulo in articulos"
          :key="articulo.title"
          v-bind="articulo"
          :to="articulo.to"
          spotlight
        />
      </UPageGrid>
    </UPageSection>

    <USeparator />

    <!-- More links -->
    <UPageSection
      title="Más Recursos"
      description="Explora más contenido de Prevenius."
    >
      <div class="flex flex-wrap justify-center gap-4">
        <UButton to="/blog" icon="i-lucide-newspaper" size="lg">
          Blog
        </UButton>
        <UButton to="/docs" icon="i-lucide-book-open" color="neutral" variant="subtle" size="lg">
          Documentación
        </UButton>
        <UButton to="/support" icon="i-lucide-life-buoy" color="neutral" variant="subtle" size="lg">
          Centro de Ayuda
        </UButton>
      </div>
    </UPageSection>

    <USeparator />

    <UPageCTA
      title="¿Listo para crear tu primer plan de seguridad?"
      description="Prueba Prevenius gratis durante 14 días. Sin tarjeta de crédito."
      :links="[{
        label: 'Comenzar Gratis',
        icon: 'i-lucide-user-plus',
        to: '/signup'
      }]"
      variant="naked"
      class="overflow-hidden"
    />
  </div>
</template>
