<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Unirse a la Obra - Prevenius',
  description: 'Únete a la obra escaneando el código QR de Prevenius.'
})

const toast = useToast()
const router = useRouter()
const route = useRoute()
const loading = ref(false)

const planId = computed(() => route.query.planId as string)
const slug = computed(() => route.query.slug as string)

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
})

type Schema = z.output<typeof schema>

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
  placeholder: 'Crea una contraseña'
}]

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (!planId.value || !slug.value) {
    toast.add({ title: 'Error', description: 'QR inválido. Faltan datos del plan.', color: 'error' })
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/qr-join', {
      method: 'POST',
      body: {
        planId: planId.value,
        slug: slug.value,
        name: payload.data.name,
        email: payload.data.email,
        password: payload.data.password
      }
    })

    toast.add({
      title: '¡Bienvenido!',
      description: 'Te has unido a la obra correctamente.',
      color: 'success'
    })

    await router.push('/protected/logged')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Error al unirse a la obra',
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
    title="Unirse a la Obra"
    icon="i-lucide-qr-code"
    :submit="{ label: 'Crear cuenta y unirme' }"
    :loading="loading"
    @submit="onSubmit"
  >
    <template #description>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Escaneaste un código QR de Prevenius. Crea tu cuenta para acceder a la obra como colaborador.
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
