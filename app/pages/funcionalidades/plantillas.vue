<script setup lang="ts">
useSeoMeta({
  title: 'Plantillas e Impresión de Documentos - Prevenius',
  description: 'Genera documentos profesionales en PDF con un solo clic. Plantillas personalizables con tu logotipo y marca corporativa.'
})
</script>

<template>
  <div>
    <UPageHero
      title="Documentos Profesionales con un Clic"
      description="Genera Planes de Seguridad y Salud en PDF listos para presentar a administraciones y clientes."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <UPageSection
      title="Generación Instantánea de PDF"
      description="Convierte tu plan en un documento profesional con todos los datos necesarios."
      :features="[
        { name: 'Generación con un clic', description: 'Exporta tu plan completo a PDF con un solo clic. Listo para imprimir o enviar digitalmente.', icon: 'i-lucide-file-text' },
        { name: 'Documento completo', description: 'Incluye todos los datos del plan: obra, contratista, promotor, presupuesto, riesgos y medidas.', icon: 'i-lucide-file-check' },
        { name: 'Formato profesional', description: 'Diseño limpio y profesional aceptado por administraciones públicas y empresas.', icon: 'i-lucide-file-type' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Personalización de Marca"
      description="Incluye tu identidad corporativa en todos los documentos generados."
      :features="[
        { name: 'Logotipo corporativo', description: 'Añade el logotipo de tu empresa en la cabecera de todos los documentos.', icon: 'i-lucide-image' },
        { name: 'Colores corporativos', description: 'Personaliza los colores del documento según tu identidad de marca.', icon: 'i-lucide-palette' },
        { name: 'Datos de contacto', description: 'Incluye automáticamente los datos de contacto de tu empresa en cada documento.', icon: 'i-lucide-address-book' }
      ]"
    />

    <USeparator />

    <UPageSection
      title="Control y Seguimiento"
      description="Mantén un registro de todas las impresiones y controla quién puede generar documentos."
      :features="[
        { name: 'Historial de impresiones', description: 'Registro completo de todas las veces que se ha generado o descargado un documento.', icon: 'i-lucide-history' },
        { name: 'Permisos por plan', description: 'Controla qué usuarios pueden generar documentos de cada plan de seguridad.', icon: 'i-lucide-lock' },
        { name: 'Versionado', description: 'Cada impresión incluye la versión y fecha del plan para garantizar la trazabilidad.', icon: 'i-lucide-git-branch' }
      ]"
    />

    <USeparator />

    <UPageCTA
      title="Empieza a generar documentos profesionales"
      description="Impresiona a tus clientes con documentos de seguridad de alta calidad y marca corporativa."
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
