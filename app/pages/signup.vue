<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Crear Cuenta - Prevenius',
  description: 'Crea tu cuenta gratuita en Prevenius y empieza a gestionar tus planes de seguridad. Prueba gratuita de 14 días.'
})

const toast = useToast()
const router = useRouter()
const loading = ref(false)

const fields = [{
  name: 'name',
  type: 'text' as const,
  label: 'Nombre',
  placeholder: 'Tu nombre'
}, {
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Tu email'
}, {
  name: 'password',
  label: 'Contraseña',
  type: 'password' as const,
  placeholder: 'Tu contraseña'
}]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => {
    toast.add({ title: 'Google', description: 'Sign up with Google coming soon' })
  }
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  onClick: () => {
    toast.add({ title: 'GitHub', description: 'Sign up with GitHub coming soon' })
  }
}]

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        name: payload.data.name,
        email: payload.data.email,
        password: payload.data.password
      }
    })

    toast.add({
      title: 'Verifica tu email',
      description: 'Te hemos enviado un email de verificación. Revisa tu bandeja de entrada.',
      color: 'success',
      duration: 8000
    })

    await router.push('/login?verified=pending')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Registration failed',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    :providers="providers"
    title="Crea tu cuenta gratuita"
    :submit="{ label: 'Crear cuenta' }"
    :loading="loading"
    @submit="onSubmit"
  >
    <template #description>
      ¿Ya tienes cuenta? <ULink
        to="/login"
        class="text-primary font-medium"
      >Iniciar sesión</ULink>.
    </template>

    <template #footer>
      Al registrarte, aceptas nuestros <ULink
        to="/"
        class="text-primary font-medium"
      >Términos de Servicio</ULink>.
    </template>
  </UAuthForm>
</template>
