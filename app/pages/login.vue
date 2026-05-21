<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Iniciar Sesión - FirePlan',
  description: 'Accede a tu cuenta de FirePlan para gestionar tu plan de emergencia y autoprotección.'
})

const toast = useToast()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    toast.add({
      title: 'Error',
      description: 'Email y contraseña son obligatorios',
      color: 'error'
    })
    return
  }

  loading.value = true
  try {
    const data = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    }) as any

    toast.add({
      title: '¡Bienvenido!',
      description: 'Has iniciado sesión correctamente.',
      color: 'success'
    })

    await router.push(data.redirect || '/protected')
  } catch (error: any) {
    console.error('Login error:', error)
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

    <form class="login-form" @submit.prevent="handleLogin">
      <div class="space-y-2">
        <label class="text-sm font-medium">Email</label>
        <UInput
          v-model="email"
          type="email"
          placeholder="tu@empresa.com"
          icon="i-heroicons-envelope"
          autocomplete="email"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">Contraseña</label>
        <UInput
          v-model="password"
          type="password"
          placeholder="••••••••"
          icon="i-heroicons-lock-closed"
          autocomplete="current-password"
        />
      </div>

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
    </form>
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
