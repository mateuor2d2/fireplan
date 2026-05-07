<script setup lang="ts">
useSeoMeta({
  title: 'Funcionalidades de Prevenius - Gestión de Seguridad en Construcción',
  description: 'Descubre todo lo que nuestra plataforma puede hacer por tu gestión de seguridad en construcción. Planes, presupuestos, riesgos, QR y más.'
})
</script>

<template>
  <div>
    <UPageHero
      title="Funcionalidades de Prevenius"
      description="Descubre todo lo que nuestra plataforma puede hacer por tu gestión de seguridad en construcción."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <UPageSection>
      <UPageGrid>
        <UPageCard
          title="Planes de Seguridad"
          description="Gestión completa de Planes de Seguridad y Salud con creación guiada paso a paso."
          icon="i-lucide-hard-hat"
          to="/funcionalidades/planes"
          spotlight
        />
        <UPageCard
          title="Presupuestos"
          description="Presupuestos detallados con estructura jerárquica y cálculos automáticos para tus obras."
          icon="i-lucide-calculator"
          to="/funcionalidades/presupuestos"
          spotlight
        />
        <UPageCard
          title="Evaluación de Riesgos"
          description="Evaluación profesional integrada con matrices de probabilidad y gravedad."
          icon="i-lucide-shield-alert"
          to="/funcionalidades/riesgos"
          spotlight
        />
        <UPageCard
          title="Códigos QR"
          description="Comparte planes al instante con códigos QR y acceso público temporal."
          icon="i-lucide-qr-code"
          to="/funcionalidades/codigos-qr"
          spotlight
        />
        <UPageCard
          title="Plantillas e Impresión"
          description="Genera documentos profesionales en PDF con un solo clic y tu marca corporativa."
          icon="i-lucide-file-text"
          to="/funcionalidades/plantillas"
          spotlight
        />
        <UPageCard
          title="Incidencias"
          description="Sistema de reporte de incidencias en tiempo real accesible vía QR."
          icon="i-lucide-alert-triangle"
          to="/funcionalidades/incidencias"
          spotlight
        />
        <UPageCard
          title="Cumplimiento Normativo"
          description="Cumple con el RD 1627/1997 y toda la normativa vigente de prevención de riesgos."
          icon="i-lucide-scale"
          to="/funcionalidades/normativa"
          spotlight
        />
      </UPageGrid>
    </UPageSection>

    <USeparator />

    <UPageCTA
      title="¿Listo para transformar tu gestión de seguridad?"
      description="Comienza a usar Prevenius gratis y descubre cómo podemos ayudarte a cumplir con la normativa."
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
