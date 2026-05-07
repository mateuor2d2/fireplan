---
name: nuxt-4-development
description: Nuxt 4 framework with file-based routing, composables, SSR/SSG capabilities, and UI component patterns. Use when building pages with dynamic routes, implementing server-side rendering, managing component auto-imports, or setting up static site generation.
---

# Nuxt 4 Development

Modern full-stack framework with file-based routing, auto-imports, and rendering flexibility.

## When to Apply

- Building pages with file-based routing and dynamic parameters
- Implementing SSR/SSG for performance and SEO
- Managing component auto-imports and composables
- Setting up Nuxt UI component patterns

## Critical Rules

**Dynamic Route Structure**: Use bracket notation for parameters, double brackets for optional

```javascript
// WRONG - Nuxt 2 syntax
pages/_id.vue

// RIGHT - Nuxt 4 syntax
pages/[id].vue
pages/[[slug]].vue  // optional parameter
pages/users-[group]/[id].vue  // mixed parameters
```

**Component Auto-Import**: Place in `~/components` directory, no explicit imports needed

```vue
<!-- WRONG - manual imports -->
<script setup>
import MyComponent from '~/components/MyComponent.vue'
</script>

<!-- RIGHT - auto-imported -->
<script setup>
// MyComponent automatically available
</script>
<template>
  <MyComponent />
</template>
```

## Key Patterns

### Page Structure with Composables

```vue
<!-- pages/users/[id].vue -->
<template>
  <div>
    <h1>{{ data.name }}</h1>
    <p>{{ data.email }}</p>
  </div>
</template>

<script setup>
const route = useRoute()
const { data, error } = await useFetch(`/api/users/${route.params.id}`)

useHead({
  title: `User: ${data.value?.name}`,
  meta: [
    { name: 'description', content: `Profile for ${data.value?.name}` }
  ]
})
</script>
```

### Layout with Nested Routes

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <header>My App</header>
    <NuxtPage />
  </div>
</template>
```

### Component Directory Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  components: [
    {
      path: '~/components',
      pathPrefix: false,  // Use <Button> not <ComponentsButton>
    },
    {
      path: '~/components/ui',
      prefix: 'U',  // Use <UButton> for ui components
    }
  ],
})
```

### SSR/SSG Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,  // Server-side rendering (default)
  nitro: {
    prerender: {
      routes: ['/sitemap.xml', '/robots.txt']
    }
  }
})
```

### Data Fetching Patterns

```vue
<script setup>
// Reactive fetch with transform
const { data: posts } = await useFetch('/api/posts', {
  transform: (posts) => posts.map(post => ({
    ...post,
    slug: post.title.toLowerCase().replace(/\s+/g, '-')
  }))
})

// Lazy loading for non-critical data
const { data: stats } = await useFetch('/api/stats', {
  lazy: true,
  default: () => ({ views: 0, likes: 0 })
})
</script>
```

### State Management

```vue
<script setup>
// Global state with useState
const user = useState('user', () => ({ name: '', email: '' }))

// Reactive navigation
const navigateToProfile = () => {
  return navigateTo(`/users/${user.value.id}`)
}
</script>
```

## Common Mistakes

- **File naming**: Use `[param].vue` not `_param.vue` for dynamic routes
- **Component imports**: Don't manually import components from `~/components` directory
- **Route access**: Use `useRoute()` not `this.$route` in `<script setup>`
- **Generate command**: Use `nuxt generate` not `nuxt build` for static sites