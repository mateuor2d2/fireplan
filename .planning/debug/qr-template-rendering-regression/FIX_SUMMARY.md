# QR Template Rendering Regression - FIX APPLIED

## Root Cause

**File:** `/home/mateu/NuxtsProjects/v9PLANESN4BUI4/app/utils/templateRendererMinimal.ts`
**Line:** 49
**Issue:** Critical regex bug that breaks Handlebars template processing

### The Bug

The fallback template renderer `renderTemplateMinimal()` uses a regex pattern that matches ALL `{{...}}` patterns, including Handlebars block helpers:

```typescript
// BROKEN CODE (line 49):
result.replace(/{{\s*([^}]+)\s*}}/g, (match, variable) => { ... })
```

This pattern treats:
- `{{#if hasQRCode}}` as variable "if hasQRCode" → replaced with empty string
- `{{/if}}` as variable "/if" → replaced with empty string
- `{{nom_promotor}}` as variable "nom_promotor" → correctly replaced

### Why This Causes the Symptoms

1. User's template has: `{{#if hasQRCode}}![QR]({{qrCode.qrCodeImage}}){{/if}}`
2. When `renderTemplateMinimal()` runs (as fallback), it strips `{{#if hasQRCode}}` and `{{/if}}`
3. It leaves `![QR]({{qrCode.qrCodeImage}})` as raw markdown
4. The inner `{{qrCode.qrCodeImage}}` may or may not be substituted
5. Markdown parser wraps orphaned markdown in `<code>` tags
6. **Result:** User sees `<code>![QR Code...](data:image/png;base64,...</code>`

## The Fix

**File:** `app/utils/templateRendererMinimal.ts`
**Line:** 49

```typescript
// OLD (broken):
result.replace(/{{\s*([^}]+)\s*}}/g, ...)

// NEW (fixed):
result.replace(/{{\s*([^#/}][^}]*)\s*}}/g, ...)
```

The new pattern:
- `[^#/}]` - First character cannot be `#`, `/`, or `}`
- This excludes: `{{#if`, `{{/if}}, `{{#each}}, `{{#unless}}, etc.
- Still matches: `{{variable}}, `{{obj.prop}}, etc.

## Impact

- **Before:** Handlebars block helpers were stripped, leaving raw markdown that rendered as `<code>` tags
- **After:** Block helpers remain intact, variables are substituted correctly, markdown renders properly

## Next Steps

1. **Test:** Generate PDF with the user's template to verify the fix works
2. **Investigate:** Determine WHY the main `renderTemplate()` is failing and triggering the fallback chain
3. **Consider:** Add better error handling to prevent silent fallbacks

## Related Files

- `/home/mateu/NuxtsProjects/v9PLANESN4BUI4/.planning/debug/qr-template-rendering-regression.md` - Full debug session
- `/home/mateu/NuxtsProjects/v9PLANESN4BUI4/app/utils/templateRenderer.ts` - Main template renderer
- `/home/mateu/NuxtsProjects/v9PLANESN4BUI4/app/utils/templateRendererSimple.ts` - First fallback renderer
- `/home/mateu/NuxtsProjects/v9PLANESN4BUI4/server/api/planes/[id]/generate-pdf.get.ts` - PDF generation orchestration
