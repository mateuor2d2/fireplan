<script setup lang="ts">
useSeoMeta({
  title: 'Soporte Técnico - Prevenius',
  description: 'Obtén ayuda con tus planes de seguridad en construcción. Documentación completa, soporte técnico por email y chat en vivo disponible.'
})

const contactMethods = [
  {
    title: 'Documentación',
    description: 'Guías completas y tutoriales paso a paso para dominar todas las funcionalidades de Prevenius.',
    icon: 'i-lucide-book-open',
    link: '/docs',
    linkText: 'Ver documentación'
  },
  {
    title: 'Soporte por Email',
    description: 'Nuestro equipo técnico responde en un plazo de 24-48 horas para resolver cualquier duda o problema.',
    icon: 'i-lucide-mail',
    link: 'mailto:support@prevenius.com',
    linkText: 'Enviar email'
  },
  {
    title: 'Chat en Vivo',
    description: 'Disponible en horario laboral (L-V, 9:00-18:00) para consultas rápidas.',
    icon: 'i-lucide-message-circle',
    linkText: 'Disponible próximamente',
    disabled: true
  }
]

const faqItems = [
  {
    label: '¿Cómo creo un plan de seguridad?',
    content: 'Accede a la sección "Planes" desde el dashboard, haz clic en "Nuevo Plan" y sigue el asistente paso a paso. Puedes importar datos de proyectos anteriores o empezar desde cero con nuestras plantillas.'
  },
  {
    label: '¿Puedo exportar a PDF?',
    content: 'Sí, todos los planes de seguridad se pueden exportar a PDF con formato profesional listo para imprimir o enviar digitalmente. La exportación incluye todas las secciones, firmas y códigos QR.'
  },
  {
    label: '¿Puedo personalizar las plantillas?',
    content: 'Los planes Profesional y Empresa permiten personalizar plantillas existentes y crear nuevas plantillas personalizadas adaptadas a tus necesidades específicas. Puedes añadir secciones, campos y formatos personalizados.'
  },
  {
    label: '¿Cómo funcionan los códigos QR?',
    content: 'Cada plan genera automáticamente un código QR único que puedes imprimir y colocar en la obra. Al escanearlo, los técnicos pueden reportar incidencias y verificar el cumplimiento desde sus móviles sin necesidad de login.'
  },
  {
    label: '¿Mis datos están seguros?',
    content: 'Absolutamente. Utilizamos encriptación SSL/TLS para todas las comunicaciones, almacenamos los datos en servidores certificados en Europa (GDPR compliant) y realizamos copias de seguridad diarias automáticas.'
  }
]
</script>

<template>
  <div>
    <UPageHero
      title="Soporte Técnico"
      description="¿Necesitas ayuda? Estamos aquí para asistirte. Encuentra recursos, documentación y contacto directo con nuestro equipo."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <UContainer>
      <UPageGrid class="py-12">
        <UPageCard
          v-for="method in contactMethods"
          :key="method.title"
          :title="method.title"
          :description="method.description"
          :icon="method.icon"
          spotlight
        >
          <template v-if="!method.disabled" #footer>
            <NuxtLink :to="method.link">
              <UButton
                :label="method.linkText"
                color="neutral"
                variant="subtle"
                icon="i-lucide-arrow-right"
                trailing
              />
            </NuxtLink>
          </template>
          <template v-else #footer>
            <UButton
              :label="method.linkText"
              color="neutral"
              variant="subtle"
              disabled
            />
          </template>
        </UPageCard>
      </UPageGrid>
    </UContainer>

    <USeparator />

    <UPageSection
      title="Preguntas Frecuentes"
      description="Respuestas rápidas a las preguntas más comunes sobre el uso de Prevenius."
    >
      <UAccordion
        :items="faqItems"
        multiple
        class="max-w-4xl mx-auto"
      />
    </UPageSection>

    <USeparator />

    <UPageSection>
      <UPageCard variant="subtle" class="max-w-2xl mx-auto">
        <div class="text-center">
          <UIcon name="i-lucide-headphones" class="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 class="text-xl font-semibold mb-2">¿No encuentras lo que buscas?</h2>
          <p class="text-gray-600 mb-6">
            Nuestro equipo de soporte está disponible para ayudarte con cualquier consulta específica sobre tu cuenta o proyectos.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <UButton
              to="mailto:support@prevenius.com"
              label="Contactar por Email"
              icon="i-lucide-mail"
              size="lg"
            />
            <UButton
              to="/contact"
              label="Formulario de Contacto"
              color="neutral"
              variant="outline"
              icon="i-lucide-message-square"
              size="lg"
            />
          </div>
        </div>
      </UPageCard>
    </UPageSection>
  </div>
</template>
