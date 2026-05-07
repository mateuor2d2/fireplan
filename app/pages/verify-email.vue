<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Verificar Email - Prevenius',
  description: 'Verifica tu dirección de email para activar tu cuenta de Prevenius.'
})

const route = useRoute()
const router = useRouter()

const status = ref<'loading' | 'success' | 'error'>('loading')

onMounted(async () => {
  const token = route.query.token as string
  if (!token) {
    status.value = 'error'
    return
  }

  try {
    await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: { token }
    })
    status.value = 'success'
  } catch {
    status.value = 'error'
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <UCard class="w-full max-w-md">
      <div class="text-center space-y-4">
        <div v-if="status === 'loading'">
          <UIcon name="i-lucide-loader-2" class="text-4xl text-primary animate-spin mb-4" />
          <h2 class="text-xl font-semibold">Verificando tu email...</h2>
        </div>

        <div v-else-if="status === 'success'">
          <UIcon name="i-lucide-check-circle" class="text-4xl text-green-500 mb-4" />
          <h2 class="text-xl font-semibold">Email verificado</h2>
          <p class="text-gray-600 dark:text-gray-400">
            Tu cuenta ha sido activada correctamente. Ya puedes iniciar sesión.
          </p>
          <UButton
            label="Iniciar sesión"
            to="/login"
            class="mt-4"
          />
        </div>

        <div v-else>
          <UIcon name="i-lucide-x-circle" class="text-4xl text-red-500 mb-4" />
          <h2 class="text-xl font-semibold">Enlace inválido o expirado</h2>
          <p class="text-gray-600 dark:text-gray-400">
            El enlace de verificación no es válido o ha expirado. Puedes registrarte de nuevo o solicitar uno nuevo.
          </p>
          <div class="flex gap-3 justify-center mt-4">
            <UButton
              label="Registrarse"
              to="/signup"
              variant="outline"
            />
            <UButton
              label="Iniciar sesión"
              to="/login"
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
