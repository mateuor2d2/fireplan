<script setup lang="ts">
useSeoMeta({
  title: 'Sistema de Incidencias en Tiempo Real - Prevenius',
  description: 'Reporta y gestiona incidencias de seguridad en tiempo real. Acceso vía QR sin necesidad de registro para los trabajadores.'
})
</script>

<template>
  <div>
    <UPageHero
      title="Sistema de Reporte de Incidencias en Tiempo Real"
      description="Permite que cualquier persona reporte incidencias de seguridad escaneando un código QR, sin necesidad de registro."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <UPageSection
      title="Reporte Simplificado"
      description="Cualquier persona en la obra puede reportar una incidencia en segundos."
      :features="[
        { name: 'Acceso vía QR', description: 'Escanea el código QR de la obra y accede al formulario de incidencias sin necesidad de login.', icon: 'i-lucide-qr-code' },
        { name: 'Formulario rápido', description: 'Formulario simple y rápido: describe la incidencia, añade una foto y envía.', icon: 'i-lucide-send' },
        { name: 'Sin registro', description: 'No requiere que los trabajadores creen una cuenta ni inicien sesión.', icon: 'i-lucide-user-x' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Gestión de Estados"
      description="Controla el ciclo de vida de cada incidencia desde su reporte hasta su resolución."
      :features="[
        { name: 'Estados claros', description: 'Tres estados: Abierta, En proceso, Resuelta. Fácil de entender y gestionar.', icon: 'i-lucide-circle-dot' },
        { name: 'Comentarios y seguimiento', description: 'Añade comentarios y actualizaciones para mantener informado a todo el equipo.', icon: 'i-lucide-message-circle' },
        { name: 'Historial completo', description: 'Registro de todas las acciones y cambios de estado de cada incidencia.', icon: 'i-lucide-list' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Visibilidad y Notificaciones"
      description="Mantén a todo el equipo informado sobre las incidencias de cada obra."
      :features="[
        { name: 'Historial por plan', description: 'Visualiza todas las incidencias de cada plan de seguridad en un solo lugar.', icon: 'i-lucide-folder-open' },
        { name: 'Notificaciones', description: 'Recibe alertas cuando se reporten nuevas incidencias o cambie el estado de una existente.', icon: 'i-lucide-bell' },
        { name: 'Dashboard de control', description: 'Vista general de todas las incidencias activas agrupadas por obra y gravedad.', icon: 'i-lucide-layout-dashboard' }
      ]"
    />

    <USeparator />

    <UPageCTA
      title="Implementa un sistema de incidencias efectivo"
      description="Mejora la comunicación en obra y resuelve problemas de seguridad más rápidamente."
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
