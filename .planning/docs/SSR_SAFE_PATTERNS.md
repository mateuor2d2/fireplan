# SSR-Safe Coding Patterns for v9planes

## The Problem

During SSR (Server-Side Rendering):
- `userStore.user` may be `null` or `undefined`
- Accessing `userStore.user._id` synchronously throws: `Cannot read properties of null (reading 'ce')`
- This happens during `<script setup>` phase, before template rendering
- `ClientOnly` wrapper does NOT protect setup-phase code

## The Solution

### ❌ WRONG (SSR-Unsafe)
```typescript
const userStore = useUserStore()
const userId = userStore.user._id  // THROWS ERROR during SSR
```

### ✅ CORRECT (SSR-Safe)

#### Option 1: Use Computed
```typescript
const userStore = useUserStore()
const userId = computed(() => userStore.user?._id)
// In template: use `userId.value` or just `userId` (auto-unwraps in templates)
```

#### Option 2: Use Nullable with Defaults
```typescript
const userStore = useUserStore()
const userId = userStore.user?._id ?? 'default'
```

#### Option 3: Lazy Access in Methods
```typescript
const userStore = useUserStore()

const someMethod = () => {
  const userId = userStore.user?._id  // Safe: executed during user interaction
  // ...
}
```

#### Option 4: useLazyAsyncData for API Calls
```typescript
const userStore = useUserStore()
const { data } = useLazyAsyncData('user-data', () =>
  fetchData(userStore.user?._id),
  { server: false }  // Only run on client
)
```

## Files Requiring Fixes

### High Priority (Setup Phase Access)
1. `app/layouts/app.vue` ✅ FIXED
2. `app/layouts/plan.vue` ✅ FIXED
3. `app/components/ModalEditPresupuestoItem.vue:78` - NEEDS FIX
4. Any page/component with top-level `const x = userStore.user._id`

### Medium Priority (Method Access - Usually OK)
- Methods that access `userStore.user._id` are usually OK
- They execute after component mount, not during SSR setup
- Example: `UserPartidasManager.vue` methods (lines 52-53, etc.)

### Low Priority (Store Code)
- Store code is usually OK because stores execute after initialization
- But verify they don't access `user.user._id` during store initialization

## Testing After Fixes

1. Run dev server: `bun run dev`
2. Visit a page that was failing
3. Check console for SSR errors
4. Test page refresh (Ctrl+Shift+R)
5. Test direct URL access (not navigation)

## Common Gotchas

1. **Template strings in arrays**:
   ```typescript
   // BAD - evaluated during setup
   const links = [{ to: `/users/${userStore.user._id}` }]

   // GOOD - computed
   const links = computed(() => [{ to: `/users/${userId.value}` }])
   ```

2. **Console.log statements**:
   ```typescript
   // BAD - throws during SSR if user is null
   console.log(userStore.user._id)

   // GOOD - optional chaining
   console.log(userStore.user?._id)
   ```

3. **Route params**:
   ```typescript
   // BAD - synchronous access
   const planId = route.params.id

   // GOOD - computed
   const planId = computed(() => route.params.id)
   ```
