<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import type { QRSettings } from '~/types/qr'
import QRConfigForm from '~/components/qr/QRConfigForm.vue'

definePageMeta({ middleware: 'auth', layout: 'app' })

const userStore = useUserStore()
const isLoading = ref(false)
const isChangingPassword = ref(false)

// Define tabs
const tabs = computed(() => [
  {
    slot: 'profile',
    label: 'Perfil',
    icon: 'i-heroicons-user'
  },
  {
    slot: 'password',
    label: 'Contraseña',
    icon: 'i-heroicons-key'
  },
  {
    slot: 'qr',
    label: 'Códigos QR',
    icon: 'i-heroicons-qr-code'
  }
])

// User data
const userData = ref({
  name: '',
  email: '',
  matriz_nombre: '',
  matriz_cif: '',
  matriz_dir: '',
  matriz_pob: '',
  matriz_cp: '',
  matriz_tel: '',
  matriz_obs: ''
})

// Password data
const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// QR Settings data
const qrSettings = ref<QRSettings>({
  autoGenerate: true,
  baseUrl: 'http://localhost:3000',
  expirationDays: 30
})
const qrLoading = ref(false)
const qrSaving = ref(false)

// Load user data
const loadUserData = async () => {
  try {
    await userStore.fetchUser()
    if (userStore.user) {
      userData.value = {
        name: userStore.user.name || '',
        email: userStore.user.email || '',
        matriz_nombre: userStore.user.matriz_nombre || '',
        matriz_cif: userStore.user.matriz_cif || '',
        matriz_dir: userStore.user.matriz_dir || '',
        matriz_pob: userStore.user.matriz_pob || '',
        matriz_cp: userStore.user.matriz_cp || '',
        matriz_tel: userStore.user.matriz_tel || '',
        matriz_obs: userStore.user.matriz_obs || ''
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error)
  }
}

// Update user information
const updateUser = async () => {
  try {
    await userStore.updateUser(userData.value)
    await userStore.fetchUser()
    useToast().add({
      title: 'Datos actualizados',
      description: 'Tus datos se han actualizado correctamente',
      color: 'green'
    })
  } catch (error: any) {
    console.error('Error updating user:', error)
    useToast().add({
      title: 'Error',
      description: error.message || 'No se pudieron actualizar los datos',
      color: 'red'
    })
  }
}

// Change password
const changePassword = async () => {
  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    useToast().add({
      title: 'Error',
      description: 'Las contraseñas no coinciden',
      color: 'red'
    })
    return
  }

  try {
    await userStore.changePassword(
      passwordData.value.currentPassword,
      passwordData.value.newPassword
    )

    // Reset form
    passwordData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    useToast().add({
      title: 'Contraseña actualizada',
      description: 'Tu contraseña se ha actualizado correctamente',
      color: 'green'
    })
  } catch (error: any) {
    console.error('Error changing password:', error)
    useToast().add({
      title: 'Error',
      description: error.message || 'Error al cambiar la contraseña',
      color: 'red'
    })
  }
}

// Load QR settings
const loadQRSettings = async () => {
  try {
    qrLoading.value = true
    const settings = await userStore.getQRSettings()
    qrSettings.value = settings
  } catch (error) {
    console.error('Error loading QR settings:', error)
  } finally {
    qrLoading.value = false
  }
}

// Update QR settings
const updateQRSettings = async (settings: QRSettings) => {
  try {
    await userStore.updateQRSettings(settings)
    qrSettings.value = settings
    useToast().add({
      title: 'Configuración QR actualizada',
      description: 'Tus preferencias de códigos QR se han actualizado correctamente',
      color: 'green'
    })
  } catch (error: any) {
    console.error('Error updating QR settings:', error)
    throw error
  }
}

// Reset QR settings
const resetQRSettings = async () => {
  await loadQRSettings()
  useToast().add({
    title: 'Configuración restablecida',
    description: 'Se han cargado los valores guardados',
    color: 'blue'
  })
}

// Load user data and QR settings when component mounts
onMounted(() => {
  loadUserData()
  loadQRSettings()
})
</script>

<template>
  <UContainer class="py-8">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">
            Perfil de Usuario
          </h2>
        </div>
      </template>

      <UTabs :items="tabs">
        <!-- Profile Tab -->
        <template #profile>
          <div class="pt-6">
            <UForm
              :state="userData"
              class="w-full"
              @submit="updateUser"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Column 1 -->
                <div class="space-y-4">
                  <UFormField
                    label="Nombre"
                    name="name"
                    class="w-full"
                  >
                    <UInput
                      v-model="userData.name"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Email"
                    name="email"
                    class="w-full"
                  >
                    <UInput
                      v-model="userData.email"
                      type="email"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Empresa"
                    name="matriz_nombre"
                    class="w-full"
                  >
                    <UInput
                      v-model="userData.matriz_nombre"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <!-- Column 2 -->
                <div class="space-y-4">
                  <UFormField
                    label="CIF"
                    name="matriz_cif"
                    class="w-full"
                  >
                    <UInput
                      v-model="userData.matriz_cif"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Dirección"
                    name="matriz_dir"
                    class="w-full"
                  >
                    <UInput
                      v-model="userData.matriz_dir"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Población"
                    name="matriz_pob"
                    class="w-full"
                  >
                    <UInput
                      v-model="userData.matriz_pob"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <!-- Column 3 -->
                <div class="space-y-4">
                  <UFormField
                    label="Código Postal"
                    name="matriz_cp"
                    class="w-full"
                  >
                    <UInput
                      v-model="userData.matriz_cp"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Teléfono"
                    name="matriz_tel"
                    class="w-full"
                  >
                    <UInput
                      v-model="userData.matriz_tel"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </div>

              <div class="mt-6">
                <UButton
                  type="submit"
                  :loading="isLoading"
                >
                  Guardar cambios
                </UButton>
              </div>
            </UForm>
          </div>
        </template>

        <!-- Password Tab -->
        <template #password>
          <div class="pt-6">
            <h3 class="text-lg font-semibold mb-6">
              Cambiar contraseña
            </h3>
            <UForm
              :state="passwordData"
              class="w-full"
              @submit="changePassword"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Column 1 -->
                <div class="space-y-4">
                  <UFormField
                    label="Contraseña actual"
                    name="currentPassword"
                    class="w-full"
                  >
                    <UInput
                      v-model="passwordData.currentPassword"
                      type="password"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <!-- Column 2 -->
                <div class="space-y-4">
                  <UFormField
                    label="Nueva contraseña"
                    name="newPassword"
                    class="w-full"
                  >
                    <UInput
                      v-model="passwordData.newPassword"
                      type="password"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <!-- Column 3 -->
                <div class="space-y-4">
                  <UFormField
                    label="Confirmar nueva contraseña"
                    name="confirmPassword"
                    class="w-full"
                  >
                    <UInput
                      v-model="passwordData.confirmPassword"
                      type="password"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </div>

              <div class="mt-6">
                <UButton
                  type="submit"
                  color="error"
                  :loading="isChangingPassword"
                >
                  Cambiar contraseña
                </UButton>
              </div>
            </UForm>
          </div>
        </template>

        <!-- QR Settings Tab -->
        <template #qr>
          <div class="pt-6">
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-2">
                Configuración de Códigos QR
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm">
                Configura cómo se generan los códigos QR para tus planes de seguridad
              </p>
            </div>

            <QRConfigForm
              :model-value="qrSettings"
              :loading="qrSaving"
              @save="updateQRSettings"
              @reset="resetQRSettings"
            />
          </div>
        </template>
      </UTabs>
    </UCard>
  </UContainer>
</template>
