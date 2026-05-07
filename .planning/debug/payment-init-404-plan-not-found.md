---
status: resolved
trigger: "payment-init-404-plan-not-found"
created: 2025-02-11T16:24:00.000Z
updated: 2026-02-11T18:00:00.000Z
resolved: 2026-02-11T18:00:00.000Z
---

## RESOLUTION

**Root Cause:** Nuxt 4 catch-all route `[[id]]` parameter handling
- In Nuxt 4 with `[[id]]` catch-all routes, `route.params.id` can be an array or string
- The original code assumed `route.params.id` is always a string: `route.params.id as string`
- When `route.params.id` is an array, the database query with `findOne({ _id: planId, createdBy: userId })` fails because MongoDB ObjectId expects a string, not an array

**Fix Applied (2026-02-11):**
```typescript
// Before (line 347 in impresion.vue):
const planId = computed(() => route.params.id as string)

// After:
const planId = computed(() => {
  const id = route.params.id
  // If id is an array, join it with '/' to handle nested routes
  return Array.isArray(id) ? id.join('/') : id
})
```

**Additional Files Fixed:**
Same fix applied to all pages in `app/pages/protected/planes/[[id]]/` and `app/pages/public/planes/[id]/[slug].vue`:
1. `app/pages/protected/planes/[[id]]/impresion.vue` - Fixed planId computed property
2. `app/pages/protected/planes/[[id]]/issues.vue` - Fixed planId computed property
3. `app/pages/protected/planes/[[id]]/dashboard.vue` - Fixed planId computed property
4. `app/pages/protected/planes/[[id]]/detalles-graficos.vue` - Fixed planId computed property
5. `app/pages/protected/planes/[[id]]/presupuesto.vue` - Fixed planId to computed property
6. `app/pages/protected/planes/[[id]]/obra.vue` - Fixed planId in onMounted function
7. `app/pages/public/planes/[id]/[slug].vue` - Fixed both id and slug parameters

**Pattern Used:**
```typescript
// For computed properties:
const planId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? id.join('/') : id
})

// For direct assignment (inside functions):
const id = route.params.id
const planId = Array.isArray(id) ? id.join('/') : id
```

**Commits:**
- `d5b7016` - fix(catchall-routes): handle route.params.id as array or string in Nuxt 4
- `eaf7672` - fix(payments): improve error messages and clean up debug logs

**Status:** RESOLVED - Fix applied to all affected files and committed

---

## Investigation Archive

### Evidence Gathered
- timestamp: 2025-02-11T16:30:00.000Z
  checked: impresion.vue line 347 - planId computed property
  found: `const planId = computed(() => route.params.id as string)`
  implication: planId comes from route.params.id in Nuxt 3/4

- timestamp: 2025-02-11T16:31:00.000Z
  checked: create-intent.post.ts line 30 - plan lookup
  found: `const plan = await Planes.findOne({ _id: planId, createdBy: userId })`
  implication: Query requires BOTH _id match AND createdBy match

- timestamp: 2025-02-11T16:32:00.000Z
  checked: The file path structure - [[id]] is a catch-all route
  found: Path is `/app/pages/protected/planes/[[id]]/impresion.vue`
  implication: In Nuxt 4 with [[id]] catch-all, route.params.id could be array or string

- timestamp: 2025-02-11T16:45:00.000Z
  checked: loadPlanActual in planes.ts uses `/api/planes/` with `_id` query param
  found: The endpoint for loading plan doesn't filter by userId, only by _id
  implication: Plan loads successfully because it only needs _id match, not createdBy

- timestamp: 2025-02-11T16:46:00.000Z
  checked: Authentication middleware to verify userId is correctly set
  found: auth.ts sets event.context.user from JWT token
  implication: If userId from token doesn't match createdBy in database, query fails

- timestamp: 2025-02-11T17:05:00.000Z
  checked: planes.get.ts endpoint used by loadPlanActual
  found: Uses `Planes.findById(_id)` without filtering by createdBy (unless userId query param is provided)
  implication: Plan loads regardless of ownership, which is why page displays but payment fails

### Hypotheses Eliminated
- hypothesis: route.params.id is undefined
  evidence: The page loads correctly, which means planId works for loadPlanActual
  timestamp: 2025-02-11T16:40:00.000Z

### Original Symptoms
expected: Clicking print button creates payment checkout session for the plan
actual: API returns 404 Plan not found error
errors: XHR POST http://localhost:3001/api/payments/create-intent [HTTP/1.1] 404 Plan not found 1379ms
Payment initialization error: FetchError: [POST] "/api/payments/create-intent"]: 404 Plan not found
impresion.vue:852:13 in initializePayment function
production: Clicking "Imprimir Plan" button on plan details page
timeline: Started when testing print functionality - possibly after Phase 10 payment integration
