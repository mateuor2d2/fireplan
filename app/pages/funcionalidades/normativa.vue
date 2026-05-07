<script setup lang="ts">
useSeoMeta({
  title: 'Cumplimiento Normativo - RD 1627/1997 - Prevenius',
  description: 'Cumple con el RD 1627/1997, la Ley 31/1995 de PRL y toda la normativa vigente de prevención de riesgos laborales.'
})
</script>

<template>
  <div>
    <UPageHero
      title="Cumple con el RD 1627/1997 y la Normativa Vigente"
      description="Prevenius te garantiza el cumplimiento de toda la normativa de prevención de riesgos laborales en construcción."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <UPageSection
      title="Normativa Cubierta"
      description="Nuestra plataforma está diseñada para cumplir con los requisitos legales más exigentes."
      :features="[
        { name: 'RD 1627/1997', description: 'Real Decreto 1627/1997 por el que se establecen disposiciones mínimas de seguridad y salud en obras de construcción.', icon: 'i-lucide-scroll-text' },
        { name: 'Ley 31/1995 de PRL', description: 'Ley de Prevención de Riesgos Laborales, normativa base de la seguridad y salud en el trabajo en España.', icon: 'i-lucide-scale' },
        { name: 'RD 39/1997', description: 'Reglamento de los Servicios de Prevención que desarrolla la Ley 31/1995.', icon: 'i-lucide-file-text' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Campos Obligatorios Garantizados"
      description="El sistema te guía para completar todos los campos requeridos por la normativa."
      :features="[
        { name: 'Validación automática', description: 'El sistema valida que todos los campos obligatorios estén completos antes de permitir la generación del documento.', icon: 'i-lucide-check-circle' },
        { name: 'Campos requeridos', description: 'Datos de obra, contratista, promotor, recurso preventivo y todos los campos que exige la normativa.', icon: 'i-lucide-list-checks' },
        { name: 'Alertas de cumplimiento', description: 'Recibe alertas cuando falten datos obligatorios por completar en tu plan.', icon: 'i-lucide-alert-circle' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Documentos Aceptados"
      description="Genera documentos que cumplen con los requisitos de administraciones y clientes."
      :features="[
        { name: 'Formato oficial', description: 'Documentos con la estructura y contenido exigidos por las administraciones públicas.', icon: 'i-lucide-file-check' },
        { name: 'Actualizaciones automáticas', description: 'Mantén tus planes actualizados cuando cambie la normativa con nuestras actualizaciones automáticas.', icon: 'i-lucide-refresh-cw' },
        { name: 'Trazabilidad completa', description: 'Historial de versiones y modificaciones para demostrar el cumplimiento en cualquier momento.', icon: 'i-lucide-git-branch' }
      ]"
    />

    <USeparator />

    <UPageCTA
      title="Garantiza el cumplimiento normativo"
      description='Duerme tranquilo sabiendo que tus planes de seguridad cumplen con toda la normativa vigente.'
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
