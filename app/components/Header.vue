<script setup lang="ts">
// Type for navigation items - using ContentNavigationItem from Nuxt Content
interface NavItem {
  _path: string
  title: string
  children?: NavItem[]
}

const navigation = inject<Ref<NavItem[]>>('navigation', ref([]))

// Simple mapper for navigation items
const mapContentNavigation = (nav: NavItem[]): any[] => {
  return nav.map(item => ({
    label: item.title,
    to: item._path,
    children: item.children ? mapContentNavigation(item.children) : undefined
  }))
}

const links = [{
  label: 'Docs',
  to: '/docs'
}, {
  label: 'Pricing',
  to: '/pricing'
}, {
  label: 'Blog',
  to: '/blog'
}]
</script>

<template>
  <UHeader :links="links">
    <template #logo>
      Prevenius
    </template>

    <template #right>
      <UButton
        label="Sign in"
        color="neutral"
        to="/login"
      />
      <UButton
        label="Sign up"
        icon="i-heroicons-arrow-right-20-solid"
        trailing
        color="primary"
        to="/signup"
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
