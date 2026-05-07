# Debug: USelect Dropdown Empty - Nuxt UI v4 Migration Issue

**Date:** 2026-02-08
**Status:** ✅ RESOLVED

---

## Issue Summary
**Location:** `/protected/usuarios/payments` (and other pages)
**Symptom:** Dropdown (`USelect`/`USelectMenu`) shows no items when clicked

---

## Root Cause

**Nuxt UI v3 → v4 Breaking Change:**
- **Nuxt UI v3:** Used `:options` prop for dropdown items
- **Nuxt UI v4:** Changed to `:items` prop

**Affected Components:**
1. `USelect` - `:options` → `:items`
2. `USelectMenu` - `:options` → `:items`

---

## Evidence

### 1. payments/index.vue (Line 16-21)
```vue
<USelect
  v-model="selectedTab"
  :options="tabOptions"  ❌ WRONG - Nuxt UI v4 uses :items
  option-attribute="label"
  value-attribute="value"
/>
```

### 2. IssueSharingSection.vue (Line 114)
```vue
<USelectMenu
  :options="filteredUsers"  ❌ WRONG
  option-attribute="name"
  value-attribute="id"
/>
```

### 3. contact.vue (Line 41-44)
```vue
<USelect
  v-model="form.subject"
  :options="subjects"  ❌ WRONG
  required
/>
```

---

## Fix Required

### Pattern Change
| Nuxt UI v3 | Nuxt UI v4 |
|------------|------------|
| `:options` | `:items` |
| `option-attribute` | `option-attribute` (same) |
| `value-attribute` | `value-attribute` (same) |

### Files to Fix
1. `app/pages/protected/usuarios/payments/index.vue`
2. `app/components/IssueSharingSection.vue`
3. `app/pages/contact.vue`

---

## Action Plan

1. ✅ Identified root cause (Nuxt UI v4 API change)
2. ✅ Fixed all 3 files by replacing `:options` with `:items`
3. ⏳ Verify dropdowns show items correctly (user testing required)

---

## Fixed Files

1. ✅ `app/pages/protected/usuarios/payments/index.vue` - Line 18: `:options` → `:items`
2. ✅ `app/components/IssueSharingSection.vue` - Line 114: `:options` → `:items`
3. ✅ `app/pages/contact.vue` - Line 43: `:options` → `:items`

---

## Verification

User should refresh http://localhost:5000/protected/usuarios/payments and verify:
- [ ] Tab dropdown shows "Pagos" and "Invoices" options
- [ ] Clicking dropdown items switches between views correctly

---

## Related Issues

This is part of the larger Nuxt 4 migration. Other components may have similar breaking changes.

Reference: `.planning/debug/SSR-FIX-SUMMARY.md` (SSR disabled due to Nuxt UI v4 compatibility)
