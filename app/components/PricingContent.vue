<script setup lang="ts">
const isYearly = ref(false)
const toast = useToast()
const userStore = useUserStore()
const router = useRouter()

async function startCheckout(planId: string) {
  if (!userStore.loggedIn) {
    return router.push(`/login?redirect=/pricing&plan=${planId}`)
  }
  try {
    const { url } = await $fetch('/api/billing/checkout', {
      method: 'POST',
      body: { planId, yearly: isYearly.value }
    })
    if (url) {
      window.location.href = url
    }
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.data?.statusMessage || 'No se pudo iniciar el pago',
      color: 'error'
    })
  }
}

const plans = computed(() => [
  {
    title: 'Starter',
    description: 'Prueba Prevenius gratis. Ideal para obras pequeñas o para evaluar la plataforma.',
    price: '€0',
    billingPeriod: '/ mes',
    features: [
      '1 plan de seguridad',
      '1 usuario',
      'Plantillas básicas',
      'Exportación PDF',
      'Códigos QR',
      'Evaluación de riesgos básica'
    ],
    exclusions: ['Gestión de incidencias/anomalías'],
    button: { label: 'Empezar Gratis', color: 'neutral', variant: 'subtle' as const, to: '/signup' },
    variant: 'outline' as const
  },
  {
    title: 'Profesional',
    description: 'Para autónomos, ingenieros y arquitectos freelance con varias obras.',
    price: isYearly.value ? '€66' : '€79',
    billingPeriod: isYearly.value ? '/ mes (facturación anual)' : '/ mes',
    tagline: isYearly.value ? '€790 al año — ahorra €158' : '',
    badge: 'Más Popular',
    highlight: true,
    scale: true,
    features: [
      'Hasta 5 planes de seguridad',
      '3 usuarios',
      'Todas las plantillas',
      'Exportación PDF e impresión',
      'Códigos QR ilimitados',
      'Evaluación de riesgos completa',
      'Presupuestos detallados',
      'Gestión de incidencias/anomalías',
      'Gestión de obra completa',
      'Soporte por email (24h)',
      '10 GB de almacenamiento'
    ],
    variant: 'outline' as const
  },
  {
    title: 'Empresa',
    description: 'Para pymes, consultoras y grandes constructoras. Todo ilimitado.',
    price: isYearly.value ? '€149' : '€179',
    billingPeriod: isYearly.value ? '/ mes (facturación anual)' : '/ mes',
    tagline: isYearly.value ? '€1.790 al año — ahorra €358' : '',
    features: [
      'Planes de seguridad ilimitados',
      'Usuarios ilimitados',
      'Todas las plantillas + personalización avanzada',
      'Exportación PDF, impresión y firma digital',
      'Códigos QR ilimitados',
      'Evaluación de riesgos completa',
      'Presupuestos detallados',
      'Gestión de incidencias/anomalías',
      'Reportes avanzados y auditorías',
      'API para integraciones',
      'Soporte prioritario',
      'Onboarding dedicado',
      'Almacenamiento ilimitado'
    ],
    variant: 'outline' as const
  }
])

const faqItems = [
  {
    label: '¿Los planes de seguridad tienen límite?',
    content: 'Sí, depende de tu plan de suscripción. Starter incluye 1 plan. Profesional incluye hasta 5 planes activos. Empresa incluye planes ilimitados. La diferenciación principal es el volumen de obras y funcionalidades avanzadas.',
    defaultOpen: true
  },
  {
    label: '¿Puedo usar Prevenius gratis?',
    content: 'Sí. El plan Starter te permite crear 1 plan de seguridad completo, exportar PDF y usar códigos QR, totalmente gratis y sin límite de tiempo. Es ideal para obras pequeñas o para evaluar la plataforma antes de suscribirte.'
  },
  {
    label: '¿Puedo cambiar de plan más adelante?',
    content: 'Por supuesto. Puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplican de forma prorrateada según el tiempo restante en tu período de facturación actual.'
  },
  {
    label: '¿Cómo puedo cancelar mi suscripción?',
    content: 'Puedes cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta o desde el portal de facturación. Sin penalizaciones, sin preguntas. Tu acceso continúa hasta el final del período facturado.'
  },
  {
    label: '¿Ofrecen descuento anual?',
    content: 'Sí. Con la facturación anual ahorras aproximadamente 2 meses. Profesional pasa a €66/mes y Empresa a €149/mes.'
  },
  {
    label: '¿Qué tipo de soporte ofrecen?',
    content: 'Starter y Profesional incluyen soporte por email con respuesta en 24h. Empresa incluye soporte prioritario y onboarding dedicado para tu equipo.'
  },
  {
    label: '¿Mis datos están seguros?',
    content: 'Sí. Todos los datos se almacenan en servidores certificados en la UE y se transmiten mediante conexiones encriptadas. Cumplimos con el RGPD y la normativa española de protección de datos.'
  }
]
</script>

<template>
  <div>
    <UPageHero
      title="Planes de Seguridad para Cada Etapa"
      description="Desde gratis hasta ilimitado. Sin sorpresas — paga por los usuarios y obras que necesitas. Soporte en español y datos seguros en la UE."
    >
      <template #links>
        <UTabs
          :model-value="isYearly ? '1' : '0'"
          :items="[{ label: 'Mensual', value: '0' }, { label: 'Anual (ahorra 2 meses)', value: '1' }]"
          color="neutral"
          class="w-72"
          :ui="{ list: 'rounded-full', indicator: 'rounded-full' }"
          @update:model-value="isYearly = $event === '1'"
        />
      </template>
    </UPageHero>

    <UContainer>
      <UPricingPlans scale>
        <UPricingPlan
          v-for="(planItem, index) in plans"
          :key="index"
          v-bind="planItem"
        >
          <template
            v-if="planItem.title !== 'Starter'"
            #action
          >
            <UButton
              :label="planItem.title === 'Profesional' ? 'Comenzar' : 'Contactar Ventas'"
              size="lg"
              color="primary"
              @click="startCheckout(planItem.title.toLowerCase() === 'profesional' ? 'professional' : 'enterprise')"
            />
          </template>
        </UPricingPlan>
      </UPricingPlans>
    </UContainer>

    <UPageSection
      title="Preguntas frecuentes"
      description="Todo lo que necesitas saber sobre nuestros planes."
    >
      <UAccordion
        :items="faqItems"
        multiple
        class="max-w-4xl mx-auto"
      />
    </UPageSection>
  </div>
</template>
