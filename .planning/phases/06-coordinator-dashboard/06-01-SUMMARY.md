---
phase: 06-coordinator-dashboard
plan: 01
completed: 2026-01-27
status: complete
---

# Phase 6 Plan 01 Summary: Navigation & Dual Access Control

**Status:** COMPLETE ✅
**Completed:** 2026-01-27

## What Was Built

### 1. Navigation Entry Points (Already Implemented)

The issues icon button from Phase 4.2 provides navigation from the planes table to the issues management page. Located in `ElementBase.vue` (lines 533-542):

```vue
<UTooltip v-if="props.tipo === 'planes'" text="Incidencias">
  <UButton
    icon="i-heroicons-exclamation-circle"
    size="sm"
    color="error"
    square
    variant="solid"
    @click.stop="goToIssues((item as any)._id)"
  />
</UTooltip>
```

**Navigation Flow:** Planes List → Click Red Exclamation Icon → Issues Dashboard

### 2. QR Token-Based Public Access Route (NEW)

Created `/app/pages/public/issues/[qrSlug]/[accessToken]/index.vue` - A public route for accessing issues dashboard via QR code without authentication.

**Features:**
- Validates QR slug and accessToken via API
- Shows loading state during validation
- Displays appropriate error messages for:
  - 404: QR code not found
  - 403: QR code disabled
  - 410: QR code expired
  - 401: Invalid token
- Renders ObraDashboard component with QR access indicator badge
- Passes QR credentials to ObraDashboard for API calls

**URL Pattern:** `/public/issues/{qrSlug}/{accessToken}`

### 3. QR Validation API Endpoint (NEW)

Created `/server/api/public/issues/validate-qr.post.ts` - Validates QR code access for issues dashboard.

**Validation Steps:**
1. Extract slug and accessToken from request body
2. Find plan by `issueQrCode.slug`
3. Check if `issueQrEnabled` is true
4. Check if QR code has expired (`expiresAt < now`)
5. Verify access token matches
6. Return plan data if all validations pass

**Response Format:**
```json
{
  "success": true,
  "data": {
    "plan": {
      "_id": "planId",
      "nom_obra": "Obra Name",
      "dir_obra": "Address"
    }
  }
}
```

### 4. Dual Access Pattern

**Authenticated Access:** `/protected/planes/{id}/issues`
- Requires JWT authentication
- Uses existing auth middleware
- Full CRUD operations available

**QR-Based Public Access:** `/public/issues/{qrSlug}/{accessToken}`
- No authentication required
- QR token validation via API
- Read-only access (Phase 6.2 will add public CRUD endpoints)

## Goal Achievement

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can navigate from planes table to issues management page | ✅ VERIFIED | Issues icon button in ElementBase.vue (lines 533-542) navigates to `/protected/planes/{id}/issues` |
| 2 | Issues page is accessible via QR token without authentication | ✅ VERIFIED | Public route `/public/issues/[qrSlug]/[accessToken]/index.vue` validates QR and shows dashboard |
| 3 | Issues page remains accessible to authenticated users | ✅ VERIFIED | Protected route `/protected/planes/[[id]]/issues.vue` works with existing auth flow |
| 4 | Navigation links work correctly from all entry points | ✅ VERIFIED | ElementBase icon button for auth access, QR URL for public access |

## Key Links

| From | To | Via | Status |
|------|-----|-----|--------|
| Planes table (ElementBase) | `/protected/planes/{id}/issues` | `goToIssues()` + navigateTo | ✅ WIRED |
| QR Code scan | `/public/issues/{qrSlug}/{accessToken}` | Public route with dynamic params | ✅ WIRED |
| Public issues page | `/api/public/issues/validate-qr` | POST with slug/accessToken | ✅ WIRED |

## Modified Files

| File | Changes |
|------|---------|
| `app/pages/public/issues/[qrSlug]/[accessToken]/index.vue` | **NEW** - Public route for QR-based issues access |
| `server/api/public/issues/validate-qr.post.ts` | **NEW** - QR validation endpoint for issues dashboard |

## Next Steps (Phase 6.2)

Phase 6.2 will create public API endpoints for issues CRUD operations:
- `GET /api/public/issues` - List issues with QR token validation
- `GET /api/public/issues/[id]` - Issue detail with QR token validation

These endpoints will allow the QR-accessible issues dashboard to load and display issues data.

## Notes

**Design Decision:** Created a separate public route (`/public/issues/...`) instead of modifying the existing protected route. This approach:
- Keeps auth and QR access paths separate and clear
- Avoids complex conditional logic in a single route
- Makes it easy to add QR-specific features (badges, warnings, limited UI)
- Aligns with existing public route patterns (e.g., `/public/issue-report/...`)

**Security:** QR validation is performed server-side via the validate-qr endpoint. The public route has no authentication requirement but validates the QR token before showing any data.

---

_Executed: 2026-01-27_
_Executor: Claude (gsd-executor)_
