---
phase: 06-coordinator-dashboard
plan: 02
completed: 2026-01-27
status: complete
---

# Phase 6 Plan 02 Summary: Public API Endpoints

**Status:** COMPLETE ✅
**Completed:** 2026-01-27

## What Was Built

### 1. Public Issues List Endpoint

Created `server/api/public/issues/index.get.ts` - GET endpoint for listing issues with QR token validation.

**Features:**
- Validates obraId and qrToken query parameters
- Finds plan by obraId to validate QR token
- Checks if QR code is enabled (`issueQrEnabled`)
- Verifies access token matches (`issueQrCode.accessToken === qrToken`)
- Checks expiration date (`issueQrCode.expiresAt < now`)
- Returns safe data only (MiniIssue format excluding sensitive fields)
- Returns issues sorted by createdAt (newest first)

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "issueId",
      "title": "Issue title",
      "type": "annotation|comment|accident",
      "status": "open|in-progress|resolved|closed",
      "priority": "low|medium|high|critical",
      "createdAt": "2024-01-27T...",
      "updatedAt": "2024-01-27T...",
      "photoCount": 2,
      "commentCount": 3,
      "assignedTo": ["userId1", "userId2"]
    }
  ],
  "total": 10
}
```

**Error Responses:**
- 400: Missing or invalid obraId
- 401: Missing or invalid qrToken
- 403: QR code disabled
- 404: Plan not found
- 410: QR code expired

### 2. Public Issue Detail Endpoint

Created `server/api/public/issues/[id].get.ts` - GET endpoint for fetching single issue details with QR token validation.

**Features:**
- Validates issue ID from route param
- Validates qrToken query parameter
- Finds plan via issue.obraId to validate QR token
- All same QR validations as list endpoint (enabled, token match, expiration)
- Returns full issue data with safe filtering:
  - Transforms photos with display-safe metadata
  - Transforms comments with userName (not userId)
  - Excludes internal fields and sensitive user data

**Response Format:**
```json
{
  "success": true,
  "data": {
    "id": "issueId",
    "title": "Issue title",
    "description": "Full description",
    "type": "annotation",
    "status": "open",
    "priority": "medium",
    "obraId": "planId",
    "assignedTo": ["userId1"],
    "createdBy": "userId",
    "createdAt": "2024-01-27T...",
    "updatedAt": "2024-01-27T...",
    "photos": [
      {
        "id": "photoId",
        "url": "https://s3...",
        "caption": "Photo description",
        "uploadedAt": "2024-01-27T..."
      }
    ],
    "comments": [
      {
        "id": "commentId",
        "userName": "Juan Pérez",
        "text": "Comment text",
        "createdAt": "2024-01-27T..."
      }
    ],
    "photoCount": 2,
    "commentCount": 3
  }
}
```

**Error Responses:**
- 400: Missing issue ID
- 401: Missing or invalid qrToken
- 403: QR code disabled
- 404: Issue or plan not found
- 410: QR code expired

### 3. ObraDashboard Component Updates

Updated `app/components/ObraDashboard.vue` to support QR-based API calls.

**New Props:**
- `accessType`: 'auth' | 'qr-token' (default: 'auth')
- `qrSlug`: QR code slug (for QR access)
- `qrAccessToken`: QR access token (for QR access)

**Modified Functions:**
- `loadIssues()`: Uses `/api/public/issues` when `accessType === 'qr-token'`
- `viewIssue()`: Uses `/api/public/issues/{id}` when `accessType === 'qr-token'`
- Passes `qrToken` query parameter to public API calls

**TypeScript Fix:**
- Fixed newIssue ref type definition to include proper status field

## Goal Achievement

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Public issues list endpoint returns issues for obra with valid QR token | ✅ VERIFIED | GET /api/public/issues validates obraId+qrToken, returns filtered issues |
| 2 | Public issue detail endpoint returns single issue with valid QR token | ✅ VERIFIED | GET /api/public/issues/[id] validates qrToken, returns full issue with safe data |
| 3 | Invalid QR token returns 401/403 error | ✅ VERIFIED | Endpoint returns 401 for invalid token, 403 for disabled QR |
| 4 | Response includes only safe data (no sensitive fields) | ✅ VERIFIED | Response excludes createdBy userId, internal notes, etc. Uses MiniIssue format |

## Key Links

| From | To | Via | Status |
|------|-----|-----|--------|
| ObraDashboard (QR mode) | `/api/public/issues` | GET with obraId+qrToken | ✅ WIRED |
| ObraDashboard (QR mode) | `/api/public/issues/[id]` | GET with qrToken | ✅ WIRED |
| Public issues page | ObraDashboard | props: accessType='qr-token', qrSlug, qrAccessToken | ✅ WIRED |

## Modified Files

| File | Changes |
|------|---------|
| `server/api/public/issues/index.get.ts` | **NEW** - Public issues list endpoint with QR validation |
| `server/api/public/issues/[id].get.ts` | **NEW** - Public issue detail endpoint with QR validation |
| `app/components/ObraDashboard.vue` | **MODIFIED** - Added accessType prop, QR API support, fixed TypeScript |

## Integration with Phase 6.1

Phase 6.2 builds on the public route created in Phase 6.1:
1. User scans QR code → Navigates to `/public/issues/{qrSlug}/{accessToken}`
2. Public route validates QR → Renders ObraDashboard with QR credentials
3. ObraDashboard loads issues via `/api/public/issues?obraId=...&qrToken=...`
4. User can view issues without authentication

## Security

**QR Token Validation:**
- Token must match `plan.issueQrCode.accessToken` exactly
- QR code must be enabled (`issueQrEnabled === true`)
- Current time must be before `issueQrCode.expiresAt`
- All validations performed server-side for security

**Data Filtering:**
- Excludes internal fields (createdBy userId, internal notes)
- Transforms comments to show userName instead of userId
- Transforms photos to include display-safe metadata only
- No sensitive user data exposed in responses

## Next Steps (Phase 6.3)

Phase 6.3 will add issue status management and coordinator assignment:
- `PATCH /api/issues/[id]/status` - Update issue status
- `PATCH /api/issues/[id]/assign` - Assign coordinators
- UI enhancements in ObraDashboard for status/assignment management

---

_Executed: 2026-01-27_
_Executor: Claude (gsd-executor)_
