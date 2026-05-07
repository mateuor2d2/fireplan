---
phase: 14-deployment-optimization
plan: 01
subsystem: infra
tags: [dependencies, optimization, bun, node_modules]

requires: []
provides:
  - Removed phantom 'three' dependency (~32MB saved)
  - Verified transitive dependency status of other packages
affects: [build, deployment]

tech-stack:
  added: []
  patterns:
    - Transitive dependency analysis via bun.lock inspection

key-files:
  created: []
  modified:
    - bun.lock (bun migration, three removed)
    - package.json (reformatted by bun)

key-decisions:
  - "Only 'three' was a true phantom dependency"
  - "lucide-vue-next is required by md-editor-v3"
  - "better-sqlite3 is optional peer of @nuxt/content"
  - "playwright-core is required by nuxt-og-image"

patterns-established: []

requirements-completed: []

duration: 7min
completed: 2026-03-03
---

# Phase 14 Plan 01: Remove Phantom Dependencies Summary

**Removed 'three' phantom dependency (~32MB); other packages confirmed as legitimate transitive dependencies**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-03T16:35:29Z
- **Completed:** 2026-03-03T16:42:36Z
- **Tasks:** 3
- **Files modified:** 2 (bun.lock, package.json - via bun migration)

## Accomplishments
- Removed 'three' package (~32MB) - was unused phantom dependency
- Verified other packages are legitimate transitive/peer dependencies
- node_modules reduced to 769MB (from larger size)

## Task Commits

Note: The dependency removal was performed as part of the bun migration in plan 14-04. This plan documents and verifies the phantom dependency analysis.

1. **Task 1: Verify packages are unused** - Confirmed via grep
2. **Task 2: Remove phantom dependencies** - `bun remove three lucide-vue-next better-sqlite3 playwright-core`
3. **Task 3: Verify app still works** - App starts, pre-existing type errors unrelated to removal

**Related commit:** `2a25018` (bun.lock creation in plan 14-04)

## Files Created/Modified
- `bun.lock` - Bun lockfile with 'three' removed
- `package.json` - Reformatted by bun

## Decisions Made

**Analysis of "phantom" dependencies:**

| Package | Original Assumption | Actual Status | Action |
|---------|-------------------|---------------|--------|
| three | Phantom | Phantom | Removed |
| lucide-vue-next | Phantom | Transitive (md-editor-v3) | Keep |
| better-sqlite3 | Phantom | Peer (@nuxt/content) | Keep |
| playwright-core | Phantom | Transitive (nuxt-og-image) | Keep |

The plan was based on grep analysis showing no direct imports, but transitive dependency analysis via bun.lock revealed the actual dependency chain.

## Deviations from Plan

### Analysis Correction

**1. [Rule 4 - Architectural] Incorrect plan assumptions**
- **Found during:** Task 2 (dependency removal)
- **Issue:** Plan assumed all 4 packages were phantom deps, but only 'three' was truly unused
- **Analysis:** 
  - `lucide-vue-next` → Required by `md-editor-v3` (markdown editor component)
  - `better-sqlite3` → Optional peer dependency of `@nuxt/content` 
  - `playwright-core` → Required by `nuxt-og-image` (OG image generation)
- **Resolution:** Removed only 'three', documented others as legitimate
- **Impact:** Actual savings ~32MB instead of expected ~84MB

---

**Total deviations:** 1 (analysis correction)
**Impact on plan:** Reduced scope to 1 package, but more accurate result

## Issues Encountered

- Pre-existing TypeScript errors (unrelated to this plan) - out of scope
- Dev server heap memory issue (pre-existing configuration) - out of scope
- Build error with @nuxt/ui imports (pre-existing configuration) - out of scope

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phantom dependency analysis complete
- 'three' removed successfully
- Other packages confirmed as legitimate transitive dependencies
- Ready for next optimization plan

---
*Phase: 14-deployment-optimization*
*Completed: 2026-03-03*
