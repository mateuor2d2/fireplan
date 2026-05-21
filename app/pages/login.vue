<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Iniciar Sesión - FirePlan',
  description: 'Accede a tu cuenta de FirePlan para gestionar tu plan de emergencia y autoprotección.'
})

const toast = useToast()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  const error = route.query.error
  if (error) {
    toast.add({
      title: 'Error de autenticación',
      description: decodeURIComponent(error as string),
      color: 'error'
    })
  }
})

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  email: undefined,
  password: undefined
})

const showPassword = ref(false)
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const data = await $fetch('/api/auth/login', {
      method: 'POST',
      body: event.data
    }) as any

    toast.add({
      title: '¡Bienvenido!',
      description: 'Has iniciado sesión correctamente.',
      color: 'success'
    })

    // Use redirect from backend based on role
    await router.push(data.redirect || '/protected')
  } catch (error: any) {
    toast.add({
      title: 'Error al iniciar sesión',
      description: error.data?.message || error.message || 'Credenciales inválidas',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-header">
      <LogoPro class="login-logo" />
      <h1 class="login-title">FirePlan</h1>
      <p class="login-subtitle">Plan de Emergencia y Autoprotección</p>
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="login-form"
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

      <UFormField label="Contraseña" name="password">
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          icon="i-heroicons-lock-closed"
          :ui="{ trailing: 'pr-0' }"
          autocomplete="current-password"
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

      <div class="login-actions">
        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          :loading="loading"
        >
          Iniciar Sesión
        </UButton>
      </div>

      <div class="login-links">
        <UButton
          to="/forgot-password"
          variant="link"
          color="neutral"
          size="sm"
        >
          ¿Olvidaste tu contraseña?
        </UButton>

        <p class="register-prompt">
          ¿No tienes cuenta?
          <UButton
            to="/register"
            variant="link"
            color="primary"
            size="sm"
          >
            Regístrate
          </UButton>
        </p>
      </div>
    </UForm>
  </div>
</template>

<style scoped>
.login-container {
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo {
  width: 200px;
  height: auto;
  margin: 0 auto 1rem;
}

.login-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.login-subtitle {
  font-size: 0.875rem;
  color: var(--ui-text-dimmed);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-actions {
  margin-top: 0.5rem;
}

.login-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.register-prompt {
  font-size: 0.875rem;
  color: var(--ui-text-dimmed);
}
</style>
