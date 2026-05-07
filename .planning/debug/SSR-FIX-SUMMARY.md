# SSR Hydration Error - Fix Summary

**Date:** 2026-02-08
**Issue:** Cannot read properties of null (reading 'ce')
**Status:** ✅ Fixed

## Problem

Starting in phase 10, the app crashed with:
```
Cannot read properties of null (reading 'ce')
Hydration node mismatch: rendered on server: [object Comment] expected on client: Symbol(v-fgt)
```

**Root Cause:** Nuxt UI v4.3.0's underlying library (Reka UI 2.6.1) has SSR compatibility issues. The `ConfigProvider` component passes null context during `renderSlot()` calls.

## Solution

**Primary Fix:** Disabled SSR in `nuxt.config.ts`
```typescript
ssr: false, // Disable SSR due to Nuxt UI v4 compatibility issues with Reka UI
```

**Additional Fixes:** Wrapped problematic components in `<ClientOnly>`:
- `UColorModeButton` (browser API access)
- `UNavigationMenu` (Reka UI NavigationMenuRoot)
- `UDropdownMenu` with function handlers (non-serializable)
- `UHeader` / `UFooter` (contain problematic components)
- `TemplateMenu` (uses v-slot="{ open }")

## Trade-offs

- ✅ App works 100%
- ⚠️ No server-side rendering (SEO impact for public pages)
- ✅ Can continue development
- ✅ SSR can be re-enabled when Nuxt UI fixes upstream

## Files Modified

1. `nuxt.config.ts` - Added `ssr: false`
2. `app/app.vue` - Fixed colorMode SSR access
3. `app/components/AppHeader.vue` - ClientOnly wrappers
4. `app/components/AppFooter.vue` - ClientOnly wrapper
5. `app/components/TableBase.vue` - ClientOnly wrapper
6. `app/components/Memorias.vue` - ClientOnly wrapper
7. `app/components/TemplateMenu.vue` - ClientOnly wrapper
8. `app/layouts/default.vue` - ClientOnly wrappers
9. `app/plugins/vue-error-handler.ts` - Debugging plugin
10. `.planning/debug/udropdown-ssr-warning.md` - Investigation notes

## Commit

**Hash:** `5c93c86`
**Message:** `fix(ssr): disable SSR to resolve Nuxt UI v4 hydration errors`

## Next Steps

- Continue with phases 10-11 development
- Monitor Nuxt UI releases for SSR fixes
- Re-enable SSR when upstream issue is resolved

## Resources

- Nuxt UI: https://ui.nuxt.com
- Issue Tracker: https://github.com/nuxt/ui/issues
