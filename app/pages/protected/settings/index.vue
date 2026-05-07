<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Configuración
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Gestiona tus preferencias y configuraciones de la aplicación
      </p>
    </div>

    <!-- Tabs Navigation -->
    <UTabs
      :default-value="currentTab"
      :items="tabs"
      class="w-full"
      @change="handleTabChange"
    >
      <template #default="{ item }">
        <NuxtPage />
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Page meta - requires authentication
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const route = useRoute()

// Available tabs
const tabs = [
  {
    label: 'General',
    icon: 'i-heroicons-cog-6-tooth',
    value: 'general',
    to: '/protected/settings/general',
    description: 'Configuración general de la aplicación'
  },
  {
    label: 'Códigos QR',
    icon: 'i-heroicons-qrcode',
    value: 'qr',
    to: '/protected/settings/qr',
    description: 'Configuración de códigos QR para planes'
  },
  {
    label: 'Mis Códigos QR',
    icon: 'i-heroicons-qr-code',
    value: 'qr-codes',
    to: '/protected/settings/codigos-qr',
    description: 'Gestiona tus códigos QR'
  },
  {
    label: 'Perfil',
    icon: 'i-heroicons-user',
    value: 'profile',
    to: '/protected/settings/perfil',
    description: 'Información de tu perfil'
  },
  {
    label: 'Contraseña',
    icon: 'i-heroicons-key',
    value: 'password',
    to: '/protected/settings/contrasena',
    description: 'Cambiar tu contraseña'
  }
]

// Current tab based on route
const currentTab = computed(() => {
  const path = route.path
  if (path.includes('/settings/codigos-qr')) return 'qr-codes'
  if (path.includes('/settings/qr')) return 'qr'
  if (path.includes('/settings/perfil') || path.includes('/settings/profile')) return 'profile'
  if (path.includes('/settings/contrasena')) return 'password'
  return 'general'
})

// Handle tab change
function handleTabChange(value: string) {
  const tab = tabs.find(t => t.value === value)
  if (tab) {
    navigateTo(tab.to)
  }
}
</script>
