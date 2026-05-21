<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Verificar Email - FirePlan',
  description: 'Verifica tu dirección de email para completar el registro en FirePlan.'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const token = route.query.token as string
const status = ref<'loading' | 'success' | 'error'>('loading')

onMounted(async () => {
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
    toast.add({
      title: 'Email verificado',
      description: 'Tu cuenta ha sido verificada correctamente.',
      color: 'success'
    })
    setTimeout(() => router.push('/login'), 3000)
  } catch (error: any) {
    status.value = 'error'
    toast.add({
      title: 'Error',
      description: error.data?.message || 'No se pudo verificar el email',
      color: 'error'
    })
  }
})
</script>

<template>
  <div class="verify-container">
    <LogoPro class="verify-logo" />

    <div v-if="status === 'loading'" class="verify-status">
      <UIcon name="i-heroicons-arrow-path" class="verify-icon animate-spin" />
      <p>Verificando tu email...</p>
    </div>

    <div v-else-if="status === 'success'" class="verify-status">
      <UIcon name="i-heroicons-check-circle" class="verify-icon success" />
      <h1>¡Email verificado!</h1>
      <p>Tu cuenta ha sido activada correctamente.</p>
      <p class="redirect-text">Redirigiendo al login...</p>
    </div>

    <div v-else class="verify-status">
      <UIcon name="i-heroicons-x-circle" class="verify-icon error" />
      <h1>Error de verificación</h1>
      <p>No se pudo verificar tu email. El enlace puede haber expirado.</p>
      <UButton to="/login" color="primary">Volver al login</UButton>
    </div>
  </div>
</template>

<style scoped>
.verify-container {
  text-align: center;
  max-width: 400px;
}

.verify-logo {
  width: 200px;
  height: auto;
  margin: 0 auto 2rem;
}

.verify-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.verify-icon {
  width: 3rem;
  height: 3rem;
  color: var(--ui-primary);
}

.verify-icon.success {
  color: var(--ui-success);
}

.verify-icon.error {
  color: var(--ui-error);
}

.redirect-text {
  font-size: 0.875rem;
  color: var(--ui-text-dimmed);
}
</style>
