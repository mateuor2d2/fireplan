<script setup lang="ts">
const route = useRoute()
const token = ref(route.query.token || '')
const password = ref('')
const confirmPassword = ref('')
const isSubmitted = ref(false)
const isLoading = ref(false)
const error = ref('')

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Nueva Contraseña - Prevenius',
  description: 'Establece tu nueva contraseña para recuperar el acceso a tu cuenta de Prevenius.'
})

// Validate password strength
const passwordStrength = computed(() => {
  if (!password.value) return 0
  let strength = 0
  if (password.value.length >= 8) strength += 1
  if (/[A-Z]/.test(password.value)) strength += 1
  if (/[0-9]/.test(password.value)) strength += 1
  if (/[^A-Za-z0-9]/.test(password.value)) strength += 1
  return strength
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength === 0) return 'Muy débil'
  if (strength === 1) return 'Débil'
  if (strength === 2) return 'Moderada'
  if (strength === 3) return 'Fuerte'
  return 'Muy fuerte'
})

const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'red'
  if (strength <= 2) return 'orange'
  if (strength <= 3) return 'yellow'
  return 'emerald'
})

const validate = () => {
  error.value = ''

  if (!password.value) {
    error.value = 'La contraseña es obligatoria'
    return false
  }

  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres'
    return false
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validate()) return

  isLoading.value = true

  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value
      }
    })
    isSubmitted.value = true
  } catch (err: any) {
    error.value = err.data?.message || 'Ha ocurrido un error. Por favor, inténtalo de nuevo.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UCard class="max-w-sm w-full bg-white/75 dark:bg-white/5 backdrop-blur">
    <template #header>
      <div class="text-center">
        <UIcon
          name="i-heroicons-key"
          class="w-8 h-8 mx-auto text-primary-500"
        />
        <h1 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          Nueva Contraseña
        </h1>
        <p
          v-if="!isSubmitted"
          class="mt-2 text-sm text-gray-600 dark:text-gray-300"
        >
          Introduce tu nueva contraseña.
        </p>
      </div>
    </template>

    <div v-if="!isSubmitted">
      <UForm
        :state="{ password, confirmPassword }"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField
          label="Nueva contraseña"
          name="password"
        >
          <UInput
            v-model="password"
            type="password"
            placeholder="Introduce tu nueva contraseña"
            :ui="{
              base: 'form-input',
              focus: 'focus:ring-emerald-500 focus:border-emerald-500'
            }"
            required
          />
          <template #description>
            <div class="mt-1">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500 dark:text-gray-400">Seguridad de la contraseña:</span>
                <span
                  class="text-xs font-medium"
                  :class="{
                    'text-red-500': passwordStrength <= 1,
                    'text-orange-500': passwordStrength === 2,
                    'text-yellow-500': passwordStrength === 3,
                    'text-emerald-500': passwordStrength >= 4
                  }"
                >
                  {{ passwordStrengthText }}
                </span>
              </div>
              <div class="mt-1 flex space-x-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-1 flex-1 rounded-full"
                  :class="{
                    'bg-red-500': passwordStrength === 0,
                    'bg-orange-500': passwordStrength === 1,
                    'bg-yellow-500': passwordStrength === 2,
                    'bg-emerald-500': passwordStrength >= 3,
                    'bg-gray-200 dark:bg-gray-700': i > passwordStrength
                  }"
                />
              </div>
            </div>
          </template>
        </UFormField>

        <UFormField
          label="Confirmar nueva contraseña"
          name="confirmPassword"
        >
          <UInput
            v-model="confirmPassword"
            type="password"
            placeholder="Confirma tu nueva contraseña"
            :ui="{
              base: 'form-input',
              focus: 'focus:ring-emerald-500 focus:border-emerald-500'
            }"
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
          Guardar contraseña
        </UButton>

        <div
          v-if="error"
          class="mt-4 text-sm text-red-500 text-center"
        >
          {{ error }}
        </div>
      </UForm>
    </div>

    <div
      v-else
      class="text-center"
    >
      <UIcon
        name="i-heroicons-check-circle"
        class="w-12 h-12 mx-auto text-emerald-500"
      />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        Contraseña actualizada
      </h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Tu contraseña se ha actualizado correctamente.
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
