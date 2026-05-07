<script setup lang="ts">
useSeoMeta({
  title: 'Para Quién - Prevenius',
  description: 'Diseñado para cada profesional de la construcción: coordinadores de seguridad, directores de obra, gerentes de constructora y técnicos de prevención.'
})

const sectors = [
  { title: 'Edificación Residencial', description: 'Viviendas unifamiliares, bloques de pisos y urbanizaciones.', icon: 'i-lucide-home' },
  { title: 'Obra Civil', description: 'Infraestructuras, carreteras, puentes y obras públicas.', icon: 'i-lucide-route' },
  { title: 'Reformas y Rehabilitación', description: 'Renovación de edificios existentes y reformas integrales.', icon: 'i-lucide-hammer' },
  { title: 'Energía Renovable', description: 'Instalaciones solares, eólicas y de energía limpia.', icon: 'i-lucide-zap' },
  { title: 'Demolición', description: 'Derribo controlado de estructuras y edificios.', icon: 'i-lucide-building' },
  { title: 'Instalaciones', description: 'Electricidad, fontanería, HVAC y climatización.', icon: 'i-lucide-wrench' }
]
</script>

<template>
  <div>
    <UPageHero
      title="Diseñado para Cada Profesional de la Construcción"
      description="Sea cual sea tu rol, Prevenius se adapta a tu forma de trabajar. Desde autónomos hasta grandes constructoras."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <UPageSection
      title="Perfiles de Usuario"
      description="Prevenius está diseñado pensando en cada profesional involucrado en la seguridad de la construcción."
    >
      <UPageGrid>
        <UPageCard
          title="Coordinador de Seguridad y Salud"
          description="Creas planes para múltiples obras y clientes. Necesitas eficiencia, cumplimiento y presentación profesional."
          icon="i-lucide-shield-check"
          spotlight
        />
        <UPageCard
          title="Director de Obra"
          description="Gestionas varias obras simultáneamente. Necesitas visibilidad del estado de cada plan y presupuesto con dashboard centralizado."
          icon="i-lucide-building-2"
          spotlight
        />
        <UPageCard
          title="Gerente de Constructora"
          description="Responsable del cumplimiento de toda la empresa. Multi-usuario, reportes, control de acceso y API para integración."
          icon="i-lucide-briefcase"
          spotlight
        />
        <UPageCard
          title="Técnico de Prevención"
          description="Estás a pie de obra y necesitas acceso rápido. Reporta incidencias y verifica cumplimiento desde tu móvil con QR."
          icon="i-lucide-hard-hat"
          spotlight
        />
        <UPageCard
          title="Autónomo / Pequeño Contratista"
          description="Haces pocas obras al año pero necesitas cumplir. Plan Básico con todo lo esencial desde 29,90€/mes."
          icon="i-lucide-user"
          spotlight
        />
        <UPageCard
          title="Promotor Inmobiliario"
          description="Delegas la seguridad pero necesitas visibilidad. Accede a todos tus planes y verifica el cumplimiento normativo."
          icon="i-lucide-landmark"
          spotlight
        />
      </UPageGrid>
    </UPageSection>

    <USeparator />

    <UPageSection
      title="Sectores que Cubrimos"
      description="Prevenius se adapta a cualquier tipo de obra de construcción."
    >
      <UPageGrid>
        <UPageCard
          v-for="sector in sectors"
          :key="sector.title"
          v-bind="sector"
          spotlight
        />
      </UPageGrid>
    </UPageSection>

    <USeparator />

    <UPageCTA
      title="¿Listo para empezar?"
      description="Únete a miles de profesionales que ya confían en Prevenius para sus planes de seguridad."
      :links="[{
        label: 'Comenzar Prueba Gratis',
        icon: 'i-lucide-user-plus',
        to: '/signup'
      }, {
        label: 'Ver Precios',
        icon: 'i-lucide-credit-card',
        variant: 'subtle',
        to: '/pricing'
      }]"
      variant="naked"
      class="overflow-hidden"
    />
  </div>
</template>
