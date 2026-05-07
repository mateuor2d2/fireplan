<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUserStore } from '#imports'

const route = useRoute()
const planId = route.params.id
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
    // {
    //   label: "Buy now",
    //   icon: "i-heroicons-credit-card",
    //   to: "https://ui.nuxt.com/pro/pricing",
    //   target: "_blank",
    // },
  ]
]
const links = [
  {
    label: 'Obra',
    icon: 'i-heroicons-building-office-2',
    tooltip: {
      text: 'Datos Obra'
    },
    to: planId ? '/protected/planes/' + planId + '/obra' : '/protected/planes/obra',
    target: '_self'
  },
  {
    label: 'Plan',
    icon: 'i-heroicons-bookmark-square',
    // badge: "4",
    tooltip: {
      text: 'Datos Plan'
    },
    to: planId ? '/protected/planes/' + planId + '/plan' : '/protected/planes/plan',
    target: '_self'
  },
  {
    label: 'Contratista',
    icon: 'i-heroicons-wrench-screwdriver',
    tooltip: {
      text: 'Datos Contratista'
    },
    to: planId ? '/protected/planes/' + planId + '/contratista' : '/protected/planes/contratista'
  },
  {
    label: 'Promotor',
    icon: 'i-heroicons-currency-euro',
    tooltip: {
      text: 'Datos Promotor'
    },
    to: planId ? '/protected/planes/' + planId + '/promotor' : '/protected/planes/promotor'
  },
  {
    label: 'Tecnicos',
    icon: 'i-heroicons-light-bulb',
    to: planId ? '/protected/planes/' + planId + '/tecnicos' : '/protected/planes/tecnicos',
    tooltip: {
      text: 'Datos Técnicos'
    }
  },
  {
    label: 'Colaboradores',
    icon: 'i-lucide-users',
    to: planId ? '/protected/planes/' + planId + '/colaboradores' : '/protected/planes/colaboradores',
    tooltip: {
      text: 'Colaboradores de la obra'
    }
  },
  {
    label: 'Partidas',
    icon: 'i-heroicons-circle-stack',
    to: planId ? '/protected/planes/' + planId + '/partidas' : '/protected/planes/partidas',

    tooltip: {
      text: 'Escoje Partidas'
    }
  },
  {
    label: 'Presupuesto',
    icon: 'i-heroicons-calculator',
    to: planId ? '/protected/planes/' + planId + '/presupuesto' : '/protected/planes/presupuesto',

    tooltip: {
      text: 'Ajusta el presupuesto'
    }

  },
  {
    label: 'Imprimir',
    icon: 'i-heroicons-printer',
    to: planId ? '/protected/planes/' + planId + '/impresion' : '/protected/planes/impresion',
    tooltip: {
      text: 'Impresion del Plan'
    }
  },
  {
    label: 'Instrucciones',
    icon: 'i-heroicons-clipboard-document-check',
    to: planId ? '/protected/planes/' + planId + '/instrucciones' : '/protected/planes/instrucciones',
    tooltip: {
      text: 'Instrucciones de obra'
    }
  }
]
</script>

<template>
  <div>
    <ClientOnly>
      <UDashboardToolbar class="py-0 px-1.5 overflow-x-auto">
        <!-- <UHorizontalNavigation :links="linksHeader" /> -->
        <UNavigationMenu :items="linksHeader" />
        <div class="flex items-center gap-2">
          <ColorSelector />
          <HelpButton @click="helpOpen = true" />
        </div>
      </UDashboardToolbar>
    </ClientOnly>
    <div class="flex min-h-screen">
      <!-- <UDashboardSidebarLinks :links="links" /> -->
      <ClientOnly>
        <div class="sticky top-0 h-screen overflow-y-auto shrink-0">
          <UNavigationMenu
            orientation="vertical"
            :items="links"
            class="data-[orientation=vertical]:w-48"
          />
        </div>
      </ClientOnly>
      <div class="grow">
        <slot />
      </div>
    </div>
    <Footer />
    <HelpDrawer v-model:open="helpOpen" />
  </div>
</template>
