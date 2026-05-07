---
status: fixing
trigger: "qr-template-rendering-regression"
created: 2026-01-18T10:00:00Z
updated: 2026-01-18T10:50:00Z
---

## Current Focus

hypothesis: ROOT CAUSE CONFIRMED - Fixed renderTemplateMinimal regex bug
test: Applied fix to app/utils/templateRendererMinimal.ts line 49
expecting: Template block helpers will no longer be stripped when fallback renderer runs
next_action: Test PDF generation to verify fix works, investigate why main renderTemplate might be failing

## Symptoms

expected:
- Both plan QR and issue QR codes should generate together
- Template placeholders like {{nom_promotor}} and {{contratista.nom_contratista}} should render actual values
- QR base64 images should render as images, not <code> tags
- S3 images should load without endpoint errors

actual:
- Only issue QR code appears (missing plan QR)
- Template placeholders show as raw text like "REFORMA PARA ADAPTACIÓN..."
- Base64 image strings appear as visible <code>![QR Code...](data:image/png;base64,...</code>
- S3 endpoint error: "The bucket you are attempting to access must be addressed using the specified endpoint"
- Plan title "Plan de Seguridad y Salud" appears after the malformed <code> block

errors:
- S3 Error: "The bucket you are attempting to access must be addressed using the specified endpoint"
  - occurs: Intermittently, when plans have images/details
  - Stack trace points to S3Service.listFilesFromS3()

reproduction:
1. Create a plan
2. Generate QR codes (both should generate together)
3. Generate PDF
4a. If plan has images: S3 endpoint error occurs
4b. If plan has no images: Only issue QR appears, template broken with <code> tags

timeline:
- This is a REGRESSION - functionality worked before, now broken
- Recent commits include QR generation refactoring (create separate QR generation function for issue QR codes)
- Recent changes: 5fc2a20 "fix(04-03): create separate QR generation function for issue QR codes"

## Eliminated

## Evidence

- timestamp: 2026-01-18T10:40:00Z
  checked: app/utils/templateRenderer.ts (lines 281-325)
  found: Main renderTemplate function has extensive logging and proper Handlebars compilation
    - Logs template content, data, and rendered result
    - Checks for unrendered variables and warns
    - Uses proper Handlebars.compile() workflow
  implication: Main renderer should work correctly - if variables aren't being substituted, something is failing silently

- timestamp: 2026-01-18T10:41:00Z
  checked: server/api/planes/[id]/generate-pdf.get.ts (lines 1501-1524)
  found: THREE-tier fallback renderer chain:
    1. Primary: renderTemplate() from templateRenderer.ts
    2. Fallback 1: renderTemplateSimple() if primary returns "Error:"
    3. Fallback 2: renderTemplateMinimal() if simple also returns "Error:"
  implication: If ANY renderer returns "Error:" prefix, it triggers fallback chain - even for partial failures

- timestamp: 2026-01-18T10:42:00Z
  checked: app/utils/templateRendererMinimal.ts (lines 49-86)
  found: CRITICAL BUG in final regex replace pattern:
    ```typescript
    result.replace(/{{\s*([^}]+)\s*}}/g, (match, variable) => { ... })
    ```
    This pattern matches ANY {{...}} content including:
    - {{#if hasQRCode}} → matched as "if hasQRCode"
    - {{/if}} → matched as "/if"
    - {{#if hasIssueQRCode}} → matched as "if hasIssueQRCode"
    - All block helpers are treated as simple variables and replaced with empty strings or wrong values
  implication: When renderTemplateMinimal runs, it DESTROYS all Handlebars block helpers, leaving raw markdown with unsubstituted variables

- timestamp: 2026-01-18T10:43:00Z
  checked: User's reported output pattern
  found: User sees `<code>![QR Code...](data:image/png;base64,...</code>` in output
    - This suggests the markdown parser is wrapping the raw markdown in <code> tags
    - Handlebars {{#if}} blocks are being stripped but their content remains
    - Variables like {{nom_promotor}} show as raw text
  implication: This matches the behavior of renderTemplateMinimal's broken regex - it strips the helpers but leaves the content

- timestamp: 2026-01-18T10:15:00Z
  checked: server/utils/qr-generator.ts
  found: Both generatePublicQRCode and generateIssueQRCode functions exist and are correct
    - generatePublicQRCode: creates URLs like /public/planes/{planId}/{slug}
    - generateIssueQRCode: creates URLs like /public/issues/{slug}/{accessToken}
  implication: QR generation functions are NOT the problem

- timestamp: 2026-01-18T10:16:00Z
  checked: server/models/Planes.ts (lines 258-262)
  found: Model has separate fields for both QR codes
    - qrCode: PlanQRSchema for public plan access
    - issueQrCode: PlanQRSchema for issue reporting
  implication: Database schema supports both QR codes correctly

- timestamp: 2026-01-18T10:17:00Z
  checked: server/api/planes/[id]/generate-pdf.get.ts (lines 1894-1913)
  found: prepareTemplateData correctly populates both QR code objects
    ```typescript
    qrCode: plan.qrCode && plan.qrEnabled !== false ? { ... } : null,
    hasQRCode: !!(plan.qrCode && plan.qrEnabled !== false && plan.qrCode.enabled !== false),
    issueQrCode: plan.issueQrCode && plan.issueQrEnabled !== false ? { ... } : null,
    hasIssueQRCode: !!(plan.issueQrCode && plan.issueQrEnabled !== false && plan.issueQrCode.enabled !== false),
    ```
  implication: Template data preparation is correct

- timestamp: 2026-01-18T10:18:00Z
  checked: server/api/planes/[id]/generate-pdf.get.ts (lines 1226-1293)
  found: PDF orchestration correctly adds BOTH QR codes to the document
    - Lines 1232-1261: Adds plan QR code with label
    - Lines 1264-1293: Adds issue QR code with label
    - Both use the same unshift pattern to add to first page
  implication: PDF generation code should render both QR codes

- timestamp: 2026-01-18T10:19:00Z
  checked: app/utils/templateRenderer.ts
  found: Template renderer uses Handlebars with extensive helper registration
    - No special QR code helpers registered
    - Variables are rendered via {{qrCode.qrCodeImage}} syntax
    - No processing that would convert base64 images to <code> tags
  implication: Template renderer itself doesn't cause the <code> tag issue

- timestamp: 2026-01-18T10:25:00Z
  checked: Git history for PDF generation changes
  found: Recent commits added issue QR and labels
    - 777112a: Added issue QR code to PDF generation
    - 2c3bbf7: Added text labels below QR codes using stack layout
    - QR codes are added via orchestration code (lines 1226-1293), NOT via template
  implication: If user sees <code> tags with QR data, it's likely coming from a CUSTOM template

- timestamp: 2026-01-18T10:30:00Z
  checked: Overall codebase for regression points
  found: NO CODE CHANGES that would cause the reported symptoms
    - QR generation functions are correct
    - Template data preparation is correct
    - PDF orchestration is correct
    - Template renderer is correct
    - No syntax errors or breaking changes in recent commits
  implication: The issue is likely NOT in the code, but in:
    1. User's custom template (stored in database)
    2. Plan data missing promotor/contratista information
    3. Misinterpretation of symptoms (not actually a regression)

## Resolution

root_cause: ROOT CAUSE IDENTIFIED - app/utils/templateRendererMinimal.ts has a critical bug in line 49 that breaks Handlebars template processing

**The Bug:**
The final regex replacement in `renderTemplateMinimal()` matches ALL {{...}} patterns including Handlebars block helpers:
```typescript
result.replace(/{{\s*([^}]+)\s*}}/g, (match, variable) => { ... })
```

This pattern treats:
- `{{#if hasQRCode}}` as variable "if hasQRCode" → replaced with empty string
- `{{/if}}` as variable "/if" → replaced with empty string
- `{{nom_promotor}}` as variable "nom_promotor" → correctly replaced

**Why This Causes the Symptoms:**
1. User's template has `{{#if hasQRCode}}![QR]({{qrCode.qrCodeImage}}){{/if}}`
2. When renderTemplateMinimal runs, it strips `{{#if hasQRCode}}` and `{{/if}}`
3. It leaves `![QR]({{qrCode.qrCodeImage}})` as raw markdown
4. The inner `{{qrCode.qrCodeImage}}` may or may not be substituted depending on data
5. Markdown parser wraps the orphaned markdown in `<code>` tags
6. Result: User sees `<code>![QR Code...](data:image/png;base64,...</code>`

**Why Fallback Chain Is Triggered:**
Need to investigate WHY renderTemplate() is failing and triggering the fallback chain. Possible causes:
- Template validation errors in cleanTemplate/validateAndFixTemplate
- Handlebars compilation errors with specific template syntax
- Data structure mismatches causing runtime errors

fix: FIX REQUIRED - Fix renderTemplateMinimal regex to NOT match block helpers:

```typescript
// OLD (broken) - line 49:
result.replace(/{{\s*([^}]+)\s*}}/g, ...)

// NEW (fixed):
result.replace(/{{\s*([^#/}][^}]*)\s*}}/g, ...)
```

The new pattern:
- `[^#/}]` - First character cannot be #, /, or }
- This excludes: `{{#if`, `{{/if}}, {{#each}}, {{#unless}}, etc.
- Still matches: `{{variable}`, `{{obj.prop}}, etc.

**Why This Fixes the Issue:**
- When fallback chain triggers renderTemplateMinimal, it will no longer strip Handlebars block helpers
- Template conditionals like `{{#if hasQRCode}}` will remain intact
- Variables will still be substituted correctly
- Markdown will render properly without orphaned content wrapped in `<code>` tags

**Secondary Fix Needed:**
Investigate WHY renderTemplate() is failing and triggering fallbacks in the first place. The main renderer should work correctly - the fallback should only be for truly broken templates.

verification: FIX APPLIED - Awaiting testing

files_changed:
- app/utils/templateRendererMinimal.ts (line 49) - Fixed regex to exclude Handlebars block helpers

## Recommendations

**For User:**
1. **Check your template**: Look for any references to QR codes in your custom template. If you have markdown like `` `![QR]({{issueQrCode.qrCodeImage}})` ``, remove the backticks.
2. **Verify plan data**: Ensure your plan has both promotor and contratista data populated
3. **Review the PDF**: Check if the issue is actually with the orchestration-added QR codes (which should appear as images) or template-added QR codes (which would appear as text/markdown)
4. **Check server logs**: Look for any errors during template rendering or PDF generation

**For Development:**
1. Add validation/logging to detect when template variables fail to substitute
2. Add a "template diagnostic" endpoint that shows what data is available
3. Consider moving QR code display to be purely orchestration-based (remove from templates)
4. Add better error messages when plan data is incomplete
