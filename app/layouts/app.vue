<script setup lang="ts">
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const userId = userStore.user._id
const userRole = userStore.user.role
const helpOpen = ref(false)

// Subscription indicator
const { planName, isActive, isStarter } = useSubscription()

const linksHeader = computed(() => {
  const mainLinks: any[] = [
    {
      label: 'Obras',
      icon: 'i-lucide-home',
      to: '/protected/logged'
    }
  ]

  if (userRole !== 'control') {
    mainLinks.push({
      label: 'Usuario',
      icon: 'i-lucide-user-circle',
      to: '/protected/usuarios/' + userId + '/usuario'
    })
    mainLinks.push({
      label: 'Pagos',
      icon: 'i-lucide-credit-card',
      to: '/protected/usuarios/payments'
    })
  }

  mainLinks.push({
    label: 'Settings',
    icon: 'i-lucide-wrench',
    to: '/protected/usuarios/' + userId + '/settings'
  })

  return [
    mainLinks,
    [{
      label: 'Salir',
      icon: 'i-lucide-power',
      onClick: async () => {
        await userStore.logout()
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
          <UBadge
            v-if="planName"
            :color="isActive ? 'success' : 'warning'"
            variant="subtle"
            size="sm"
            class="hidden sm:flex"
          >
            {{ planName }}
          </UBadge>
          <UButton
            v-if="isStarter"
            size="xs"
            color="primary"
            variant="soft"
            to="/protected/pricing"
            class="hidden sm:inline-flex"
          >
            Actualizar plan
          </UButton>
          <ColorSelector />
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
