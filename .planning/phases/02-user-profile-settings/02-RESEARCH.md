# Phase 02: User Profile Settings - Research

**Researched:** 2026-02-11
**Domain:** User profile management, password security, QR code management
**Confidence:** HIGH

## Summary

This phase implements the user profile settings functionality with three main tabs: Perfil (profile), Contrasena (password change), and Codigos QR (QR code management). The existing codebase already has significant infrastructure in place including:

1. **User Model** - Already has nombre, email, telefono fields (matriz_nombre, matriz_tel)
2. **Password Change API** - POST /api/auth/change-password already exists and is working
3. **QR Settings API** - GET/PUT /api/user/qr-settings are complete with QRConfigForm component
4. **Settings Navigation** - UTabs-based settings page at /protected/settings/ already exists
5. **User Store** - Pinia store with updateUser(), changePassword(), updateQRSettings() methods

The primary implementation work is creating the UI pages and components that use the existing backend infrastructure.

**Primary recommendation:** Use Nuxt UI v4 components (UCard, UInput, UButton, UTabs) following the existing qr.vue page pattern. Create two new pages (perfil.vue, contrasena.vue) and one new composable (useQRList) for QR code management.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Nuxt 3 | 3.18+ | Application framework | Already in use, migrating to Nuxt 4 |
| Nuxt UI Pro | 4.3.0 | UI component library | Already configured, provides UTabs, UCard, UInput |
| Vue 3 Composition API | Latest | Reactive component logic | Standard for Nuxt 3 |
| Pinia | Latest | State management | Already configured for user store |
| Zod | Latest | Input validation | Already used throughout codebase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bcryptjs | Latest | Password hashing | Already used in auth/change-password endpoint |
| QRCode (qrcode) | Latest | QR code generation | Already used in qrService |
| useToast | Nuxt Composable | User notifications | Standard for success/error feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| UTabs (Nuxt UI v4) | Custom tabs implementation | UTabs provides built-in routing and styling |
| useUserStore actions | Direct API calls | Store provides centralized state and error handling |

**Installation:**
```bash
# No additional packages needed - all dependencies already installed
bun install
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── pages/protected/settings/
│   ├── index.vue          # Already exists - UTabs navigation
│   ├── qr.vue             # Already exists - QR settings form
│   ├── perfil.vue         # NEW - User profile form
│   └── contrasena.vue     # NEW - Password change form
├── composables/
│   ├── useQRList.ts       # NEW - QR code list management
│   └── useUserStore.ts    # Already exists - user state
├── components/
│   ├── qr/                # Already exists
│   │   ├── QRConfigForm.vue
│   │   ├── QRPreview.vue
│   │   └── QRStatusBadge.vue
│   └── settings/          # NEW - Settings components (optional)
│       └── ProfileForm.vue  # Extractable reusable component
server/
├── api/
│   ├── auth/
│   │   ├── me.get.ts          # Already exists
│   │   ├── me.put.ts          # Already exists - profile update
│   │   └── change-password.post.ts  # Already exists
│   ├── user/
│   │   └── qr-settings/       # Already exists
│   └── planes/
│       ├── [id]/generate-qr.post.ts    # Already exists
│       ├── [id]/regenerate-qr.post.ts  # Already exists
│       └── [id]/toggle-qr.post.ts      # Already exists
```

### Pattern 1: Settings Page with UTabs Navigation
**What:** Use UTabs component with route-based navigation for settings sections
**When to use:** Multi-section settings pages with independent tabs
**Example:**
```vue
<!-- Source: /app/pages/protected/settings/index.vue (existing) -->
<template>
  <UTabs
    :default-value="currentTab"
    :items="tabs"
    @change="handleTabChange"
  >
    <template #default="{ item }">
      <NuxtPage />
    </template>
  </UTabs>
</template>

<script setup lang="ts">
const tabs = [
  { label: 'General', icon: 'i-heroicons-cog-6-tooth', value: 'general', to: '/protected/settings/general' },
  { label: 'Códigos QR', icon: 'i-heroicons-qrcode', value: 'qr', to: '/protected/settings/qr' },
  { label: 'Perfil', icon: 'i-heroicons-user', value: 'profile', to: '/protected/settings/profile' }
]
</script>
```

### Pattern 2: Profile Form with User Store Integration
**What:** Form component that uses useUserStore.updateUser() for updates
**When to use:** Any user profile editing interface
**Example:**
```typescript
// Source: Based on existing useUserStore pattern
const userStore = useUserStore()
const toast = useToast()

async function handleSave(profileData: ProfileData) {
  saving.value = true
  try {
    await userStore.updateUser({
      name: profileData.nombre,
      email: profileData.email,
      matriz_tel: profileData.telefono
      // Other fields as needed
    })
    toast.add({
      title: 'Perfil actualizado',
      description: 'Tu información ha sido guardada',
      color: 'green'
    })
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}
```

### Pattern 3: Password Change with Confirmation
**What:** Password change form requiring current password and new password confirmation
**When to use:** User password update flows
**Example:**
```typescript
// Source: Based on existing useUserStore.changePassword()
async function handleChangePassword(data: PasswordData) {
  saving.value = true
  try {
    await userStore.changePassword(
      data.currentPassword,
      data.newPassword
    )
    toast.add({
      title: 'Contraseña cambiada',
      description: 'Tu contraseña ha sido actualizada correctamente',
      color: 'green'
    })
    // Clear form
    formData.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error.message || 'La contraseña actual es incorrecta',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}
```

### Pattern 4: QR Code List with Actions
**What:** Paginated list of user's plans with QR codes and management actions
**When to use:** Settings page QR codes management tab
**Example:**
```typescript
// Source: Based on existing planes.get.ts and QR API endpoints
const loading = ref(true)
const plansWithQR = ref<PlanWithQR[]>([])

async function loadPlansWithQR() {
  loading.value = true
  try {
    const response = await $fetch<{ data: IPlan[], total: number }>('/api/planes', {
      query: {
        userId: userStore.user._id,
        $limit: 50
      }
    })
    // Filter plans that have QR codes
    plansWithQR.value = response.data.filter(plan => plan.qrCode)
  } catch (error) {
    console.error('Error loading plans:', error)
  } finally {
    loading.value = false
  }
}

async function regenerateQR(planId: string) {
  try {
    await $fetch(`/api/planes/${planId}/regenerate-qr`, { method: 'POST' })
    toast.add({ title: 'QR regenerado', color: 'green' })
    await loadPlansWithQR()
  } catch (error) {
    toast.add({ title: 'Error al regenerar', color: 'red' })
  }
}

async function toggleQR(planId: string, enabled: boolean) {
  try {
    await $fetch(`/api/planes/${planId}/toggle-qr`, {
      method: 'POST',
      body: { enabled }
    })
    toast.add({ title: enabled ? 'QR activado' : 'QR desactivado', color: 'green' })
    await loadPlansWithQR()
  } catch (error) {
    toast.add({ title: 'Error al cambiar estado', color: 'red' })
  }
}
```

### Anti-Patterns to Avoid
- **Hardcoded Spanish text without i18n:** Currently acceptable per codebase pattern, but use consistent Spanish labels
- **Direct API calls bypassing userStore:** Use store methods for consistent error handling and state updates
- **Loading states on individual fields:** Use form-level loading state for better UX
- **Not validating password match:** Always validate newPassword === confirmPassword before submission

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod schemas + vee-validate | Already used in codebase, provides consistent error messages |
| Password hashing | Custom bcrypt implementation | Use existing changePassword endpoint | Already implements bcrypt.compare and hashing |
| QR code display | Custom QR rendering | QRPreview, QRStatusBadge components | Already built, handles all QR states |
| Toast notifications | Custom notification system | useToast() composable | Built into Nuxt UI, consistent styling |
| Tab navigation | Custom tab switching | UTabs component | Handles routing, active states, accessibility |
| URL input validation | Custom URL parsing | Zod's z.string().url() | Already used in QR settings |

**Key insight:** The backend APIs (profile update, password change, QR management) are complete. This phase is primarily about creating UI pages that consume existing APIs using established patterns.

## Common Pitfalls

### Pitfall 1: OAuth Users Without Passwords
**What goes wrong:** Users who registered via Google/GitHub OAuth don't have a password field
**Why it happens:** User model has password as optional (select: false), OAuth users bypass password creation
**How to avoid:** Check if user.password exists before showing password change tab, show message "Users registered via OAuth cannot change password"
**Warning signs:** userStore.changePassword() throws "password not found" error

### Pitfall 2: Email Uniqueness Conflict
**What goes wrong:** User tries to update email to one that's already registered
**Why it happens:** me.put.ts returns 409 for duplicate email (code: 11000)
**How to avoid:** Show clear error message when update fails with duplicate email error, maybe check availability via debounce
**Warning signs:** "El correo electronico ya esta en uso" error from API

### Pitfall 3: QR Code State Calculation on Client
**What goes wrong:** QR state (active/disabled/expired) calculated incorrectly due to timezone issues
**Why it happens:** expiresAt is stored in UTC, client may be in different timezone
**How to avoid:** Use server-calculated state from QR API endpoints, or use Date.UTC() for comparisons
**Warning signs:** QR shows as expired when it should be active

### Pitfall 4: Password Confirmation Mismatch
**What goes wrong:** User submits form with newPassword !== confirmPassword
**Why it happens:** Client-side validation missing or bypassed
**How to avoid:** Add form validation using Zod or vee-validate before API call
**Warning signs:** API returns success but user can't log in with new password

### Pitfall 5: Missing QR Code on Plan
**What goes wrong:** Plan exists but qrCode field is null
**Why it happens:** QR code not generated (user had autoGenerate: false, or plan created before QR feature)
**How to avoid:** Show empty state in QR list with "Generate QR" button that calls generate-qr endpoint
**Warning signs:** plansWithQR filter shows empty array for user with plans

## Code Examples

Verified patterns from official sources:

### User Profile Update
```typescript
// Source: /server/api/auth/me.put.ts (existing)
// PUT /api/auth/me
const response = await $fetch<User>('/api/auth/me', {
  method: 'PUT',
  body: {
    name: 'Juan Perez',
    email: 'juan@example.com',
    matriz_tel: '+34 600 000 000',
    matriz_nombre: 'Empresa SA',
    // Other allowed fields: matriz_cif, matriz_dir, matriz_pob, matriz_cp, matriz_obs, matriz_contacto
  }
})
```

### Password Change
```typescript
// Source: /server/api/auth/change-password.post.ts (existing)
// POST /api/auth/change-password
await $fetch('/api/auth/change-password', {
  method: 'POST',
  body: {
    currentPassword: 'oldPassword123',
    newPassword: 'newPassword456'
  }
})
// Returns: { success: true }
```

### QR Code List
```typescript
// Source: /server/api/planes.get.ts (existing)
// GET /api/planes?userId=XXX
const response = await $fetch<{ data: IPlan[], total: number }>('/api/planes', {
  query: {
    userId: userStore.user._id,
    $limit: 50,
    $skip: 0
  }
})
// Filter for QR codes:
const plansWithQR = response.data.filter(plan => plan.qrCode)
```

### QR Code Actions
```typescript
// Source: /server/api/planes/[id]/regenerate-qr.post.ts (existing)
// POST /api/planes/[id]/regenerate-qr
await $fetch(`/api/planes/${planId}/regenerate-qr`, { method: 'POST' })

// Source: /server/api/planes/[id]/toggle-qr.post.ts (existing)
// POST /api/planes/[id]/toggle-qr
await $fetch(`/api/planes/${planId}/toggle-qr`, {
  method: 'POST',
  body: { enabled: false }
})

// Source: /server/api/planes/[id]/generate-qr.post.ts (existing)
// POST /api/planes/[id]/generate-qr
await $fetch(`/api/planes/${planId}/generate-qr`, {
  method: 'POST',
  body: {
    expirationDays: 90,
    baseUrl: 'https://example.com'
  }
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Options API | Composition API | Nuxt 3 migration | Use <script setup> with ref/computed |
| Custom components | Nuxt UI v4 | Current codebase | Use UCard, UInput, UButton, UTabs |
| Client-side validation only | Zod validation (server) | Current codebase | All API endpoints use Zod schemas |
| JWT in localStorage | HTTP-only cookies | Current codebase | Auth uses secure cookies |
| Manual store updates | Pinia store actions | Current codebase | useUserStore methods for all user operations |

**Deprecated/outdated:**
- Options API: Use Composition API with <script setup>
- Veelidate v2: Use Zod for validation (already configured)
- Custom form components: Use Nuxt UI v4 components

## Open Questions

1. **Should we create a separate API endpoint for listing user's QR codes?**
   - What we know: /api/planes with userId filter works but requires client-side filtering for qrCode existence
   - What's unclear: Performance impact of loading all plans then filtering
   - Recommendation: Use existing /api/planes endpoint first, create dedicated endpoint if performance issues arise

2. **How should we handle OAuth users without passwords?**
   - What we know: User model allows password to be optional for OAuth users
   - What's unclear: UX pattern for password change tab when user has no password
   - Recommendation: Hide password change tab or show "Set password" option instead of "Change password"

3. **Should QR codes list be paginated?**
   - What we know: /api/planes supports $limit and $skip parameters
   - What's unclear: How many QR codes a typical user might have
   - Recommendation: Start with simple list (no pagination), add if users have many plans

## Sources

### Primary (HIGH confidence)
- /server/models/User.ts - User model schema with allowed fields
- /app/stores/user.ts - User store methods (updateUser, changePassword, updateQRSettings)
- /server/api/auth/me.put.ts - Profile update endpoint
- /server/api/auth/change-password.post.ts - Password change endpoint
- /server/api/user/qr-settings/index.get.ts - QR settings get endpoint
- /server/api/user/qr-settings/index.put.ts - QR settings update endpoint
- /server/api/planes.get.ts - Planes list endpoint
- /server/api/planes/[id]/generate-qr.post.ts - QR generation endpoint
- /server/api/planes/[id]/regenerate-qr.post.ts - QR regeneration endpoint
- /server/api/planes/[id]/toggle-qr.post.ts - QR toggle endpoint
- /app/pages/protected/settings/index.vue - Settings navigation page
- /app/pages/protected/settings/qr.vue - QR settings page (pattern reference)
- /app/components/qr/QRConfigForm.vue - QR settings form component
- /app/components/qr/QRPreview.vue - QR preview component
- /app/components/qr/QRStatusBadge.vue - QR status badge component
- /app/schemas/qr.ts - QR type definitions and schemas

### Secondary (MEDIUM confidence)
- /server/api/planes.post.ts - Plan creation with auto QR generation logic
- /server/api/auth/login.post.ts - Password validation pattern using bcrypt

### Tertiary (LOW confidence)
- None - all research based on actual codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from package.json and existing code
- Architecture: HIGH - All patterns verified from existing pages and components
- Pitfalls: HIGH - All verified from actual code analysis
- API endpoints: HIGH - All endpoints exist and are functional
- Component patterns: HIGH - qr.vue provides complete pattern reference

**Research date:** 2026-02-11
**Valid until:** 30 days (stable domain, existing infrastructure)
