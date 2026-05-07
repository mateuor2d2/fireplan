# Coding Conventions

**Analysis Date:** 2025-01-16

## Naming Patterns

**Files:**
- Vue components: PascalCase (e.g., `QRConfigForm.vue`, `AppHeader.vue`)
- Composables: camelCase with `use` prefix (e.g., `useFormHandler.ts`, `useErrorHandler.ts`, `useS3.ts`, `useQRCode.ts`)
- Stores: camelCase, singular (e.g., `user.ts`, `planes.ts`, `conceptos.ts`)
- Schemas: camelCase matching domain (e.g., `qr.ts`)
- Types: camelCase matching domain (e.g., `qr.ts`)
- Server API routes: kebab-case (e.g., `qr-settings.index.put.ts`, `toggle-qr.post.ts`)
- Server models: PascalCase (e.g., `User.ts`, `Planes.ts`)
- Server middleware: kebab-case (e.g., `auth.ts`)
- Server utils: camelCase (e.g., `db.ts`)

**Functions:**
- camelCase for all functions (e.g., `generateQRCode`, `handleSubmit`, `getUserSettings`)
- Async functions: `async` prefix not used in naming (e.g., `login`, `register`, `fetchUser`)
- Getter functions: `get` prefix (e.g., `getAccessToken`, `getFieldError`, `getUserSettings`)
- Setter functions: `set` prefix (e.g., `setUser`, `setFieldError`, `setAccesstoken`)
- Handler functions: `handle` prefix (e.g., `handleSubmit`, `handleApiError`, `handleReset`)
- Boolean functions: `is/has/should` prefix (e.g., `isGenerating`, `hasQRCode`, `hasChanges`)

**Variables:**
- camelCase for all variables (e.g., `formData`, `saveStatus`, `baseUrlHelper`)
- Boolean variables: `is/has` prefix (e.g., `isSubmitting`, `isGenerating`, `hasChanges`)
- Ref variables: `ref` suffix optional (e.g., `isGenerating`, `saving`, `error`)
- Computed variables: no special suffix, use descriptive names (e.g., `hasChanges`, `baseUrlHelper`)

**Types:**
- Interfaces: PascalCase (e.g., `User`, `QRSettings`, `PlanQRDocument`)
- Type aliases: PascalCase (e.g., `ExpirationDays`, `QRCodeState`, `QRErrorCode`)
- Generic types: PascalCase with descriptive names (e.g., `T extends z.ZodType`, `FormData`)
- Response types: PascalCase with suffix (e.g., `QRSettingsResponse`, `QRCodeResponse`)
- Document types: PascalCase with `Document` suffix for MongoDB (e.g., `PlanQRDocument`, `UserQRSettingsDocument`)

## Code Style

**Formatting:**
- ESLint with Nuxt auto-configuration (extends `.nuxt/eslint.config.mjs`)
- Key settings from `nuxt.config.ts:72-78`:
  - `commaDangle: "never"` - No trailing commas
  - `braceStyle: "1tbs"` - One True Brace Style (opening brace on same line)
- Single quotes for imports and strings (most consistent pattern observed)
- 2-space indentation (standard for Vue/Nuxt projects)
- Max line length: Not explicitly configured, but generally kept readable

**Linting:**
- ESLint via `@nuxt/eslint` module
- Config: `eslint.config.mjs` extends Nuxt's base config
- Run command: `bun lint` or `npm run lint`
- Type checking: `bun typecheck` or `npm run typecheck`

## Import Organization

**Order:**
1. Vue/Nuxt imports (auto-imported, explicit imports rare)
2. Third-party library imports (`import { z } from 'zod'`, `import bcrypt from 'bcryptjs'`)
3. Type imports (`import type { ... }`)
4. Internal imports (stores, composables, types, schemas)
5. Default exports last

**Path Aliases:**
- `~/` - Root of `app/` directory
- `~/stores` - Store files
- `~/composables` - Composable files
- `~/components` - Component files
- `~/types` - Type definition files
- `~/schemas` - Zod validation schema files
- `~/server/models` - Server model files (via Nitro alias)
- `~/server/services` - Server service files (via Nitro alias)
- `~/server/types` - Server type files (via Nitro alias)
- `~/server/utils` - Server utility files (via Nitro alias)

**Import Examples:**
```typescript
// Vue/Nuxt (often auto-imported)
import { ref, computed, watch } from 'vue'
import type { FormSubmitEvent } from '#ui/types'

// Third-party
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Type imports
import type { QRSettingsResponse, QRSettingsUpdate } from '~/schemas/qr'
import type { UserQRSettingsDocument } from '../types/qr'

// Internal imports
import { User } from '../../models/User'
import { useUserStore } from '~/stores/user'
import { useQRCode } from '~/composables/useQRCode'
```

## Error Handling

**Patterns:**
- Use `createError()` for Nuxt error responses (both client and server)
- Error objects have `statusCode` and `message/statusMessage` properties
- Try-catch-finally blocks for async operations
- Loading state management with `startLoading()` and `stopLoading()` in stores
- Error state stored in refs for UI display
- Console logging for debugging (especially in server routes)

**Store Error Pattern:**
```typescript
async methodName(params: Type) {
  this.startLoading()
  try {
    const data = await $fetch<Type>('/api/endpoint', {
      method: 'POST',
      body: params
    })
    // Process data
    return data
  } catch (error: any) {
    throw new Error(error.data?.message || error.message || 'Fallback error message')
  } finally {
    this.stopLoading()
  }
}
```

**Composable Error Pattern:**
```typescript
async function operationName() {
  try {
    isProcessing.value = true
    error.value = null
    // Perform operation
    successMessage.value = 'Success message'
    return result
  } catch (err: any) {
    const message = err?.message || err?.data?.message || 'Error message'
    error.value = message
    return null
  } finally {
    isProcessing.value = false
  }
}
```

**Server API Error Pattern:**
```typescript
export default defineEventHandler(async (event) => {
  try {
    // Validate request
    const body = await readValidatedBody(event, schema.parse)

    // Perform operation
    return { success: true, data: result }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: error.errors
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Operation failed'
    })
  }
})
```

## Logging

**Framework:** Console logging (no formal logging framework detected)

**Patterns:**
- `console.log()` for general debugging and request tracking
- `console.error()` for error logging
- Contextual logging with prefixes (e.g., `[QR Settings PUT]`, `Login request received`)
- Server-side logging is more verbose for debugging API issues
- Client-side logging is minimal (some console.error in composables)

**When to Log:**
- Request entry points (API route handlers)
- Authentication steps (login, token verification)
- Validation failures
- Database operations (connection, query errors)
- Critical business operations (QR generation, payment processing)

## Comments

**When to Comment:**
- JSDoc/TSDoc for exported functions, interfaces, and types
- Section headers with comment banners for code organization
- Inline comments for complex logic or validation rules
- TODO/FIXME comments for known issues (though rare in observed code)

**JSDoc/TSDoc:**
- Used on exported interfaces and types
- Used on composable functions
- Used on API route handlers (especially new ones)
- Format: Block comments with `/** */`

**Comment Banner Pattern:**
```typescript
// ============================================================================
// Section Name
// ============================================================================
```

**JSDoc Example:**
```typescript
/**
 * Composable for QR code operations
 * Provides reactive state management for QR code generation and status
 */
export function useQRCode() {
  // Implementation
}
```

## Function Design

**Size:**
- Composable functions: 50-200 lines (focused on single concern)
- Store actions: 20-50 lines (focused on single operation)
- API handlers: 50-150 lines (including validation and error handling)
- Component methods: 10-50 lines (kept small for readability)

**Parameters:**
- Object destructuring for multiple parameters (especially in composables)
- Generic type parameters for reusable functions (e.g., `T extends z.ZodType`)
- Options objects pattern for configuration (e.g., `UploadOptions`, `QRGenerateOptions`)
- Required parameters first, optional parameters last

**Return Values:**
- Stores: Return data directly or throw errors
- Composables: Return reactive state and methods as object
- API routes: Return typed response objects (usually `{ success, data }` or `{ success, error }`)
- Async functions: Return `Promise<T>` or `Promise<T | null>` (null for error cases)

**Composable Return Pattern:**
```typescript
return {
  // State (readonly refs)
  isGenerating: readonly(isGenerating),
  error: readonly(error),

  // Computed
  hasQRCode: computed(() => ...),

  // Methods
  generateQRCode,
  clearMessages
}
```

## Module Design

**Exports:**
- Named exports for functions, types, and utilities
- Default export for schemas (barrel export pattern)
- Store exports use `defineStore` with explicit name string

**Barrel Files:**
- Used in schema files to group related exports
- Pattern: Export all named exports, then default export object

**Schema Barrel Pattern Example:**
```typescript
export const PlanQRSchema = z.object({...})
export const QRSettingsUpdateSchema = z.object({...})

// Utility functions
export function calculateDaysUntilExpiration(expiresAt: Date): number {...}

export default {
  // Schemas
  PlanQRSchema,
  QRSettingsUpdateSchema,

  // Utilities
  calculateDaysUntilExpiration,

  // Values
  EXPIRATION_DAYS_OPTIONS
}
```

**Server Module Pattern:**
- Models: Export schema and model as named exports
- Types: Export interfaces and types, plus default export barrel
- API routes: Export default event handler
- Middleware: Export default event handler
- Utils: Export named functions (no default exports)

## Vue Component Conventions

**Script Setup:**
- Use `<script setup lang="ts">` for all Vue components
- Define props with `defineProps<Props>()` and `withDefaults()`
- Define emits with `defineEmits<{...}>()` for type safety
- Use composables for logic reuse
- Reactive state with `ref()` and `computed()`

**Component Structure:**
```vue
<template>
  <!-- Template markup with Nuxt UI components -->
</template>

<script setup lang="ts">
// 1. Imports (composables, types, components)
// 2. Props and emits definition
// 3. Reactive state (refs, computed)
// 4. Methods
</script>
```

**Props Pattern:**
```typescript
interface Props {
  modelValue?: QRSettings
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  loading: false
})
```

**Emits Pattern:**
```typescript
const emit = defineEmits<{
  save: [settings: QRSettings]
  reset: []
}>()
```

## TypeScript Conventions

**Type Safety:**
- Strict TypeScript (inherited from Nuxt config)
- Type imports with `import type` where possible
- Generic type parameters for reusable functions
- Zod for runtime validation with TypeScript inference
- Interface definitions for all domain entities

**Type Organization:**
- Client types in `app/types/` (e.g., `qr.ts`)
- Server types in `server/types/` (e.g., `qr.ts`)
- Zod schemas in `app/schemas/` with inferred types
- Model interfaces in `server/models/` files
- Shared types imported across client/server boundary

**Type Naming:**
- Domain entities: Singular PascalCase (e.g., `User`, `Plan`, `QRSettings`)
- Request/response types: PascalCase with suffix (e.g., `LoginRequest`, `QRSettingsResponse`)
- Document types: PascalCase with `Document` suffix (e.g., `UserQRSettingsDocument`)
- Option types: PascalCase with `Options` suffix (e.g., `QRGenerateOptions`)
- Error types: PascalCase with `Error` suffix (e.g., `ErrorResponse`, `QRErrorResponse`)

---

*Convention analysis: 2025-01-16*
