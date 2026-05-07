<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useUserStore } from '~/stores/user'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Iniciar Sesión - Prevenius',
  description: 'Accede a tu cuenta de Prevenius para gestionar tus planes de seguridad en construcción.'
})

const toast = useToast()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// Check for OAuth errors and verification pending
onMounted(() => {
  const error = route.query.error
  if (error) {
    toast.add({
      title: 'Error de autenticación',
      description: decodeURIComponent(error as string),
      color: 'error'
    })
  }

  if (route.query.verified === 'pending') {
    toast.add({
      title: 'Verifica tu email',
      description: 'Te hemos enviado un email de verificación. Revisa tu bandeja de entrada para activar tu cuenta.',
      color: 'info',
      duration: 10000
    })
  }
})

const fields = [{
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Tu email',
  required: true
}, {
  name: 'password',
  label: 'Contraseña',
  type: 'password' as const,
  placeholder: 'Tu contraseña'
}, {
  name: 'remember',
  label: 'Recordarme',
  type: 'checkbox' as const
}]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: async () => {
    await navigateTo('/api/auth/google', { external: true })
  }
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  onClick: async () => {
    await navigateTo('/api/auth/github', { external: true })
  }
}]

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    await userStore.login(payload.data.email, payload.data.password)

    toast.add({
      title: 'Sesión iniciada',
      description: 'Has iniciado sesión correctamente.',
      color: 'success'
    })

    // Redirect to dashboard or home page
    await router.push('/protected/logged')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Login failed',
      color: 'error'
    })
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    :providers="providers"
    title="Bienvenido de nuevo"
    icon="i-lucide-lock"
    @submit="onSubmit"
  >
    <template #description>
      ¿No tienes cuenta? <ULink
        to="/signup"
        class="text-primary font-medium"
      >Regístrate gratis</ULink>.
    </template>

    <template #password-hint>
      <span class="text-sm text-gray-600 dark:text-gray-400">
        ¿Olvidaste tu contraseña?
      </span>
      <ULink
        to="/forgot-password"
        class="text-primary font-medium"
      >
        Restablecer contraseña
      </ULink>
    </template>

    <template #footer>
      Al iniciar sesión, aceptas nuestros <ULink
        to="/"
        class="text-primary font-medium"
      >Términos de Servicio</ULink>.
    </template>
  </UAuthForm>
</template>
