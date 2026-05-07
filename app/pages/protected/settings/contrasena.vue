<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Cambiar Contraseña
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Actualiza tu contraseña de acceso de forma segura
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex justify-center items-center py-20"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-12 h-12 animate-spin text-primary"
      />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex justify-center items-center py-20"
    >
      <UCard class="max-w-md w-full">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-8 h-8 text-red-500"
            />
            <h3 class="text-xl font-bold">
              Error
            </h3>
          </div>
        </template>

        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ error }}
        </p>

        <UButton
          icon="i-heroicons-arrow-path"
          variant="outline"
          @click="loadUserData"
        >
          Reintentar
        </UButton>
      </UCard>
    </div>

    <!-- Password Change Content -->
    <div v-else>
      <!-- Info Card -->
      <UAlert
        icon="i-heroicons-information-circle"
        color="blue"
        variant="soft"
        title="Seguridad de tu contraseña"
        description="Por seguridad, debes ingresar tu contraseña actual para confirmar los cambios. La nueva contraseña debe tener al menos 8 caracteres."
        class="mb-6"
      />

      <!-- OAuth Info Alert (informational, not blocking) -->
      <UAlert
        v-if="hasOAuthCredentials"
        icon="i-heroicons-shield-check"
        color="yellow"
        variant="soft"
        title="Cuenta con vinculación externa"
        class="mb-6"
      >
        <template #description>
          <p v-if="userStore.user?.googleId">
            Tu cuenta está vinculada a Google.
          </p>
          <p v-else-if="userStore.user?.githubId">
            Tu cuenta está vinculada a GitHub.
          </p>
          <p class="mt-2">
            Si nunca has establecido una contraseña, usa
            <NuxtLink
              to="/forgot-password"
              class="text-primary underline font-medium"
            >
              "Olvidé mi contraseña"
            </NuxtLink>
            para crear una.
          </p>
        </template>
      </UAlert>

      <!-- Password Change Form -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-lock-closed"
              class="w-5 h-5 text-primary"
            />
            <h3 class="text-lg font-medium">
              Cambiar contraseña
            </h3>
          </div>
        </template>

        <form
          class="space-y-5"
          @submit.prevent="handleSubmit"
        >
          <!-- Current Password -->
          <UFormField
            label="Contraseña actual"
            name="currentPassword"
            required
          >
            <UInput
              v-model="formData.currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              placeholder="Ingresa tu contraseña actual"
              :disabled="saving"
              size="lg"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #trailing>
                <UButton
                  :icon="showCurrentPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="ghost"
                  color="gray"
                  :padded="false"
                  @click="showCurrentPassword = !showCurrentPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <!-- New Password -->
          <UFormField
            label="Nueva contraseña"
            name="newPassword"
            required
          >
            <UInput
              v-model="formData.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              placeholder="Ingresa tu nueva contraseña (mínimo 8 caracteres)"
              :disabled="saving"
              size="lg"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #trailing>
                <UButton
                  :icon="showNewPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="ghost"
                  color="gray"
                  :padded="false"
                  @click="showNewPassword = !showNewPassword"
                />
              </template>
            </UInput>
            <template #hint>
              <span
                class="text-sm"
                :class="formData.newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'"
              >
                Mínimo 8 caracteres
              </span>
            </template>
          </UFormField>

          <!-- Confirm New Password -->
          <UFormField
            label="Confirmar nueva contraseña"
            name="confirmPassword"
            required
          >
            <UInput
              v-model="formData.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Vuelve a ingresar tu nueva contraseña"
              :disabled="saving"
              size="lg"
              :color="passwordMatchError ? 'red' : undefined"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #trailing>
                <UButton
                  :icon="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  variant="ghost"
                  color="gray"
                  :padded="false"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </UInput>
            <template
              v-if="passwordMatchError"
              #hint
            >
              <span class="text-sm text-red-500">Las contraseñas no coinciden</span>
            </template>
          </UFormField>

          <!-- Submit Button -->
          <div class="flex justify-end gap-3 pt-4">
            <UButton
              type="button"
              variant="outline"
              color="gray"
              :disabled="saving"
              @click="resetForm"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              :loading="saving"
              :disabled="!isValid"
              icon="i-heroicons-check"
            >
              Cambiar contraseña
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- Additional Security Tips -->
      <div class="mt-8">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-shield-check"
                class="w-5 h-5 text-green-500"
              />
              <h3 class="text-lg font-medium">
                Consejos de seguridad
              </h3>
            </div>
          </template>
          <div class="space-y-3 text-sm">
            <p class="text-gray-700 dark:text-gray-300">
              🔒 Usa una combinación de letras, números y símbolos para mayor seguridad
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              🚫 No uses la misma contraseña en otros sitios web
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              🔄 Cambia tu contraseña periódicamente para mantener tu cuenta segura
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              👀 No compartas tu contraseña con nadie
            </p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page meta - requires authentication
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const userStore = useUserStore()
const toast = useToast()

// State
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Form data
interface FormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const formData = ref<FormData>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Check if user has OAuth credentials (for informational purposes)
// OAuth users may or may not have a password set
const hasOAuthCredentials = computed(() => {
  const user = userStore.user
  return Boolean(user?.googleId || user?.githubId)
})

// Password match validation
const passwordMatchError = computed(() => {
  return formData.value.newPassword
    && formData.value.confirmPassword
    && formData.value.newPassword !== formData.value.confirmPassword
})

// Form validation
const isValid = computed(() => {
  return (
    formData.value.currentPassword.length > 0
    && formData.value.newPassword.length >= 8
    && formData.value.confirmPassword.length > 0
    && formData.value.newPassword === formData.value.confirmPassword
  )
})

// Methods
async function loadUserData() {
  loading.value = true
  error.value = null

  try {
    await userStore.fetchUser()
  } catch (err: any) {
    console.error('Error loading user data:', err)
    error.value = err.message || 'No se pudieron cargar tus datos'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!isValid.value) return

  saving.value = true

  try {
    await userStore.changePassword(formData.value.currentPassword, formData.value.newPassword)

    // Show success toast
    toast.add({
      title: 'Contraseña cambiada',
      description: 'Tu contraseña ha sido actualizada correctamente',
      color: 'green',
      icon: 'i-heroicons-check-circle'
    })

    // Clear form
    resetForm()
  } catch (err: any) {
    console.error('Error changing password:', err)

    // Show error toast
    const errorMessage = err.message || 'No se pudo cambiar la contraseña'

    toast.add({
      title: 'Error al cambiar contraseña',
      description: errorMessage === 'Current password is incorrect'
        ? 'La contraseña actual es incorrecta'
        : errorMessage,
      color: 'red',
      icon: 'i-heroicons-x-circle'
    })
  } finally {
    saving.value = false
  }
}

function resetForm() {
  formData.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  // Reset password visibility
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}

// Load user data on mount
onMounted(() => {
  loadUserData()
})
</script>
