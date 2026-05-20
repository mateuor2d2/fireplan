<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Nueva Contraseña - FirePlan',
  description: 'Establece tu nueva contraseña para recuperar el acceso a tu cuenta de FirePlan.'
})

const toast = useToast()
const router = useRouter()
const route = useRoute()

const token = route.query.token as string
const loading = ref(false)
const success = ref(false)

const schema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  password: undefined,
  confirmPassword: undefined
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!token) {
    toast.add({
      title: 'Error',
      description: 'Token inválido o expirado',
      color: 'error'
    })
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token,
        password: event.data.password
      }
    })
    success.value = true
    toast.add({
      title: 'Contraseña actualizada',
      description: 'Tu contraseña ha sido restablecida correctamente.',
      color: 'success'
    })
    setTimeout(() => router.push('/login'), 2000)
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'No se pudo restablecer la contraseña',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="reset-container">
    <div class="reset-header">
      <LogoPro class="reset-logo" />
      <h1 class="reset-title">Nueva Contraseña</h1>
      <p class="reset-subtitle">Establece una nueva contraseña para tu cuenta</p>
    </div>

    <div v-if="success" class="success-message">
      <UIcon name="i-heroicons-check-circle" class="success-icon" />
      <p>Contraseña actualizada correctamente.</p>
      <p class="redirect-text">Redirigiendo al login...</p>
    </div>

    <UForm
      v-else
      :schema="schema"
      :state="state"
      class="reset-form"
      @submit="onSubmit"
    >
      <UFormField label="Nueva Contraseña" name="password">
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          icon="i-heroicons-lock-closed"
          autocomplete="new-password"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
              :padded="false"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UFormField label="Confirmar Contraseña" name="confirmPassword">
        <UInput
          v-model="state.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="••••••••"
          icon="i-heroicons-lock-closed"
          autocomplete="new-password"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              :icon="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
              :padded="false"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        size="lg"
        block
        :loading="loading"
      >
        Restablecer Contraseña
      </UButton>
    </UForm>
  </div>
</template>

<style scoped>
.reset-container {
  width: 100%;
  max-width: 400px;
}

.reset-header {
  text-align: center;
  margin-bottom: 2rem;
}

.reset-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
}

.reset-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.reset-subtitle {
  font-size: 0.875rem;
  color: var(--ui-text-dimmed);
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.success-message {
  text-align: center;
  padding: 2rem 0;
}

.success-icon {
  width: 3rem;
  height: 3rem;
  color: var(--ui-success);
  margin-bottom: 1rem;
}

.redirect-text {
  font-size: 0.875rem;
  color: var(--ui-text-dimmed);
  margin-top: 0.5rem;
}
</style>
