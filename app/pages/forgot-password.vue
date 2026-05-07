<script setup lang="ts">
const userStore = useUserStore()
const toast = useToast()
const router = useRouter()

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Restablecer Contraseña - Prevenius',
  description: 'Recupera el acceso a tu cuenta de Prevenius. Te enviaremos un enlace para restablecer tu contraseña.'
})

// Component state
const email = ref('')
const isLoading = ref(false)
const isSubmitted = ref(false)
const error = ref('')

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validate email format
const isEmailValid = computed(() => {
  return emailRegex.test(email.value)
})

// Form submission handler
async function handleSubmit() {
  // Validate email is not empty
  if (!email.value || !isEmailValid.value) {
    toast.add({
      title: 'Error de validación',
      description: 'Por favor, introduce un correo electrónico válido',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    // Call userStore.forgotPassword(email)
    await userStore.forgotPassword(email.value)

    // Set success state
    isSubmitted.value = true
  } catch (err: any) {
    console.error('Error sending forgot password email:', err)
    const errorMessage = err.message || 'Error al enviar correo'
    error.value = errorMessage

    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UCard class="max-w-sm w-full bg-white/75 dark:bg-white/5 backdrop-blur">
    <!-- Initial State: Email Form -->
    <template
      v-if="!isSubmitted"
      #header
    >
      <div class="text-center">
        <UIcon
          name="i-heroicons-envelope-key"
          class="w-8 h-8 mx-auto text-primary-500"
        />
        <h1 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          Restablecer Contraseña
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>
    </template>

    <!-- Email Form -->
    <UForm
      v-if="!isSubmitted"
      :state="{ email }"
      class="space-y-4"
      @submit="handleSubmit"
    >
      <UFormField
        label="Correo electrónico"
        name="email"
      >
        <UInput
          v-model="email"
          type="email"
          placeholder="tu@email.com"
          :disabled="isLoading"
          icon="i-heroicons-envelope"
          required
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        block
        :loading="isLoading"
        :disabled="isLoading"
        class="mt-6"
      >
        Enviar enlace de restablecimiento
      </UButton>

      <div
        v-if="error"
        class="mt-4 text-sm text-red-500 dark:text-red-400 text-center"
      >
        {{ error }}
      </div>
    </UForm>

    <!-- Success State -->
    <div
      v-else
      class="text-center"
    >
      <UIcon
        name="i-heroicons-check-circle"
        class="w-12 h-12 mx-auto text-emerald-500"
      />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        Correo enviado
      </h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Hemos enviado un enlace a tu correo electrónico. Sigue las instrucciones para restablecer tu contraseña.
      </p>
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Si no recibes el correo en unos minutos, verifica tu carpeta de spam.
      </p>
      <UButton
        to="/login"
        color="primary"
        variant="soft"
        class="mt-6"
      >
        Volver al inicio
      </UButton>
    </div>
  </UCard>
</template>
