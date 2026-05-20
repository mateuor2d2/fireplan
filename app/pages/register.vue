<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Crear Cuenta - FirePlan',
  description: 'Crea tu cuenta en FirePlan y empieza a gestionar tu plan de emergencia y autoprotección.'
})

const toast = useToast()
const router = useRouter()

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: undefined,
  email: undefined,
  password: undefined,
  confirmPassword: undefined
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        name: event.data.name,
        email: event.data.email,
        password: event.data.password
      }
    })
    toast.add({
      title: '¡Cuenta creada!',
      description: 'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.',
      color: 'success'
    })
    await router.push('/login')
  } catch (error: any) {
    toast.add({
      title: 'Error al crear cuenta',
      description: error.data?.message || error.message || 'Ha ocurrido un error',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-container">
    <div class="register-header">
      <LogoPro class="register-logo" />
      <h1 class="register-title">Crear Cuenta</h1>
      <p class="register-subtitle">Únete a FirePlan y gestiona tu plan de emergencia</p>
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="register-form"
      @submit="onSubmit"
    >
      <UFormField label="Nombre" name="name">
        <UInput
          v-model="state.name"
          placeholder="Tu nombre"
          icon="i-heroicons-user"
          autocomplete="name"
        />
      </UFormField>

      <UFormField label="Email" name="email">
        <UInput
          v-model="state.email"
          type="email"
          placeholder="tu@empresa.com"
          icon="i-heroicons-envelope"
          autocomplete="email"
        />
      </UFormField>

      <UFormField label="Contraseña" name="password">
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

      <div class="register-actions">
        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          :loading="loading"
        >
          Crear Cuenta
        </UButton>
      </div>

      <div class="register-links">
        <p class="login-prompt">
          ¿Ya tienes cuenta?
          <UButton
            to="/login"
            variant="link"
            color="primary"
            size="sm"
          >
            Inicia sesión
          </UButton>
        </p>
      </div>
    </UForm>
  </div>
</template>

<style scoped>
.register-container {
  width: 100%;
  max-width: 400px;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
}

.register-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.register-subtitle {
  font-size: 0.875rem;
  color: var(--ui-text-dimmed);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.register-actions {
  margin-top: 0.5rem;
}

.register-links {
  text-align: center;
  margin-top: 1rem;
}

.login-prompt {
  font-size: 0.875rem;
  color: var(--ui-text-dimmed);
}
</style>
