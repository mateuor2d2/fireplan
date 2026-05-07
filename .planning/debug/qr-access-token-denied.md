---
status: investigating
trigger: "Debug 'token de acceso denegado' error when accessing public issue reporting form via QR code"
created: 2026-01-23T07:30:00Z
updated: 2026-01-23T07:40:00Z
---

## Current Focus
hypothesis: The issue has been resolved or the user experienced a transient error
test: API endpoint returns success, but need user to verify in browser
expecting: User should be able to access the page successfully now
next_action: Ask user to test the URL and confirm if issue persists

## Symptoms
expected: Public issue reporting form loads with obra information when visiting QR URL
actual: User reported "Acceso denegado" / "token de acceso denegado"
errors: "token de acceso denegado"
reproduction: Visit http://localhost:3001/public/issues/1c742c46/8c18d08b-0609-49b2-955e-77b75b1bcd38
started: Unknown when this started

## Eliminated
- hypothesis: Backend validation is failing
  evidence: curl test to /api/public/issue-report/validate-by-slug returns SUCCESS with valid plan data
  timestamp: 2026-01-23T07:40:00Z

- hypothesis: Plan doesn't exist in database
  evidence: API returns plan data, so plan exists in the connected database (MongoDB Atlas)
  timestamp: 2026-01-23T07:40:00Z

## Evidence
- timestamp: 2026-01-23T07:33:00Z
  checked: API endpoint /api/public/issue-report/validate-by-slug with curl
  found: API returns SUCCESS with valid plan data (plan ID: 689af26c24d3d5afad000be2)
  implication: Backend validation is working correctly

- timestamp: 2026-01-23T07:38:00Z
  checked: Page HTML rendering with curl
  found: Page shows loading state "Verificando acceso..." (expected for SSR)
  implication: Page renders correctly on server-side

- timestamp: 2026-01-23T07:39:00Z
  checked: MongoDB local database for plan with slug 1c742c46
  found: No plan found in local MongoDB
  implication: API connects to MongoDB Atlas (cloud), not local MongoDB

- timestamp: 2026-01-23T07:40:00Z
  checked: .env file
  found: ME_CONFIG_MONGODB_URL points to MongoDB Atlas cloud instance
  implication: Database connection is correct, using cloud MongoDB

## Resolution
root_cause: []
fix: []
verification: []
files_changed: []
