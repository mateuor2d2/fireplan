<script setup lang="ts">
interface NavItem {
  _path: string
  title: string
  children?: NavItem[]
}

const navigation = inject<Ref<NavItem[]>>('navigation', ref([]))

const mapContentNavigation = (nav: NavItem[]): any[] => {
  return nav.map(item => ({
    label: item.title,
    to: item._path,
    children: item.children ? mapContentNavigation(item.children) : undefined
  }))
}

const links = [{
  label: 'Sobre FirePlan',
  to: '/about'
}, {
  label: 'Precios',
  to: '/pricing'
}, {
  label: 'Contacto',
  to: '/contact'
}]
</script>

<template>
  <UHeader :links="links">
    <template #logo>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-fire" class="w-6 h-6 text-primary" />
        <span class="font-bold text-lg">FirePlan</span>
      </div>
    </template>

    <template #right>
      <UButton
        label="Iniciar sesión"
        color="neutral"
        to="/login"
      />
      <UButton
        label="Registrarse"
        icon="i-heroicons-arrow-right-20-solid"
        trailing
        color="primary"
        to="/register"
        class="hidden lg:flex"
      />
    </template>

    <template #panel>
      <UNavigationTree
        :links="mapContentNavigation(navigation)"
        default-open
      />
    </template>
  </UHeader>
</template>
