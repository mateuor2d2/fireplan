---
name: nuxt-4-composables-reactivity
description: Nuxt 4 composables for reactive state management and data fetching. Use when implementing useState, useAsyncData, or useFetch patterns, managing SSR-friendly state, handling reactive data dependencies, or working with Nuxt's auto-imported reactivity APIs.
---

# Nuxt 4 Composables & Reactivity

Reactive state management and data fetching composables for Nuxt 4.

## When to Apply

- Creating shared state with `useState` for SSR compatibility
- Fetching data with `useAsyncData` or `useFetch` patterns
- Managing reactive dependencies and auto-refetch behavior
- Handling cached data access with `useNuxtData`

## Critical Rules

**SSR State Serialization**: Only serializable data in `useState`

```typescript
// WRONG - functions/classes break SSR
const user = useState('user', () => ({
  name: 'John',
  greet: () => 'Hello' // Will break during hydration
}))

// RIGHT - plain serializable objects
const user = useState('user', () => ({
  name: 'John',
  id: 1,
  settings: { theme: 'dark' }
}))
```

**Reactive Key Dependencies**: Use computed/ref for dynamic keys

```typescript
// WRONG - static key won't update when route changes
const { data } = useAsyncData('user', () => 
  $fetch(`/api/users/${route.params.id}`)
)

// RIGHT - reactive key updates automatically
const userId = computed(() => `user-${route.params.id}`)
const { data } = useAsyncData(userId, () => 
  $fetch(`/api/users/${route.params.id}`)
)
```

## Key Patterns

### Global State with useState

```typescript
// Define in composables/useAuth.ts
export const useAuthUser = () => useState<User | null>('auth.user', () => null)

// Use in components
const user = useAuthUser()
```

### Reactive Data Fetching

```typescript
const searchQuery = ref('initial')
const { data, refresh } = await useFetch('/api/search', {
  query: { q: searchQuery }, // Auto-refetches when searchQuery changes
})

// To disable auto-refetch
const { data } = await useFetch('/api/search', {
  query: { q: searchQuery },
  watch: false, // Manual control only
})
```

### Cache Access with useNuxtData

```typescript
// Parent: fetch with key
const { data } = await useFetch('/api/posts', { key: 'posts' })

// Child: access cached data
const { data: posts } = useNuxtData('posts')
const { data } = useLazyFetch(`/api/posts/${route.params.id}`, {
  default() {
    return posts.value?.find(post => post.id === route.params.id)
  }
})
```

### Lazy Loading for Performance

```typescript
// Non-blocking navigation
const { status, data: posts } = useLazyFetch('/api/posts')

// Handle loading state
const isLoading = computed(() => status.value === 'pending')
```

### Data Invalidation

```typescript
// Clear specific cache entries
clearNuxtData(['users', 'posts'])

// Clear all cached data
clearNuxtData()

// Refresh specific data
await refreshNuxtData(['users'])
```

## Common Mistakes

- **Non-serializable state** — Classes, functions, or symbols in `useState` break SSR
- **Static keys with dynamic data** — Use computed keys for route-dependent fetching
- **Blocking navigation** — Use `useLazyFetch` for non-critical data
- **Missing watch control** — Set `watch: false` to prevent unwanted refetches