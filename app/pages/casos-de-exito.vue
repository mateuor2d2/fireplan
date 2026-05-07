<script setup lang="ts">
useSeoMeta({
  title: 'Casos de Éxito - Prevenius',
  description: 'Descubre cómo empresas constructoras han transformado su gestión de seguridad con Prevenius. Historias reales de éxito en la construcción.'
})

const cases = [
  {
    empresa: 'Construcciones Martínez',
    sector: 'Edificación Residencial',
    icono: 'i-lucide-home',
    desafio: 'Creaban planes de seguridad en Word, tardaban 3-4 días por plan. Errores frecuentes en presupuestos y dificultad para compartir con inspectores.',
    solucion: 'Empezaron con el plan Profesional. Crean planes con plantillas, generan presupuestos automáticos y comparten vía QR.',
    resultado: '80% menos tiempo en crear planes. Cero errores en presupuestos. Pasaron inspecciones sin incidencias.',
    cita: 'Prevenius nos ha permitido reducir el tiempo de creación de planes de seguridad en un 80%. Ahora podemos enfocarnos en la ejecución de la obra.',
    autor: 'Antonio García, Director de Obras'
  },
  {
    empresa: 'Edificar S.A.',
    sector: 'Obra Civil e Infraestructuras',
    icono: 'i-lucide-route',
    desafio: 'Gestionaban más de 10 obras simultáneas con sistemas dispares. Sin visibilidad global del estado de cumplimiento de cada plan.',
    solucion: 'Implementaron el plan Empresa con dashboard centralizado y reportes avanzados para seguimiento en tiempo real.',
    resultado: 'Visibilidad completa de todas las obras. Reducción del 45% en incidencias de seguridad. Auditorías pasadas sin observaciones.',
    cita: 'La plataforma es increíblemente intuitiva. El cumplimiento normativo nunca había sido tan sencillo para nuestro equipo técnico.',
    autor: 'María López, Coordinadora de Seguridad'
  },
  {
    empresa: 'Infraestructuras Urbanas',
    sector: 'Infraestructuras Públicas',
    icono: 'i-lucide-building-2',
    desafio: 'Las auditorías de seguridad eran un proceso estresante. Los planes en papel se deterioraban y eran difíciles de localizar.',
    solucion: 'Digitalizaron todos los planes con Prevenius. Generan QR para acceso instantáneo en obra y comparten con inspectores.',
    resultado: 'Auditorías superadas con excelencia. Tiempo de preparación reducido un 90%. Inspectores destacaron la organización.',
    cita: 'Durante una auditoría, nuestro plan digitalizado de Prevenius impresionó a los inspectores. La organización y accesibilidad facilitó enormemente el proceso.',
    autor: 'Carlos Ruiz, Jefe de Proyecto'
  }
]

const metrics = [
  { value: '+1.000', label: 'Empresas constructoras', icon: 'i-lucide-building-2' },
  { value: '+5.000', label: 'Planes de seguridad generados', icon: 'i-lucide-file-text' },
  { value: '80%', label: 'Ahorro medio en tiempo', icon: 'i-lucide-clock' },
  { value: '45%', label: 'Reducción de incidencias', icon: 'i-lucide-trending-down' }
]
</script>

<template>
  <div>
    <UPageHero
      title="Historias de Éxito en la Construcción"
      description="Descubre cómo empresas como la tuya han transformado su gestión de seguridad con Prevenius."
    >
      <template #top>
        <div class="absolute rounded-full dark:bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80" />
      </template>
    </UPageHero>

    <!-- Metrics Bar -->
    <UContainer class="py-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div v-for="metric in metrics" :key="metric.label" class="text-center">
          <UIcon :name="metric.icon" class="w-8 h-8 text-primary mb-2 mx-auto" />
          <p class="text-3xl font-bold">{{ metric.value }}</p>
          <p class="text-sm text-muted">{{ metric.label }}</p>
        </div>
      </div>
    </UContainer>

    <USeparator />

    <!-- Case Studies -->
    <UPageSection
      v-for="(item, index) in cases"
      :key="item.empresa"
      :title="item.empresa"
      :description="item.sector"
      :orientation="index % 2 === 0 ? 'horizontal' : 'horizontal'"
      :reverse="index % 2 !== 0"
    >
      <UPageCard variant="subtle" class="p-6">
        <div class="space-y-4">
          <div>
            <UBadge :icon="item.icono" variant="subtle" class="mb-2">{{ item.sector }}</UBadge>
          </div>
          <div>
            <h4 class="font-semibold text-error mb-1">Desafío</h4>
            <p class="text-muted">{{ item.desafio }}</p>
          </div>
          <div>
            <h4 class="font-semibold text-primary mb-1">Solución</h4>
            <p class="text-muted">{{ item.solucion }}</p>
          </div>
          <div>
            <h4 class="font-semibold text-success mb-1">Resultado</h4>
            <p class="text-muted">{{ item.resultado }}</p>
          </div>
          <USeparator />
          <blockquote class="border-l-4 border-primary pl-4 italic text-muted">
            "{{ item.cita }}"
          </blockquote>
          <p class="text-sm font-medium">— {{ item.autor }}</p>
        </div>
      </UPageCard>
    </UPageSection>

    <USeparator />

    <UPageCTA
      title="¿Listo para ser el próximo caso de éxito?"
      description="Únete a más de 1.000 empresas constructoras que ya gestionan su seguridad con Prevenius."
      :links="[{
        label: 'Comenzar Prueba Gratis',
        icon: 'i-lucide-user-plus',
        to: '/signup'
      }, {
        label: 'Contactar Ventas',
        icon: 'i-lucide-phone',
        variant: 'subtle',
        to: '/contact'
      }]"
      variant="naked"
      class="overflow-hidden"
    />
  </div>
</template>
