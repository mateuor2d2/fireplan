<script setup lang="ts">
useSeoMeta({
  title: 'Evaluación de Riesgos - Prevenius',
  description: 'Sistema profesional de evaluación de riesgos con matrices de probabilidad y gravedad. Catálogos de EPIs, PQS y maquinaria.'
})
</script>

<template>
  <div>
    <UPageHero
      title="Evaluación de Riesgos Profesional Integrada"
      description="Evalúa los riesgos de cada partida con nuestra matriz probabilidad × gravedad y catálogos completos."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <UPageSection
      title="Tablas Maestras de Evaluación"
      description="Configura tus propios parámetros de evaluación o utiliza los valores por defecto según normativa."
      :features="[
        { name: 'Tipos de riesgo', description: 'Catálogo completo de tipos de riesgo clasificados por categorías: caídas, golpes, eléctricos, químicos y más.', icon: 'i-lucide-alert-circle' },
        { name: 'Probabilidad y gravedad', description: 'Define escalas de probabilidad y gravedad personalizadas para ajustar la evaluación a tus necesidades.', icon: 'i-lucide-bar-chart-3' },
        { name: 'Matriz de valoración', description: 'Visualiza los riesgos en una matriz probabilidad × gravedad para identificar prioridades de actuación.', icon: 'i-lucide-grid-3x3' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Catálogos de Medidas Preventivas"
      description="Bibliotecas completas de equipos, medidas y procedimientos de seguridad."
      :features="[
        { name: 'Catálogo de EPIs', description: 'Equipos de Protección Individual con especificaciones, normas UNE y criterios de selección.', icon: 'i-lucide-shield' },
        { name: 'Medidas de PQS', description: 'Protecciones Colectivas de Seguridad: barandillas, redes, cubiertas y más.', icon: 'i-lucide-fence' },
        { name: 'Maquinaria y equipos', description: 'Requisitos de seguridad para maquinaria, herramientas y equipos de trabajo.', icon: 'i-lucide-cog' },
        { name: 'Medios auxiliares', description: 'Andamios, escaleras, plataformas y otros medios auxiliares con sus medidas de seguridad.', icon: 'i-lucide-wrench' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Evaluación por Partidas"
      description="Asocia riesgos y medidas preventivas a cada partida de tu presupuesto de forma sistemática."
      :features="[
        { name: 'Riesgos por capítulo', description: 'Identifica y evalúa los riesgos específicos de cada capítulo y partida de obra.', icon: 'i-lucide-list-tree' },
        { name: 'Medidas preventivas', description: 'Asigna las medidas preventivas adecuadas a cada riesgo identificado.', icon: 'i-lucide-check-circle-2' },
        { name: 'Seguimiento y control', description: 'Realiza el seguimiento de las medidas implementadas y su efectividad.', icon: 'i-lucide-clipboard-check' }
      ]"
    />

    <USeparator />

    <UPageCTA
      title="Comienza a evaluar riesgos profesionalmente"
      description="Integra la evaluación de riesgos en tu gestión de seguridad de forma sencilla y eficaz."
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
