<script setup lang="ts">
useSeoMeta({
  title: 'Códigos QR para Planes de Seguridad - Prevenius',
  description: 'Comparte tus planes de seguridad al instante con códigos QR. Acceso público temporal con token y expiración configurables.'
})
</script>

<template>
  <div>
    <UPageHero
      title="Comparte Planes al Instante con Códigos QR"
      description="Genera códigos QR para que trabajadores y supervisores accedan a la información del plan desde cualquier dispositivo."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <UPageSection
      title="Generación Automática de QR"
      description="Crea y gestiona códigos QR para cada plan de seguridad sin complicaciones técnicas."
      :features="[
        { name: 'Generación automática', description: 'El sistema genera automáticamente un código QR único para cada plan de seguridad.', icon: 'i-lucide-qr-code' },
        { name: 'Acceso público temporal', description: 'Token de acceso con expiración configurable. Controla quién y cuándo puede acceder.', icon: 'i-lucide-clock' },
        { name: 'Doble funcionalidad', description: 'Un QR para el plan completo y otro específico para reportar incidencias.', icon: 'i-lucide-layout-grid' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Control Total del Acceso"
      description="Gestiona los códigos QR de cada plan con total flexibilidad y seguridad."
      :features="[
        { name: 'Activación y desactivación', description: 'Activa o desactiva el acceso público en cualquier momento con un solo clic.', icon: 'i-lucide-power' },
        { name: 'Regeneración de códigos', description: 'Regenera el código QR cuando necesites cambiar el token de acceso por seguridad.', icon: 'i-lucide-refresh-cw' },
        { name: 'Expiración configurable', description: 'Define fechas de expiración para los accesos temporales a cada plan.', icon: 'i-lucide-calendar-clock' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Acceso desde Cualquier Dispositivo"
      description="La vista pública está optimizada para móviles, tablets y ordenadores."
      :features="[
        { name: 'Diseño responsive', description: 'La información del plan se adapta perfectamente a cualquier tamaño de pantalla.', icon: 'i-lucide-smartphone' },
        { name: 'Descarga en PDF', description: 'Los usuarios pueden descargar el plan completo en formato PDF desde la vista pública.', icon: 'i-lucide-file-down' },
        { name: 'Sin registro requerido', description: 'Acceso inmediato escaneando el QR, sin necesidad de crear cuenta ni iniciar sesión.', icon: 'i-lucide-user-check' }
      ]"
    />

    <USeparator />

    <UPageCTA
      title="Empieza a compartir tus planes con QR"
      description="Facilita el acceso a la información de seguridad para todos los trabajadores de la obra."
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
