<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Perfil de Usuario
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Gestiona la información de tu perfil y datos de contacto
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

    <!-- Profile Form -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Info Alert -->
      <UAlert
        icon="i-heroicons-information-circle"
        color="blue"
        variant="soft"
        title="Información del perfil"
        description="Actualiza tu información personal y datos de contacto. Los cambios se guardarán automáticamente al hacer clic en 'Guardar cambios'."
        class="mb-6"
      />

      <!-- Profile Form Card -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-user"
              class="w-5 h-5 text-primary"
            />
            <h3 class="text-lg font-medium">
              Información Personal
            </h3>
          </div>
        </template>

        <form
          class="space-y-6"
          @submit.prevent="handleSave"
        >
          <!-- Nombre completo -->
          <div>
            <label
              for="name"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Nombre completo
            </label>
            <UInput
              id="name"
              v-model="formData.name"
              type="text"
              placeholder="Tu nombre completo"
              :disabled="saving"
              size="lg"
              icon="i-heroicons-user"
            />
          </div>

          <!-- Email -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Correo electrónico
            </label>
            <UInput
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="tu@email.com"
              :disabled="saving"
              size="lg"
              icon="i-heroicons-envelope"
              :color="emailError ? 'red' : undefined"
            />
            <p
              v-if="emailError"
              class="mt-1 text-xs text-red-500 dark:text-red-400"
            >
              {{ emailError }}
            </p>
            <p
              v-else
              class="mt-1 text-xs text-gray-500 dark:text-gray-400"
            >
              Tu correo electrónico de inicio de sesión
            </p>
          </div>

          <!-- Forgot Password Link -->
          <div class="mt-2">
            <ULink
              to="/forgot-password"
              class="text-primary font-medium text-sm flex items-center gap-1"
            >
              <UIcon
                name="i-heroicons-question-mark-circle"
                class="w-4 h-4"
              />
              ¿Olvidaste tu contraseña?
            </ULink>
          </div>

          <!-- Teléfono -->
          <div>
            <label
              for="matriz_tel"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Teléfono
            </label>
            <UInput
              id="matriz_tel"
              v-model="formData.matriz_tel"
              type="tel"
              placeholder="+34 600 000 000"
              :disabled="saving"
              size="lg"
              icon="i-heroicons-phone"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Número de teléfono de contacto (opcional)
            </p>
          </div>

          <!-- Divider -->
          <hr class="border-gray-200 dark:border-gray-700">

          <!-- Nombre de empresa -->
          <div>
            <label
              for="matriz_nombre"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Nombre de empresa
            </label>
            <UInput
              id="matriz_nombre"
              v-model="formData.matriz_nombre"
              type="text"
              placeholder="Nombre de tu empresa"
              :disabled="saving"
              size="lg"
              icon="i-heroicons-building-office"
            />
          </div>

          <!-- CIF -->
          <div>
            <label
              for="matriz_cif"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              CIF
            </label>
            <UInput
              id="matriz_cif"
              v-model="formData.matriz_cif"
              type="text"
              placeholder="A12345678"
              :disabled="saving"
              size="lg"
              icon="i-heroicons-identification"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              CIF de la empresa (opcional)
            </p>
          </div>

          <!-- Dirección -->
          <div>
            <label
              for="matriz_dir"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Dirección
            </label>
            <UInput
              id="matriz_dir"
              v-model="formData.matriz_dir"
              type="text"
              placeholder="Calle, número, piso..."
              :disabled="saving"
              size="lg"
              icon="i-heroicons-map-pin"
            />
          </div>

          <!-- Población y Código Postal -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="matriz_pob"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Población
              </label>
              <UInput
                id="matriz_pob"
                v-model="formData.matriz_pob"
                type="text"
                placeholder="Ciudad"
                :disabled="saving"
                size="lg"
                icon="i-heroicons-building-office-2"
              />
            </div>
            <div>
              <label
                for="matriz_cp"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Código Postal
              </label>
              <UInput
                id="matriz_cp"
                v-model="formData.matriz_cp"
                type="text"
                placeholder="00000"
                :disabled="saving"
                size="lg"
                icon="i-heroicons-envelope-open"
              />
            </div>
          </div>

          <!-- Observaciones -->
          <div>
            <label
              for="matriz_obs"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Observaciones
            </label>
            <UTextarea
              id="matriz_obs"
              v-model="formData.matriz_obs"
              placeholder="Información adicional..."
              :disabled="saving"
              size="lg"
              :rows="3"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Notas o información adicional (opcional)
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <span
                v-if="hasChanges"
                class="text-sm text-orange-500 dark:text-orange-400 flex items-center gap-1"
              >
                <UIcon
                  name="i-heroicons-exclamation-triangle"
                  class="w-4 h-4"
                />
                Hay cambios sin guardar
              </span>
              <span
                v-else
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                Todos los cambios están guardados
              </span>
            </div>
            <div class="flex gap-3">
              <UButton
                type="button"
                variant="outline"
                color="gray"
                :disabled="saving"
                @click="handleReset"
              >
                Restablecer
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="saving"
                :disabled="!hasChanges || !isFormValid"
              >
                Guardar cambios
              </UButton>
            </div>
          </div>
        </form>
      </UCard>

      <!-- Account Info Card -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-shield-check"
              class="w-5 h-5 text-green-500"
            />
            <h3 class="text-lg font-medium">
              Seguridad
            </h3>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Para cambiar tu contraseña, ve a la pestaña "Contraseña"
          </p>
          <UButton
            icon="i-heroicons-key"
            variant="outline"
            to="/protected/settings/contrasena"
            size="sm"
          >
            Cambiar contraseña
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '~/stores/user'

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

// Form data interface
interface ProfileFormData {
  name?: string
  email: string
  matriz_tel?: string
  matriz_nombre?: string
  matriz_cif?: string
  matriz_dir?: string
  matriz_pob?: string
  matriz_cp?: string
  matriz_obs?: string
}

// Initial form data from user store
const formData = ref<ProfileFormData>({
  name: '',
  email: '',
  matriz_tel: '',
  matriz_nombre: '',
  matriz_cif: '',
  matriz_dir: '',
  matriz_pob: '',
  matriz_cp: '',
  matriz_obs: ''
})

// Store original values for comparison
const originalData = ref<ProfileFormData>({
  name: '',
  email: '',
  matriz_tel: '',
  matriz_nombre: '',
  matriz_cif: '',
  matriz_dir: '',
  matriz_pob: '',
  matriz_cp: '',
  matriz_obs: ''
})

// Email validation error
const emailError = ref<string | null>(null)

// Validate email format
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(formData.value.email)
})

// Check if form is valid
const isFormValid = computed(() => {
  return isEmailValid.value
})

// Check if there are changes
const hasChanges = computed(() => {
  return (
    formData.value.name !== originalData.value.name
    || formData.value.email !== originalData.value.email
    || formData.value.matriz_tel !== originalData.value.matriz_tel
    || formData.value.matriz_nombre !== originalData.value.matriz_nombre
    || formData.value.matriz_cif !== originalData.value.matriz_cif
    || formData.value.matriz_dir !== originalData.value.matriz_dir
    || formData.value.matriz_pob !== originalData.value.matriz_pob
    || formData.value.matriz_cp !== originalData.value.matriz_cp
    || formData.value.matriz_obs !== originalData.value.matriz_obs
  )
})

// Load user data on mount
async function loadUserData() {
  loading.value = true
  error.value = null

  try {
    // Ensure we have fresh user data
    if (!userStore.user || !userStore.user._id) {
      await userStore.fetchUser()
    }

    const user = userStore.user
    formData.value = {
      name: user.name || '',
      email: user.email || '',
      matriz_tel: user.matriz_tel || '',
      matriz_nombre: user.matriz_nombre || '',
      matriz_cif: user.matriz_cif || '',
      matriz_dir: user.matriz_dir || '',
      matriz_pob: user.matriz_pob || '',
      matriz_cp: user.matriz_cp || '',
      matriz_obs: user.matriz_obs || ''
    }
    originalData.value = { ...formData.value }
  } catch (err: any) {
    console.error('Error loading user data:', err)
    error.value = err.message || 'No se pudieron cargar los datos del perfil'
  } finally {
    loading.value = false
  }
}

// Save profile changes
async function handleSave() {
  if (!isFormValid.value) {
    toast.add({
      title: 'Error de validación',
      description: 'Por favor, revisa el formato del correo electrónico',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle'
    })
    return
  }

  saving.value = true

  try {
    // Build update payload with only changed fields
    const updateData: Partial<User> = {}

    if (formData.value.name !== originalData.value.name) {
      updateData.name = formData.value.name
    }
    if (formData.value.email !== originalData.value.email) {
      updateData.email = formData.value.email
    }
    if (formData.value.matriz_tel !== originalData.value.matriz_tel) {
      updateData.matriz_tel = formData.value.matriz_tel
    }
    if (formData.value.matriz_nombre !== originalData.value.matriz_nombre) {
      updateData.matriz_nombre = formData.value.matriz_nombre
    }
    if (formData.value.matriz_cif !== originalData.value.matriz_cif) {
      updateData.matriz_cif = formData.value.matriz_cif
    }
    if (formData.value.matriz_dir !== originalData.value.matriz_dir) {
      updateData.matriz_dir = formData.value.matriz_dir
    }
    if (formData.value.matriz_pob !== originalData.value.matriz_pob) {
      updateData.matriz_pob = formData.value.matriz_pob
    }
    if (formData.value.matriz_cp !== originalData.value.matriz_cp) {
      updateData.matriz_cp = formData.value.matriz_cp
    }
    if (formData.value.matriz_obs !== originalData.value.matriz_obs) {
      updateData.matriz_obs = formData.value.matriz_obs
    }

    // Call userStore.updateUser() which makes PUT request to /api/auth/me
    await userStore.updateUser(updateData)

    // Update original data to match saved state
    originalData.value = { ...formData.value }

    toast.add({
      title: 'Perfil actualizado',
      description: 'Tu perfil se ha actualizado correctamente',
      color: 'green',
      icon: 'i-heroicons-check-circle'
    })
  } catch (err: any) {
    console.error('Error saving profile:', err)
    const errorMessage = err.message || 'No se pudo actualizar el perfil'

    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    saving.value = false
  }
}

// Reset form to original values
function handleReset() {
  formData.value = { ...originalData.value }
  emailError.value = null

  toast.add({
    title: 'Formulario restablecido',
    description: 'Se han restaurado los valores guardados',
    color: 'blue',
    icon: 'i-heroicons-arrow-path'
  })
}

// Watch email for validation
watch(() => formData.value.email, (newEmail) => {
  if (newEmail && !isEmailValid.value) {
    emailError.value = 'Formato de correo electrónico inválido'
  } else {
    emailError.value = null
  }
})

// Load user data on mount
onMounted(() => {
  loadUserData()
})
</script>
