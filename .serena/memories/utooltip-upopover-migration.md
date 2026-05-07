# UTooltip to UPopover Migration - Nuxt UI v4 Fix

**Date:** 2026-02-09
**Issue:** UTooltip component requires TooltipProvider in Nuxt UI v4
**Solution:** Replaced all UTooltip with UPopover

## Files Modified

| File | Lines | Description |
|------|-------|-------------|
| `app/pages/protected/planes/[[id]]/impresion.vue` | 1 | Payment processing info tooltip |
| `app/pages/protected/planes/[[id]]/presupuesto.vue` | 1 | Similar items tooltip in loop |
| `app/components/Memorias.vue` | 1 | Global template badge |
| `app/components/ElementBase.vue` | 4 | Edit/Dashboard/Issues/Delete button tooltips |

## Pattern Applied

**Before (UTooltip):**
```vue
<UTooltip text="Tooltip text">
  <element />
</UTooltip>
```

**After (UPopover):**
```vue
<UPopover mode="hover">
  <element />
  <template #panel>
    <div class="p-1 text-xs">Tooltip text</div>
  </template>
</UPopover>
```

## Notes

- UPopover is the recommended replacement in Nuxt UI v4 for simple tooltips
- The `mode="hover"` provides the same hover behavior as UTooltip
- Panel template provides consistent styling with other Nuxt UI components
- No functionality changes - only API migration
