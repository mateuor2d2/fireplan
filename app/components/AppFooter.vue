<script setup lang="ts">
const columns = [{
  label: 'Productos',
  children: [{
    label: 'Planes de Seguridad',
    to: '/funcionalidades/planes'
  }, {
    label: 'Incidencias',
    to: '/funcionalidades/incidencias'
  }, {
    label: 'Cumplimiento Normativo',
    to: '/funcionalidades/normativa'
  }, {
    label: 'Casos de Éxito',
    to: '/casos-de-exito'
  }, {
    label: 'Blog',
    to: '/blog'
  }, {
    label: 'Contacto',
    to: '/contact'
  }]
}, {
  label: 'Recursos',
  children: [{
    label: 'Documentación',
    to: '/docs'
  }, {
    label: 'Centro de Ayuda',
    to: '/support'
  }, {
    label: 'Recursos Gratuitos',
    to: '/recursos'
  }, {
    label: 'Guía RD 1627/1997',
    to: '/blog'
  }]
}]

const toast = useToast()

const email = ref('')
const loading = ref(false)

function onSubmit() {
  loading.value = true

  toast.add({
    title: '¡Suscrito!',
    description: 'Te has suscrito a nuestro boletín informativo.'
  })

  // Reset form
  email.value = ''
  loading.value = false
}
</script>

<template>
  <USeparator
    icon="i-lucide-hard-hat"
    class="h-px"
  />

  <UFooter :ui="{ top: 'border-b border-default' }">
    <template #top>
      <UContainer>
        <UFooterColumns :columns="columns">
          <template #right>
            <form @submit.prevent="onSubmit">
              <UFormField
                name="email"
                label="Suscríbete a nuestro boletín"
                description="Recibe artículos sobre seguridad en la construcción y actualizaciones de la plataforma"
                size="lg"
              >
                <UInput
                  v-model="email"
                  type="email"
                  class="w-full"
                  placeholder="Ingresa tu email"
                  required
                >
                  <template #trailing>
                    <UButton
                      type="submit"
                      size="xs"
                      color="neutral"
                      label="Suscribirse"
                      :loading="loading"
                    />
                  </template>
                </UInput>
              </UFormField>
            </form>
          </template>
        </UFooterColumns>
      </UContainer>
    </template>

    <template #left>
      <p class="text-muted text-sm">
        Copyright © {{ new Date().getFullYear() }} Prevenius. Todos los derechos reservados.
      </p>
    </template>

    <template #right>
      <ClientOnly>
        <UColorModeButton />
      </ClientOnly>
    </template>
  </UFooter>
</template>
