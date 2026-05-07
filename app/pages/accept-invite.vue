<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Aceptar Invitación - Prevenius',
  description: 'Acepta tu invitación y únete a la obra en Prevenius.'
})

const toast = useToast()
const router = useRouter()
const route = useRoute()
const loading = ref(false)

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
})

type Schema = z.output<typeof schema>

const fields = [{
  name: 'name',
  type: 'text' as const,
  label: 'Nombre',
  placeholder: 'Tu nombre'
}, {
  name: 'password',
  label: 'Contraseña',
  type: 'password' as const,
  placeholder: 'Crea una contraseña'
}]

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const token = route.query.token as string
  if (!token) {
    toast.add({ title: 'Error', description: 'Token de invitación no encontrado', color: 'error' })
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/accept-invite', {
      method: 'POST',
      body: {
        token,
        name: payload.data.name,
        password: payload.data.password
      }
    })

    toast.add({
      title: '¡Bienvenido!',
      description: 'Tu cuenta se ha creado correctamente.',
      color: 'success'
    })

    await router.push('/protected/logged')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Error al aceptar la invitación',
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
    title="Aceptar Invitación"
    icon="i-lucide-user-plus"
    :submit="{ label: 'Crear cuenta y unirme' }"
    :loading="loading"
    @submit="onSubmit"
  >
    <template #description>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Completa tu registro para unirte a la obra en Prevenius.
      </p>
    </template>

    <template #footer>
      ¿Ya tienes cuenta? <ULink
        to="/login"
        class="text-primary font-medium"
      >Iniciar sesión</ULink>.
    </template>
  </UAuthForm>
</template>
