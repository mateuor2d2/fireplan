<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Analytics de Pagos
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Métricas de conversión y rendimiento del proceso de pago
        </p>
      </div>

      <!-- Period Selector -->
      <div class="flex items-center gap-2">
        <UButton
          v-for="period in periods"
          :key="period.value"
          :variant="selectedPeriod === period.value ? 'solid' : 'outline'"
          :color="selectedPeriod === period.value ? 'primary' : 'neutral'"
          size="sm"
          @click="selectedPeriod = period.value"
        >
          {{ period.label }}
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-8"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 animate-spin mx-auto text-blue-600"
      />
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Cargando analytics...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="text-center py-8"
    >
      <UIcon
        name="i-heroicons-exclamation-triangle"
        class="w-8 h-8 mx-auto text-red-600"
      />
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        {{ error }}
      </p>
    </div>

    <!-- Analytics Content -->
    <div
      v-else-if="analyticsData"
      class="space-y-6"
    >
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Ingresos Totales
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                €{{ formatNumber(analyticsData.metrics.totalRevenue) }}
              </p>
            </div>
            <UIcon
              name="i-heroicons-currency-euro"
              class="w-8 h-8 text-green-600"
            />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tasa de Conversión
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ formatPercentage(analyticsData.funnel.conversionRates.overall_conversion_rate) }}
              </p>
            </div>
            <UIcon
              name="i-heroicons-chart-bar"
              class="w-8 h-8 text-blue-600"
            />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tiempo Promedio
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ analyticsData.metrics.averageProcessingTime }}s
              </p>
            </div>
            <UIcon
              name="i-heroicons-clock"
              class="w-8 h-8 text-yellow-600"
            />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Intentos de Pago
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ analyticsData.metrics.paymentAttempts }}
              </p>
            </div>
            <UIcon
              name="i-heroicons-credit-card"
              class="w-8 h-8 text-purple-600"
            />
          </div>
        </UCard>
      </div>

      <!-- Conversion Funnel -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Embudo de Conversión
          </h3>
        </template>

        <div class="space-y-4">
          <div
            v-for="(step, index) in funnelSteps"
            :key="step.key"
            class="flex items-center gap-4"
          >
            <div class="flex-shrink-0">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                :class="getStepColor(step.key)"
              >
                {{ index + 1 }}
              </div>
            </div>

            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ step.label }}
                </span>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ analyticsData.funnel.funnel[step.key] || 0 }}
                </span>
              </div>

              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-300"
                  :class="getStepColor(step.key)"
                  :style="{ width: getStepPercentage(step.key) + '%' }"
                />
              </div>

              <div class="flex items-center justify-between mt-1">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatPercentage(getStepPercentage(step.key)) }}
                </span>
                <span
                  v-if="step.conversionRate"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ formatPercentage(step.conversionRate) }} conversión
                </span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Device Analytics -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Análisis por Dispositivo
          </h3>
        </template>

        <div class="space-y-4">
          <div
            v-for="device in analyticsData.devices"
            :key="device.device"
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <UIcon
                :name="getDeviceIcon(device.device)"
                class="w-5 h-5"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ getDeviceLabel(device.device) }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ device.total }} intentos
                </p>
              </div>
            </div>

            <div class="text-right">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatPercentage(device.successRate) }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                tasa de éxito
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Time Series Chart -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Tendencias de Tiempo
          </h3>
        </template>

        <div class="h-64">
          <div class="w-full h-full flex items-end gap-2">
            <div
              v-for="(data, index) in analyticsData.timeData"
              :key="data.timestamp"
              class="flex-1 flex flex-col items-center gap-2"
            >
              <div class="w-full flex items-end justify-center gap-1">
                <div
                  class="w-1/2 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                  :style="{ height: Math.max((data.checkout_started / Math.max(...analyticsData.timeData.map(d => d.checkout_started))) * 100, 5) + '%' }"
                  :title="`Inicios: ${data.checkout_started}`"
                />
                <div
                  class="w-1/2 bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                  :style="{ height: Math.max((data.payment_succeeded / Math.max(...analyticsData.timeData.map(d => d.payment_succeeded))) * 100, 5) + '%' }"
                  :title="`Éxitos: ${data.payment_succeeded}`"
                />
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400 text-center">
                {{ formatTimeLabel(data.timestamp) }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-center gap-4 mt-4">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-blue-500 rounded" />
            <span class="text-sm text-gray-600 dark:text-gray-400">Inicios</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-green-500 rounded" />
            <span class="text-sm text-gray-600 dark:text-gray-400">Éxitos</span>
          </div>
        </div>
      </UCard>

      <!-- Error Breakdown -->
      <UCard v-if="Object.keys(analyticsData.metrics.errorBreakdown).length > 0">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Análisis de Errores
          </h3>
        </template>

        <div class="space-y-3">
          <div
            v-for="(count, error) in analyticsData.metrics.errorBreakdown"
            :key="error"
            class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
          >
            <div>
              <p class="font-medium text-red-800 dark:text-red-200">
                {{ getErrorLabel(error) }}
              </p>
              <p class="text-sm text-red-600 dark:text-red-300">
                {{ count }} errores
              </p>
            </div>
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-5 h-5 text-red-600"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  planId?: string
}

const props = defineProps<Props>()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const analyticsData = ref<any>(null)
const selectedPeriod = ref('7d')

// Period options
const periods = [
  { label: '24h', value: '1d' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: '1a', value: '1y' }
]

// Funnel steps configuration
const funnelSteps = [
  { key: 'checkout_started', label: 'Inicio de Checkout', conversionRate: null },
  { key: 'payment_modal_opened', label: 'Modal Abierto', conversionRate: 'modal_open_rate' },
  { key: 'payment_attempted', label: 'Intento de Pago', conversionRate: 'payment_attempt_rate' },
  { key: 'payment_succeeded', label: 'Pago Exitoso', conversionRate: 'payment_success_rate' },
  { key: 'checkout_completed', label: 'Checkout Completo', conversionRate: null }
]

// Load analytics data
const loadAnalytics = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await $fetch(`/api/payments/analytics?period=${selectedPeriod.value}${props.planId ? `&planId=${props.planId}` : ''}`)
    analyticsData.value = response.data
  } catch (err: any) {
    error.value = err.message || 'Error al cargar analytics'
    console.error('Analytics load error:', err)
  } finally {
    loading.value = false
  }
}

// Format helpers
const formatNumber = (num: number): string => {
  return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatPercentage = (percent: number): string => {
  return percent.toFixed(1) + '%'
}

const getStepPercentage = (stepKey: string): number => {
  const funnel = analyticsData.value?.funnel?.funnel || {}
  const started = funnel.checkout_started || 0
  const current = funnel[stepKey] || 0
  return started > 0 ? (current / started) * 100 : 0
}

const getStepColor = (stepKey: string): string => {
  const colors = {
    checkout_started: 'bg-blue-500',
    payment_modal_opened: 'bg-indigo-500',
    payment_attempted: 'bg-yellow-500',
    payment_succeeded: 'bg-green-500',
    checkout_completed: 'bg-purple-500'
  }
  return colors[stepKey as keyof typeof colors] || 'bg-gray-500'
}

const getDeviceIcon = (device: string): string => {
  const icons = {
    desktop: 'i-heroicons-computer-desktop',
    mobile: 'i-heroicons-device-phone-mobile',
    tablet: 'i-heroicons-device-tablet'
  }
  return icons[device as keyof typeof icons] || 'i-heroicons-question-mark-circle'
}

const getDeviceLabel = (device: string): string => {
  const labels = {
    desktop: 'Escritorio',
    mobile: 'Móvil',
    tablet: 'Tablet'
  }
  return labels[device as keyof typeof labels] || device
}

const getErrorLabel = (error: string): string => {
  const labels = {
    card_declined: 'Tarjeta Rechazada',
    insufficient_funds: 'Fondos Insuficientes',
    incorrect_cvc: 'CVC Incorrecto',
    expired_card: 'Tarjeta Expirada',
    processing_error: 'Error de Procesamiento',
    network_error: 'Error de Red'
  }
  return labels[error as keyof typeof labels] || error
}

const formatTimeLabel = (timestamp: string): string => {
  const date = new Date(timestamp)
  if (selectedPeriod.value === '1d') {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  } else if (selectedPeriod.value === '7d' || selectedPeriod.value === '30d') {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  } else {
    return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
  }
}

// Watch for period changes
watch(selectedPeriod, () => {
  loadAnalytics()
})

// Load analytics on mount
onMounted(() => {
  loadAnalytics()
})
</script>
