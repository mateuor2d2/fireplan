<script setup lang="ts">
useSeoMeta({
  title: 'Contacto - Prevenius',
  description: 'Contacta con el equipo de Prevenius. Estamos aquí para ayudarte con tus planes de seguridad en construcción.'
})

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const loading = ref(false)

const subjects = [
  { label: 'Información general', value: 'info' },
  { label: 'Demo personalizada', value: 'demo' },
  { label: 'Ventas empresas', value: 'ventas' },
  { label: 'Soporte técnico', value: 'soporte' },
  { label: 'Facturación', value: 'facturacion' },
  { label: 'Otro', value: 'otro' }
]

const handleSubmit = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    Object.assign(form, { name: '', email: '', subject: '', message: '' })
    const toast = useToast()
    toast.add({ title: 'Mensaje enviado', description: 'Nos pondremos en contacto contigo pronto.', color: 'success' })
  } catch (error) {
    console.error('Error al enviar el formulario:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <UPageHero
      title="Contacta con Nosotros"
      description="¿Tienes alguna pregunta? Estamos aquí para ayudarte. Responderemos en menos de 24 horas."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <UPageSection>
      <div class="grid gap-8 lg:grid-cols-2">
        <!-- Form -->
        <UPageCard variant="subtle" class="p-6">
          <h2 class="text-xl font-semibold mb-4">Envíanos un mensaje</h2>
          <form class="space-y-4" @submit.prevent="handleSubmit">
            <UFormField label="Nombre" name="name" required>
              <UInput v-model="form.name" placeholder="Tu nombre completo" />
            </UFormField>
            <UFormField label="Email" name="email" required>
              <UInput v-model="form.email" type="email" placeholder="tu@email.com" />
            </UFormField>
            <UFormField label="Asunto" name="subject" required>
              <USelect v-model="form.subject" :items="subjects" placeholder="Selecciona un asunto" />
            </UFormField>
            <UFormField label="Mensaje" name="message" required>
              <UTextarea v-model="form.message" :rows="4" placeholder="Describe tu consulta..." />
            </UFormField>
            <UButton type="submit" :loading="loading" size="lg" block>
              Enviar mensaje
            </UButton>
          </form>
        </UPageCard>

        <!-- Info -->
        <div class="space-y-6">
          <UPageCard variant="subtle" class="p-6">
            <h2 class="text-xl font-semibold mb-4">Información de contacto</h2>
            <ul class="space-y-4">
              <li class="flex items-start gap-3">
                <UIcon name="i-lucide-mail" class="w-5 h-5 mt-0.5 text-muted" />
                <div>
                  <span class="font-medium">Email:</span><br>
                  <a href="mailto:hola@prevenius.com" class="text-primary">hola@prevenius.com</a>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-lucide-phone" class="w-5 h-5 mt-0.5 text-muted" />
                <div>
                  <span class="font-medium">Teléfono:</span><br>
                  <span>+34 91 123 4567</span>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <UIcon name="i-lucide-clock" class="w-5 h-5 mt-0.5 text-muted" />
                <div>
                  <span class="font-medium">Horario:</span><br>
                  <span>Lunes a Viernes: 9:00 - 18:00</span>
                </div>
              </li>
            </ul>
          </UPageCard>

          <UPageCard variant="subtle" class="p-6 bg-primary/5">
            <h3 class="text-lg font-semibold mb-2">¿Prefieres una demo personalizada?</h3>
            <p class="text-muted mb-4">Agenda una videollamada de 30 minutos con nuestro equipo.</p>
            <UButton to="/signup" icon="i-lucide-calendar" color="neutral" variant="subtle" block>
              Agendar Demo
            </UButton>
          </UPageCard>
        </div>
      </div>
    </UPageSection>
  </div>
</template>
