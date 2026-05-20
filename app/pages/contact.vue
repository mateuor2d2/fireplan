<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Contacto - FirePlan',
  description: 'Contacta con el equipo de FirePlan para resolver tus dudas o solicitar una demo.'
})

const toast = useToast()
const sent = ref(false)

async function onSubmit(event: any) {
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: event.data
    })
    sent.value = true
    toast.add({
      title: 'Mensaje enviado',
      description: 'Te responderemos lo antes posible.',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'No se pudo enviar el mensaje',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto">
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold mb-2">Contacto</h1>
      <p class="text-gray-500">¿Tienes dudas? Escríbenos y te ayudamos</p>
    </div>

    <UCard v-if="!sent">
      <UForm class="space-y-4" @submit="onSubmit">
        <UFormField label="Nombre" name="name" required>
          <UInput name="name" placeholder="Tu nombre" />
        </UFormField>

        <UFormField label="Email" name="email" required>
          <UInput name="email" type="email" placeholder="tu@empresa.com" />
        </UFormField>

        <UFormField label="Mensaje" name="message" required>
          <UTextarea name="message" placeholder="¿En qué podemos ayudarte?" rows="5" />
        </UFormField>

        <UButton type="submit" color="primary" block>Enviar Mensaje</UButton>
      </UForm>
    </UCard>

    <div v-else class="text-center py-10">
      <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-success mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">¡Mensaje enviado!</h2>
      <p class="text-gray-500">Gracias por contactarnos. Te responderemos pronto.</p>
    </div>
  </div>
</template>
