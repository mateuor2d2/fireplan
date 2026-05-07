<template>
  <UModal
    :close="{ onClick: () => emit('close', false) }"
    title="Completar Pago"
    :ui="{
      width: 'sm:max-w-md',
      background: 'bg-white dark:bg-gray-900',
      ring: 'ring-1 ring-gray-200 dark:ring-gray-800'
    }"
  >
    <template #title>
      <div class="flex items-center gap-3">
        <UIcon
          name="i-heroicons-credit-card"
          class="w-5 h-5 text-blue-600"
        />
        <span class="text-lg font-semibold">Completar pago</span>
      </div>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Payment Summary -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                Plan de Seguridad
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Pago único por impresión
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ props.amount }}€
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                IVA incluido
              </p>
            </div>
          </div>
        </div>

        <!-- Security Trust Indicators -->
        <div class="flex items-center justify-center gap-4 py-2">
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UIcon
              name="i-heroicons-lock-closed"
              class="w-4 h-4 text-green-600"
            />
            <span>Pago seguro</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UIcon
              name="i-heroicons-shield-check"
              class="w-4 h-4 text-blue-600"
            />
            <span>Stripe protegido</span>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-if="!isMounted"
          class="text-center py-8"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-8 h-8 animate-spin mx-auto text-blue-600"
          />
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Cargando formulario de pago...
          </p>
        </div>

        <!-- Payment Form -->
        <div class="space-y-4">
          <div
            id="stripe-payment-element"
            class="stripe-element-container"
          />

          <!-- Form Validation Message - only show when mounted -->
          <div
            v-if="isMounted && !isFormComplete"
            class="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
          >
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
            />
            <div class="flex-1">
              <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Complete el formulario
              </p>
              <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Por favor, complete todos los campos del formulario para continuar con el pago.
              </p>
            </div>
          </div>

          <!-- Processing State - only show when mounted -->
          <div
            v-if="isMounted && isProcessing"
            class="flex items-center justify-center gap-3 py-4"
          >
            <UIcon
              name="i-heroicons-arrow-path"
              class="w-5 h-5 animate-spin text-blue-600"
            />
            <span class="text-gray-600 dark:text-gray-400">Procesando pago...</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 pt-4">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="isProcessing"
            class="flex-1"
            @click="emit('close', false)"
          >
            Cancelar
          </UButton>
          <UButton
            color="primary"
            icon="i-heroicons-credit-card"
            :loading="isProcessing"
            :disabled="!isMounted || !isFormComplete || isProcessing"
            class="flex-1"
            @click="confirmPayment"
          >
            Pagar {{ props.amount }}€
          </UButton>
        </div>

        <!-- Footer Trust Message -->
        <div class="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Tus datos de pago son procesados de forma segura por Stripe. No almacenamos tu información de tarjeta.
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
// Payment modal component for handling Stripe payments
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js'
import { useUserStore } from '~/stores/user'
// Enhanced error handling with user-friendly messages
const errorMessages = {
  card_declined: 'Tu tarjeta fue rechazada. Por favor, intenta con otra tarjeta o contacta a tu banco.',
  insufficient_funds: 'Fondos insuficientes. Por favor, usa otra tarjeta o verifica tu saldo.',
  incorrect_cvc: 'El código de seguridad de tu tarjeta es incorrecto. Por favor, verifícalo e intenta nuevamente.',
  expired_card: 'Tu tarjeta ha expirado. Por favor, usa otra tarjeta.',
  processing_error: 'Error al procesar el pago. Por favor, intenta nuevamente en unos momentos.',
  network_error: 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.',
  default: 'Hubo un error al procesar tu pago. Por favor, intenta nuevamente.'
}

function getErrorMessage(errorCode: string): string {
  return errorMessages[errorCode as keyof typeof errorMessages] || errorMessages.default
}

const props = defineProps<{
  clientSecret: string
  amount: number
  publishableKey: string
}>()

const emit = defineEmits<{
  close: [boolean]
  retry: [boolean]
}>()

const userStore = useUserStore()

// Reactive state
const isMounted = ref(false)
const isProcessing = ref(false)
const isFormComplete = ref(false)
const stripeInstance = ref<Stripe | null>(null)
const stripeElements = ref<StripeElements | null>(null)
const stripePaymentElement = ref<StripePaymentElement | null>(null)
const eventSource = ref<EventSource | null>(null)
const isSSEConnected = ref(false)

// Initialize SSE connection
function initializeSSEConnection() {
  try {
    console.log('Initializing SSE connection...')

    // Close existing connection if any
    if (eventSource.value) {
      console.log('Closing existing SSE connection')
      eventSource.value.close()
    }

    // Create new SSE connection
    const eventUrl = '/api/payments/events'
    console.log('Creating SSE connection to:', eventUrl)
    eventSource.value = new EventSource(eventUrl)

    eventSource.value.onopen = () => {
      console.log('SSE connection opened successfully')
      isSSEConnected.value = true
    }

    eventSource.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE message received:', data)

        // Note: onmessage receives all events, but the event type is not available here
        // Use addEventListener for specific event types
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.value.onerror = (error) => {
      console.error('SSE connection error:', error)
      console.error('SSE readyState:', eventSource.value?.readyState)
      isSSEConnected.value = false

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (eventSource.value) {
          console.log('Attempting to reconnect SSE...')
          initializeSSEConnection()
        }
      }, 5000)
    }

    eventSource.value.addEventListener('payment_success', (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('Payment success event received:', data)
        handlePaymentSuccess(data)
      } catch (error) {
        console.error('Error parsing payment success event:', error)
      }
    })

    eventSource.value.addEventListener('payment_failed', (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('Payment failed event received:', data)
        handlePaymentFailure(data)
      } catch (error) {
        console.error('Error parsing payment failed event:', error)
      }
    })

    eventSource.value.addEventListener('connected', (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE connected event received:', data)
        isSSEConnected.value = true
      } catch (error) {
        console.error('Error parsing connected event:', error)
      }
    })

    eventSource.value.addEventListener('heartbeat', (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE heartbeat event received:', data)
      } catch (error) {
        console.error('Error parsing heartbeat event:', error)
      }
    })
  } catch (error) {
    console.error('Error initializing SSE connection:', error)
  }
}

// Handle payment success from SSE
function handlePaymentSuccess(data: any) {
  console.log('Handling payment success:', data)

  // Close SSE connection
  closeSSEConnection()

  // Show success message
  const toast = useToast()
  toast.add({
    title: 'Pago Completado',
    description: 'Tu pago ha sido procesado correctamente',
    color: 'success'
  })

  // Close modal with success
  emit('close', true)
}

// Handle payment failure from SSE with enhanced error handling
function handlePaymentFailure(data: any) {
  console.log('Handling payment failure:', data)

  // Close SSE connection
  closeSSEConnection()

  // Show enhanced error message
  const toast = useToast()
  const errorCode = data.error?.code || 'default'
  const errorMessage = getErrorMessage(errorCode)

  toast.add({
    title: 'Pago Fallido',
    description: errorMessage,
    color: 'error',
    actions: [
      {
        label: 'Reintentar',
        click: () => {
          // Emit event to retry payment
          emit('retry', true)
        }
      }
    ]
  })

  // Close modal with failure
  emit('close', false)
}

// Close SSE connection
function closeSSEConnection() {
  if (eventSource.value) {
    console.log('Closing SSE connection')
    eventSource.value.close()
    eventSource.value = null
    isSSEConnected.value = false
  }
}

// Enhanced payment confirmation with better error handling
async function confirmPayment() {
  try {
    console.log('Confirming payment...', {
      hasStripe: !!stripeInstance.value,
      hasElements: !!stripeElements.value,
      hasPaymentElement: !!stripePaymentElement.value,
      isFormComplete: isFormComplete.value
    })

    if (!stripeInstance.value || !stripeElements.value || !stripePaymentElement.value) {
      throw new Error('Stripe no está correctamente inicializado')
    }

    if (!isFormComplete.value) {
      throw new Error('Por favor, complete todos los campos del formulario de pago')
    }

    isProcessing.value = true

    const { error, paymentIntent } = await stripeInstance.value.confirmPayment({
      elements: stripeElements.value,
      redirect: 'if_required',
      confirmParams: {
        return_url: window.location.href,
        payment_method_data: {
          billing_details: {
            email: userStore.user?.email || 'customer@example.com'
          }
        }
      }
    })

    if (error) {
      // Map Stripe error codes to user-friendly messages
      const errorCode = error.code || 'default'
      const errorMessage = getErrorMessage(errorCode)
      throw new Error(errorMessage)
    }

    if (paymentIntent?.status === 'succeeded') {
      // Payment succeeded, but wait for SSE confirmation
      console.log('Payment succeeded on client side, waiting for SSE confirmation...')
      // Don't close modal yet - wait for SSE confirmation
    } else if (paymentIntent?.status === 'processing') {
      // Payment is being processed
      console.log('Payment is processing, waiting for final confirmation...')
      // Show processing state
    } else {
      throw new Error(`Estado del pago: ${paymentIntent?.status || 'desconocido'}`)
    }
  } catch (error: any) {
    console.error('Payment confirmation error:', error)

    // Show specific error message to user
    const toast = useToast()
    toast.add({
      title: 'Error en el pago',
      description: error.message || 'Hubo un error al procesar tu pago',
      color: 'error',
      timeout: 8000
    })

    emit('close', false)
  } finally {
    isProcessing.value = false
  }
}

// Initialize payment element when component is mounted
onMounted(() => {
  // Initialize SSE connection first
  initializeSSEConnection()
  // Then initialize payment element
  initializePaymentElement()
})

// Watch for modal open state and retry mounting when modal is visible
const retryCount = ref(0)
const maxRetries = 10

// Function to attempt mounting with better timing
async function attemptMount(): Promise<boolean> {
  console.log('🔍 [STRIPE] Attempting to mount payment element, attempt:', retryCount.value + 1)

  // Wait for next tick and additional delay for modal rendering
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 200))

  const mountElement = document.getElementById('stripe-payment-element')
  console.log('🔍 [STRIPE] Mount element found:', !!mountElement)

  if (mountElement && stripePaymentElement.value) {
    try {
      stripePaymentElement.value.mount('#stripe-payment-element')

      // Listen for changes in the payment element
      stripePaymentElement.value.on('change', (event) => {
        if (event && typeof event.complete === 'boolean') {
          isFormComplete.value = event.complete
          console.log('🔍 [STRIPE] Form completion status:', event.complete)
        }
      })

      isMounted.value = true
      console.log('✅ [STRIPE] Payment element mounted successfully')
      return true
    } catch (mountError) {
      console.error('❌ [STRIPE] Error mounting payment element:', mountError)
      return false
    }
  }

  return false
}

// Improved initialization function with better retry logic
async function initializePaymentElement() {
  try {
    if (!props.publishableKey) {
      throw new Error('Stripe publishable key is missing')
    }

    const stripe = await loadStripe(props.publishableKey)
    if (!stripe) {
      throw new Error('Failed to load Stripe')
    }

    stripeInstance.value = stripe

    // Create elements
    stripeElements.value = stripe.elements({
      clientSecret: props.clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#3b82f6'
        }
      }
    })

    // Create payment element - configure for card payments only
    stripePaymentElement.value = stripeElements.value.create('payment', {
      layout: {
        type: 'accordion',
        defaultCollapsed: false
      },
      fields: {
        billingDetails: {
          name: 'auto',
          email: 'auto'
        }
      }
    })

    // Initial mount attempt
    const success = await attemptMount()

    if (!success && retryCount.value < maxRetries) {
      // Set up retry interval
      const retryInterval = setInterval(async () => {
        retryCount.value++
        console.log('🔄 [STRIPE] Retry attempt:', retryCount.value)

        const mountSuccess = await attemptMount()

        if (mountSuccess || retryCount.value >= maxRetries) {
          clearInterval(retryInterval)

          if (!mountSuccess) {
            console.error('❌ [STRIPE] Failed to mount payment element after', maxRetries, 'attempts')
            emit('close', false)
          }
        }
      }, 500) // Retry every 500ms
    }
  } catch (error) {
    console.error('❌ [STRIPE] Error initializing payment element:', error)
    emit('close', false)
  }
}

// Cleanup when component is unmounted
onUnmounted(() => {
  try {
    if (stripePaymentElement.value) {
      stripePaymentElement.value.destroy()
    }
  } catch (error) {
    console.warn('Error destroying payment element:', error)
  }

  // Close SSE connection
  closeSSEConnection()
})
</script>

<style scoped>
/* Mobile-optimized payment form */
.stripe-element-container {
  @apply min-h-[120px];
}

@media (min-width: 640px) {
  .stripe-element-container {
    min-height: 100px;
  }
}

/* Ensure Stripe Elements are responsive */
:deep(.StripeElement) {
  @apply w-full;
}

:deep(.StripeElement--invalid) {
  border-color: rgb(252 165 165);
}

:deep(.StripeElement--complete) {
  border-color: rgb(134 239 172);
}

/* Mobile-specific optimizations */
@media (max-width: 640px) {
  .stripe-element-container {
    @apply min-h-[140px];
  }

  /* Make buttons more touch-friendly on mobile */
  button {
    @apply min-h-[44px];
    font-size: 1rem;
    line-height: 1.5rem;
  }
}

/* Loading animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse-slow {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
