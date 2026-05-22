<script setup lang="ts">
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const helpOpen = ref(false)

const userRole = computed(() => userStore.user?.role || 'user')
const userId = computed(() => userStore.user?._id || '')

const linksHeader = computed(() => {
  const mainLinks: any[] = []

  // Dashboard según rol
  if (userRole.value === 'superadmin') {
    mainLinks.push({
      label: 'Admin',
      icon: 'i-heroicons-shield-check',
      to: '/protected/admin'
    })
  } else if (userRole.value === 'tenant') {
    mainLinks.push({
      label: 'Mi Empresa',
      icon: 'i-heroicons-building-office',
      to: '/protected/tenant'
    })
  } else if (userRole.value === 'centroadmin') {
    mainLinks.push({
      label: 'Mi Centro',
      icon: 'i-heroicons-building-office-2',
      to: '/protected/centro'
    })
  } else {
    mainLinks.push({
      label: 'Dashboard',
      icon: 'i-heroicons-home',
      to: '/protected'
    })
  }

  // Centros (para tenant y superadmin)
  if (['tenant', 'superadmin'].includes(userRole.value)) {
    mainLinks.push({
      label: 'Centros',
      icon: 'i-heroicons-building-office-2',
      to: '/protected/centers'
    })
  }

  // Plan de Emergencia (todos excepto user básico)
  if (userRole.value !== 'user') {
    mainLinks.push({
      label: 'Plan',
      icon: 'i-heroicons-document-text',
      to: '/protected/plans'
    })
  }

  // Equipos (todos)
  mainLinks.push({
    label: 'Equipos',
    icon: 'i-heroicons-qr-code',
    to: '/protected/workers'
  })

  // Simulacros (todos excepto user básico)
  if (userRole.value !== 'user') {
    mainLinks.push({
      label: 'Simulacros',
      icon: 'i-heroicons-clipboard-document-check',
      to: '/protected/simulacros'
    })
  }

  // Mapas (todos)
  mainLinks.push({
    label: 'Mapas',
    icon: 'i-heroicons-map',
    to: '/protected/mapas'
  })

  return [
    mainLinks,
    [{
      label: 'Salir',
      icon: 'i-heroicons-power',
      onClick: async () => {
        await userStore.logout()
        await navigateTo('/login')
      }
    }]
  ]
})
</script>

<template>
  <div>
    <ClientOnly>
      <UDashboardToolbar class="py-0 px-1.5 overflow-x-auto">
        <UNavigationMenu
          :items="linksHeader"
          class="w-full justify-center"
        />
        <div class="flex items-center gap-2">
          <HelpButton @click="helpOpen = true" />
        </div>
      </UDashboardToolbar>
    </ClientOnly>

    <div class="p-4">
      <slot />
    </div>
    <HelpDrawer v-model:open="helpOpen" />
  </div>
</template>
