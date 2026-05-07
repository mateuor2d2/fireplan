<script setup lang="ts">
const userStore = useUserStore()
const route = useRoute()

const items = computed(() => [{
  label: 'Funcionalidades',
  icon: 'i-lucide-layers',
  children: [{
    label: 'Incidencias',
    icon: 'i-lucide-alert-triangle',
    to: '/funcionalidades/incidencias'
  }, {
    label: 'Cumplimiento Normativo',
    icon: 'i-lucide-scale',
    to: '/funcionalidades/normativa'
  }]
}, {
  label: 'Precios',
  to: '/pricing'
}, {
  label: 'Recursos',
  icon: 'i-lucide-book-open',
  children: [{
    label: 'Blog',
    icon: 'i-lucide-newspaper',
    to: '/blog'
  }, {
    label: 'Casos de Éxito',
    icon: 'i-lucide-trophy',
    to: '/casos-de-exito'
  }, {
    label: 'Recursos Gratuitos',
    icon: 'i-lucide-download',
    to: '/recursos'
  }, {
    label: 'Documentación',
    icon: 'i-lucide-book-open',
    to: '/docs'
  }, {
    label: 'Soporte',
    icon: 'i-lucide-life-buoy',
    to: '/support'
  }, {
    label: 'Actualizaciones',
    icon: 'i-lucide-sparkles',
    to: '/changelog'
  }]
}])

const isLoggedIn = computed(() => userStore.loggedIn)
const userName = computed(() => userStore.user.name || userStore.user.email?.split('@')[0] || 'Usuario')
const userRole = computed(() => userStore.user.role)
const isControl = computed(() => userRole.value === 'control')

// User dropdown items - defined as computed to avoid SSR serialization issues
const userDropdownItems = computed(() => [[{
  label: 'Dashboard',
  icon: 'i-lucide-layout-dashboard',
  click: () => navigateTo('/protected/logged')
}, {
  label: 'Cerrar sesión',
  icon: 'i-lucide-log-out',
  click: async () => await userStore.logout()
}]])
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <LogoPro class="w-auto h-6 shrink-0" />
      </NuxtLink>
    </template>

    <ClientOnly>
      <UNavigationMenu
        :items="items"
        variant="link"
      />
    </ClientOnly>

    <template #right>
      <ClientOnly>
        <UColorModeButton />
      </ClientOnly>

      <!-- Logged out state: Show login/register buttons -->
      <template v-if="!isLoggedIn">
        <UButton
          icon="i-lucide-log-in"
          color="neutral"
          variant="ghost"
          to="/login"
          class="lg:hidden"
        />

        <UButton
          label="Acceder"
          color="neutral"
          variant="outline"
          to="/login"
          class="hidden lg:inline-flex"
        />

        <UButton
          label="Registrarse"
          color="neutral"
          trailing-icon="i-lucide-arrow-right"
          class="hidden lg:inline-flex"
          to="/signup"
        />
      </template>

      <!-- Logged in state: Show user menu -->
      <template v-else>
        <ObraSwitcher v-if="isControl" @select="() => {}" />

        <UButton
          icon="i-lucide-user"
          :label="userName"
          color="neutral"
          variant="ghost"
          class="hidden lg:inline-flex"
        />

        <ClientOnly>
          <UDropdownMenu :items="userDropdownItems">
            <UButton
              icon="i-lucide-user"
              color="neutral"
              variant="ghost"
              class="lg:hidden"
            />
          </UDropdownMenu>
        </ClientOnly>
      </template>
    </template>

    <template #body>
      <ClientOnly>
        <UNavigationMenu
          :items="items"
          orientation="vertical"
          class="-mx-2.5"
        />
      </ClientOnly>

      <USeparator class="my-6" />

      <!-- Logged out state in mobile menu -->
      <template v-if="!isLoggedIn">
        <UButton
          label="Acceder"
          color="neutral"
          variant="subtle"
          to="/login"
          block
          class="mb-3"
        />
        <UButton
          label="Registrarse"
          color="neutral"
          to="/signup"
          block
        />
      </template>

      <!-- Logged in state in mobile menu -->
      <template v-else>
        <div class="flex items-center gap-3 mb-3 px-1">
          <UAvatar
            :text="userName"
            size="md"
            color="neutral"
          />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ userName }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ userStore.user.email }}
            </p>
          </div>
        </div>
        <UButton
          label="Dashboard"
          icon="i-lucide-layout-dashboard"
          color="neutral"
          variant="subtle"
          to="/protected/planes"
          block
          class="mb-3"
        />
        <UButton
          label="Cerrar sesión"
          icon="i-lucide-log-out"
          color="neutral"
          block
          @click="async () => await userStore.logout()"
        />
      </template>
    </template>
  </UHeader>
</template>
