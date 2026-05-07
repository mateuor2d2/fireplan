<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUserStore } from '#imports'

const route = useRoute()
const conceptoId = route.params.id
const userStore = useUserStore()
const userId = userStore.user._id
const helpOpen = ref(false)

const linksHeader = [
  [
    {
      label: 'Planes',
      icon: 'i-heroicons-home',
      to: '/protected/logged'
    },
    {
      label: 'Usuario',
      icon: 'i-heroicons-user-circle',
      to: '/protected/usuarios/' + userId + '/usuario'
    },
    {
      label: 'Settings',
      icon: 'i-heroicons-wrench',
      to: '/protected/usuarios/' + userId + '/settings'
    }
  ],
  [
    {
      label: 'Salir',
      icon: 'i-heroicons-power',
      onClick: async () => {
        console.log('Logout clicked!')
        await userStore.logout()
      }
    }
  ]
]

const links = [
  {
    label: 'Concepto',
    icon: 'i-heroicons-cube',
    to: conceptoId ? '/protected/conceptos/' + conceptoId + '/obra' : '/protected/conceptos/obra',
    target: '_self'
  }
]
</script>

<template>
  <div>
    <ClientOnly>
      <UDashboardToolbar class="py-0 px-1.5 overflow-x-auto">
        <UNavigationMenu :items="linksHeader" />
        <div class="flex items-center gap-2">
          <ColorSelector />
          <HelpButton @click="helpOpen = true" />
        </div>
      </UDashboardToolbar>
    </ClientOnly>
    <div class="flex">
      <ClientOnly>
        <UNavigationMenu
          orientation="vertical"
          :items="links"
          class="data-[orientation=vertical]:w-48"
        />
      </ClientOnly>
      <div class="grow">
        <slot />
      </div>
    </div>
    <Footer />
    <HelpDrawer v-model:open="helpOpen" />
  </div>
</template>
