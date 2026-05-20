<script setup lang="ts">
const links = {
  producto: [{
    label: 'Sobre FirePlan',
    to: '/about'
  }, {
    label: 'Precios',
    to: '/pricing'
  }, {
    label: 'Contacto',
    to: '/contact'
  }],
  legal: [{
    label: 'Privacidad',
    to: '/privacy'
  }, {
    label: 'Términos',
    to: '/terms'
  }]
}
</script>

<template>
  <UFooter>
    <template #top>
      <UFooterColumns :links="links">
        <template #left>
          <LogoPro class="h-8 w-auto" />
          <p class="text-sm text-gray-500 mt-2">
            FirePlan — Plan de Emergencia y Autoprotección
          </p>
        </template>
      </UFooterColumns>
    </template>

    <template #bottom>
      <p class="text-sm text-gray-500">
        © {{ new Date().getFullYear() }} FirePlan. Todos los derechos reservados.
      </p>
    </template>
  </UFooter>
</template>
