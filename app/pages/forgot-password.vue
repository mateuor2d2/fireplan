<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Restablecer Contraseña - FirePlan',
  description: 'Recupera el acceso a tu cuenta de FirePlan. Te enviaremos un enlace para restablecer tu contraseña.'
})

const toast = useToast()
const sent = ref(false)
const loading = ref(false)

const schema = z.object({
  email: z.string().email('Email inválido')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  email: undefined
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: event.data.email }
    })
    sent.value = true
    toast.add({
      title: 'Email enviado',
      description: 'Revisa tu correo para restablecer tu contraseña.',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'No se pudo enviar el email',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="forgot-container">
    <div class="forgot-header">
      <LogoPro class="forgot-logo" />
      <h1 class="forgot-title">¿Olvidaste tu contraseña?</h1>
      <p class="forgot-subtitle">Te enviaremos un enlace para restablecerla</p>
    </div>

    <div v-if="sent" class="sent-message">
      <UIcon name="i-heroicons-check-circle" class="sent-icon" />
      <p>Hemos enviado un enlace a tu email.</p>
      <UButton to="/login" color="primary" block>Volver al login</UButton>
    </div>

    <UForm
      v-else
      :schema="schema"
      :state="state"
      class="forgot-form"
      @submit="onSubmit"
    >
      <UFormField label="Email" name="email">
        <UInput
          v-model="state.email"
          type="email"
          placeholder="tu@empresa.com"
          icon="i-heroicons-envelope"
          autocomplete="email"
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        size="lg"
        block
        :loading="loading"
      >
        Enviar Enlace
      </UButton>

      <div class="forgot-links">
        <UButton
          to="/login"
          variant="link"
          color="neutral"
          size="sm"
        >
          Volver al login
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<style scoped>
.forgot-container {
  width: 100%;
  max-width: 400px;
}

.forgot-header {
  text-align: center;
  margin-bottom: 2rem;
}

.forgot-logo {
  width: 200px;
  height: auto;
  margin: 0 auto 1rem;
}

.forgot-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.forgot-subtitle {
  font-size: 0.875rem;
  color: var(--ui-text-dimmed);
}

.forgot-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sent-message {
  text-align: center;
  padding: 2rem 0;
}

.sent-icon {
  width: 3rem;
  height: 3rem;
  color: var(--ui-success);
  margin-bottom: 1rem;
}

.forgot-links {
  text-align: center;
  margin-top: 1rem;
}
</style>
