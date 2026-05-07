# AGENTS.md

Essential guide for AI coding agents working in this codebase.

## Build & Development Commands

**Package Manager**: `bun` (primary)

```bash
bun install              # Install dependencies
bun dev                  # Dev server (http://localhost:3000)
bun build                # Production build
bun run build:render     # Build with memory optimization (4GB)
bun typecheck            # Type checking
bun lint                 # ESLint
bun run clean            # Clean .nuxt .output caches
```

### Testing (Vitest)

```bash
bun test                                        # Run all tests
bun test tests/middleware/rateLimit.test.ts     # Run single test file
```

## Technology Stack

Nuxt 4.2.2, Vue 3, TypeScript 5.9+, Nuxt UI 4.3.0, Tailwind CSS v4, Pinia, MongoDB + Mongoose, Zod

## Project Structure

```
app/
  components/    # Vue components (auto-imported)
  composables/   # Vue composables (auto-imported)
  stores/        # Pinia stores
  schemas/       # Zod validation schemas
  pages/         # File-based routing
  middleware/    # Client middleware (auth.ts)
server/
  api/           # API routes (auto-routed by filename)
  models/        # Mongoose models
  utils/         # Server utilities (db.ts, auth.ts)
tests/           # Vitest unit tests
```

## Code Style

### TypeScript
- Strict TypeScript with explicit types
- Use `interface` for object shapes, `type` for unions

### Imports

```typescript
// Server-side aliases
import { User } from '~/server/models/User'
import { connectDB } from '~/server/utils/db'

// Client-side: use relative paths (no ~ or @ aliases)
import { useUserStore } from '../stores/user'
```

### Vue Components

```vue
<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: ''
})

const emit = defineEmits<{
  (e: 'update', value: string): void
}>()
</script>

<template>
  <div><h1>{{ title }}</h1></div>
</template>
```

### API Routes

```typescript
import { User } from '~/server/models/User'
import { connectDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  
  try {
    const result = await User.create(body)
    return { success: true, data: result }
  } catch (error: any) {
    throw createError({ statusCode: 400, message: error.message || 'Operation failed' })
  }
})
```

### Pinia Stores

```typescript
import { defineStore } from 'pinia'

interface State {
  items: Item[]
  current: Item | null
}

export const useItemsStore = defineStore('items', {
  state: (): State => ({ items: [], current: null }),
  actions: {
    async fetchItems() {
      const data = await $fetch('/api/items')
      this.items = data
    }
  }
})
```

### Error Handling

```typescript
// Server: throw createError({ statusCode: 404, message: 'Not found' })
// Client: try/catch with $fetch, use error.data?.message || error.message
```

### ESLint

- `commaDangle: 'never'` - No trailing commas
- `braceStyle: '1tbs'` - Opening brace on same line

## Key Patterns

### Zod Validation

```typescript
import { z } from 'zod'

export const planSchema = z.object({
  nom_obra: z.string().min(1).max(200),
  desc_obra: z.string().min(1)
})

export type PlanInput = z.infer<typeof planSchema>
```

### Mongoose Models

```typescript
import { Schema, model } from 'mongoose'
import type { Document, Model } from 'mongoose'

interface IUser extends Document {
  email: string
  name?: string
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String }
}, { timestamps: true })

export const User: Model<IUser> = model<IUser>('User', UserSchema)
```

### Testing

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Feature', () => {
  beforeEach(() => { /* Setup */ })
  afterEach(() => { /* Cleanup */ })

  it('should do something', async () => {
    const result = await someFunction()
    expect(result).toBe(expected)
  })
})
```

## Language Convention

- **Spanish**: User-facing content, database fields, business terms (obra, contratista, promotor)
- **English**: Code, comments, variable names, function names, types

## Important Files

| Purpose | File |
|---------|------|
| Nuxt config | `nuxt.config.ts` |
| Database connection | `server/utils/db.ts` |
| Auth helpers | `server/utils/auth.ts` |
| User store | `app/stores/user.ts` |
| Plan store | `app/stores/planes.ts` |

## Notes

- SSR is **disabled** (`ssr: false`) due to Nuxt UI v4 compatibility
- JWT tokens in HTTP-only cookies
- Auth middleware: `app/middleware/auth.ts` (client), `server/middleware/auth.ts` (server)
- Validate ownership on all plan operations
