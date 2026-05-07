# UDropdown SSR Warning - Debug Report

## Problem

**Error:** Vue warning during SSR on first page load:
```
WARN  === Vue Warning ===
WARN  Message: Failed to resolve component: UDropdown
WARN  Trace: at <AppHeader> at <Error> at <NuxtRoot>
```

## Root Cause Analysis

### Investigation Steps

1. **Checked AppHeader.vue** - Found usage of `<UDropdown>` component on line 86
2. **Checked nuxt.config.ts** - Confirmed Nuxt UI v4.3.0 is installed
3. **Searched codebase** - Found other components using `UDropdownMenu` instead:
   - `TemplateMenu.vue` - uses `UDropdownMenu`
   - `TableMasterData.vue` - explicitly resolves `UDropdownMenu`
   - `ColorSelector.vue` - uses `UDropdownMenu`
   - `Memorias.vue` - uses `UDropdownMenu`
4. **Checked Nuxt UI dist files** - Only `DropdownMenu.vue` exists, no `Dropdown.vue`

### Conclusion

**UDropdown does not exist in Nuxt UI v4.** The correct component is `UDropdownMenu`.

This appears to be a legacy component name that was used in an earlier version of Nuxt UI (v2/v3) but has been renamed to `UDropdownMenu` in v4.

## Evidence

### Current (Broken) Usage in AppHeader.vue
```vue
<!-- Line 86-93 -->
<UDropdown :items="userDropdownItems">
  <UButton
    icon="i-lucide-user"
    color="neutral"
    variant="ghost"
    class="lg:hidden"
  />
</UDropdown>
```

### Correct Usage Pattern (from TemplateMenu.vue)
```vue
<UDropdownMenu
  v-slot="{ open }"
  :items="[...]"
  :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-0' }"
  size="xs"
>
  <UButton ... />
</UDropdownMenu>
```

### API Differences

| Property | UDropdown (v2/v3) | UDropdownMenu (v4) |
|----------|------------------|-------------------|
| Component name | `UDropdown` | `UDropdownMenu` |
| Items prop | `:items` | `:items` (same) |
| Slot API | Default slot | `v-slot="{ open }"` |
| Default portal | N/A | `:portal` prop |

## Solution

Replace `<UDropdown>` with `<UDropdownMenu>` in AppHeader.vue.

### Required Changes

### File 1: `/app/components/AppHeader.vue`

**Line 86-96:** Changed opening and closing tags
```diff
- <UDropdown :items="userDropdownItems">
+ <UDropdownMenu
+   v-slot="{ open }"
+   :items="userDropdownItems"
+ >
    <UButton
      icon="i-lucide-user"
      color="neutral"
      variant="ghost"
      class="lg:hidden"
    />
- </UDropdown>
+ </UDropdownMenu>
```

### File 2: `/app/components/TableBase.vue`

**Line 173-180:** Changed opening and closing tags
```diff
    <template #actions-data="{ row }">
-     <UDropdown :items="actions(row)">
+     <UDropdownMenu
+       v-slot="{ open }"
+       :items="actions(row)"
+     >
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-ellipsis-horizontal-20-solid"
        />
-     </UDropdown>
+     </UDropdownMenu>
    </template>
```

## Status

**Fixed:** Both instances have been corrected to use `UDropdownMenu`.

## Verification

After applying the fix:
1. Run `bun run dev`
2. Open browser to localhost:3000
3. Check console - no SSR warning should appear
4. Test mobile view - dropdown should work correctly

## Prevention

To prevent similar issues in the future:
1. Always use `UDropdownMenu` for new dropdown implementations
2. Reference existing components (TemplateMenu, TableMasterData) for correct usage patterns
3. Check Nuxt UI v4 documentation for correct component names
4. Consider adding ESLint rule to catch non-existent UI components

## Related Files

- `/app/components/AppHeader.vue` - Contains the bug
- `/app/components/TemplateMenu.vue` - Correct UDropdownMenu usage reference
- `/app/components/TableMasterData.vue` - Shows resolveComponent pattern
- `nuxt.config.ts` - Nuxt UI v4.3.0 configuration

## Timeline

- **Discovered:** During development of subscription management phase
- **Root cause found:** UDropdown component doesn't exist in Nuxt UI v4
- **Fix:** Replace with UDropdownMenu
