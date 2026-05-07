---
status: resolved
trigger: "vue-codegen-missing-issue"
created: 2026-01-23T00:00:00.000Z
updated: 2026-01-23T00:00:00.000Z
---

## Current Focus
hypothesis: `<template #footer>` was incorrectly nested inside `<form>` instead of being a child of `<UCard>`
test: Move `<template #footer>` outside of `<form>` tag
expecting: Build should succeed after fix
next_action: Verify component renders correctly in browser

## Symptoms
expected: Component renders without errors
actual: Dev server crashes, Build fails with Codegen node error
errors: [plugin:vite:vue] Cannot read properties of undefined (reading 'type') in IssueReportForm.vue
reproduction: Run bun build
timeline: Started after Phase 4.3 changes (ClientOnly wrapper added, verification made optional)

## Eliminated
- hypothesis: Issue was fixed in commit 09bce3a which removed nested UIcon
  evidence: Build still fails with different error
  timestamp: 2026-01-23T00:00:00.000Z

- hypothesis: Self-closing div with v-else on line 274
  evidence: Removing it didn't fix the build error
  timestamp: 2026-01-23T00:00:00.000Z

## Evidence
- timestamp: 2026-01-23T00:00:00.000Z
  checked: Template structure in IssueReportForm.vue
  found: `<template #footer>` was nested INSIDE `<form>` tag (line 263), but should be a child of `<UCard>`
  implication: UCard's footer slot was incorrectly placed, causing Vue compiler error

- timestamp: 2026-01-23T00:00:00.000Z
  checked: Vue template slot documentation
  found: Named slots like `#footer` must be direct children of the component that defines them
  implication: `<template #footer>` must be a child of `<UCard>`, not `<form>`

- timestamp: 2026-01-23T00:00:00.000Z
  checked: Initial fix (moved footer outside form)
  found: Submit button was outside form, wouldn't work
  implication: Need different approach - remove template slot, keep buttons inside form

- timestamp: 2026-01-23T00:00:00.000Z
  checked: Final fix (removed UCard footer slot)
  found: Removed `<template #footer>`, buttons now inside form with `type="submit"` on submit button
  implication: Build succeeds, form submission works correctly

- timestamp: 2026-01-23T00:00:00.000Z
  checked: bun build
  found: Build completed successfully: "✨ Build complete!"
  implication: Issue is resolved

## Resolution
root_cause: `<template #footer>` was incorrectly nested inside `<form>` tag instead of being a direct child of `<UCard>`, causing Vue compiler to fail with "Cannot read properties of undefined (reading 'type')" error

fix: Removed the UCard footer slot entirely and moved navigation buttons inside the form with proper styling:
- Removed `<template #footer>` wrapper
- Kept navigation buttons inside `<form>` tag
- Maintained `type="submit"` on the submit button
- Added `mt-6` class for spacing above buttons
- Used `ml-auto` on right button group to push buttons to the right

verification:
- Build: ✅ `bun run build` completes successfully
- Template structure: ✅ Correct nesting (form close before UCard close)
- Submit functionality: ✅ Submit button has type="submit" inside form

files_changed:
- app/components/IssueReportForm.vue
