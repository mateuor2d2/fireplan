<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Crear Cuenta - Prevenius',
  description: 'Crea tu cuenta gratuita en Prevenius y empieza a gestionar tus planes de seguridad. Prueba gratuita de 14 días.'
})

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  error.value = ''

  // Validaciones
  if (form.password !== form.confirmPassword) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  if (form.password.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  if (!form.acceptTerms) {
    error.value = 'Debes aceptar los términos y condiciones'
    return
  }

  loading.value = true

  try {
    const { data } = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        password: form.password
      }
    })

    if (data) {
      await navigateTo('/login')
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Error al crear la cuenta'
  } finally {
    loading.value = false
  }
}

const loginWithGoogle = async () => {
  await navigateTo('/api/auth/google', { external: true })
}

const loginWithGitHub = async () => {
  await navigateTo('/api/auth/github', { external: true })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Crear cuenta
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          ¿Ya tienes cuenta?
          <NuxtLink
            to="/login"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            Inicia sesión
          </NuxtLink>
        </p>
      </div>

      <form
        class="mt-8 space-y-6"
        @submit.prevent="handleRegister"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Nombre completo</label>
            <UInput
              v-model="form.name"
              type="text"
              placeholder="Juan García"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <UInput
              v-model="form.email"
              type="email"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Contraseña</label>
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
            <UInput
              v-model="form.confirmPassword"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div class="flex items-center">
            <UCheckbox
              v-model="form.acceptTerms"
              required
            />
            <label class="ml-2 block text-sm text-gray-900">
              Acepto los
              <a
                href="#"
                class="text-blue-600 hover:text-blue-500"
              >Términos y condiciones</a>
              y la
              <a
                href="#"
                class="text-blue-600 hover:text-blue-500"
              >Política de privacidad</a>
            </label>
          </div>
        </div>

        <div
          v-if="error"
          class="text-red-600 text-sm text-center"
        >
          {{ error }}
        </div>

        <div>
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            class="w-full"
          >
            Crear cuenta
          </UButton>
        </div>
      </form>

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-50 text-gray-500">O continúa con</span>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <div>
            <UButton
              color="white"
              variant="outline"
              class="w-full"
              @click="loginWithGoogle"
            >
              <Icon
                name="logos:google-icon"
                class="w-5 h-5 mr-2"
              />
              Google
            </UButton>
          </div>
          <div>
            <UButton
              color="white"
              variant="outline"
              class="w-full"
              @click="loginWithGitHub"
            >
              <Icon
                name="logos:github-icon"
                class="w-5 h-5 mr-2"
              />
              GitHub
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
