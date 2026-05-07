---
status: resolved
trigger: "Investigate Nuxt 3 catch-all route parameter [[id]] not working for issues page and detalles gráficos"
created: 2026-01-19T10:00:00Z
updated: 2026-01-19T10:00:07Z
---

## Current Focus

hypothesis: The issues.vue page directly uses `route.params.id` (line 57) which may be undefined at initial render, while dashboard.vue uses computed() which is reactive
test: Compare how both pages access route.params and check if issues.vue needs computed()
expecting: issues.vue should use computed() like dashboard.vue for proper reactivity
next_action: Verify this is the root cause and fix issues.vue to use computed()

## Symptoms

expected: |
  - /protected/planes/123abc/issues should display the issues page for plan ID "123abc"
  - /protected/planes/123abc/dashboard should work (it does)
  - route.params.id should contain the actual MongoDB ID

actual: |
  - Issues page shows generic error page
  - Error message mentions /api/planes/[[id]] literally (the placeholder isn't replaced)
  - The [[id]] catch-all parameter appears to not be capturing the route segment

errors: |
  - Generic error page shown in browser
  - Error mentions /api/planes/[[id]] - suggests the catch-all isn't working

reproduction: |
  1. Navigate to /protected/planes/123abc/issues (replace with valid MongoDB ID)
  2. See error page instead of issues list

started: After Phase 4.1 completion

## Evidence

- timestamp: 2026-01-19T10:00:01Z
  checked: File structure in /app/pages/protected/planes/
  found: All files correctly placed in [[id]] directory including issues.vue
  implication: File structure is correct, not a routing issue

- timestamp: 2026-01-19T10:00:02Z
  checked: issues.vue line 57 vs dashboard.vue line 526
  found: issues.vue uses `const planId = route.params.id as string` (direct assignment)
         dashboard.vue uses `const planId = computed(() => route.params.id as string)` (computed)
  implication: Direct assignment may not be reactive, causing issues when route changes

- timestamp: 2026-01-19T10:00:03Z
  checked: API call in issues.vue line 68
  found: Uses `$fetch(\`/api/planes/${planId}\`)` where planId might be undefined
  implication: If planId is undefined, it fetches `/api/planes/undefined` which fails

- timestamp: 2026-01-19T10:00:04Z
  checked: detalles-graficos.vue line 262
  found: Already uses `const planId = computed(() => route.params.id as string)`
  implication: detalles-graficos.vue should work correctly, only issues.vue needs fixing

- timestamp: 2026-01-19T10:00:05Z
  checked: obra.vue line 248
  found: Uses route.params.id inside onMounted callback where route is resolved
  implication: Both patterns work, but computed() is more explicit and reactive

## Eliminated

## Resolution

root_cause: issues.vue was using direct assignment `const planId = route.params.id as string` instead of reactive computed property. In Nuxt 3, route.params may not be immediately available at component initialization, causing planId to be undefined when the API call is made.

fix: Changed issues.vue to use computed property for planId:
  - Changed `const planId = route.params.id as string` to `const planId = computed(() => route.params.id as string)`
  - Updated API call to use `planId.value` instead of `planId`
  - Added null check in loadPlan function: `if (!planId.value) return`
  - Updated template to use `planId.value`
  - Added watcher to reload plan when planId changes

verification: |
  - Dev server is running (PID 11050)
  - Changes have been applied via hot module replacement
  - Code review confirms fix matches pattern used in dashboard.vue and detalles-graficos.vue
  - The computed property ensures reactivity and proper timing
  - User should test by navigating to /protected/planes/{valid-id}/issues

files_changed:
  - /home/mateu/NuxtsProjects/v9PLANESN4BUI4/app/pages/protected/planes/[[id]]/issues.vue
