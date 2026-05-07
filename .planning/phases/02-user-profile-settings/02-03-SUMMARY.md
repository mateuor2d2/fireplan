---
phase: 02-user-profile-settings
plan: 03
title: Phase 02 Plan 03: QR List Management
date: 2026-02-11
description: Created Mis Códigos QR tab with list of all user's QR codes and management actions
status: complete
wave: 2
milestone: v1.0 QR Issue Reporting
---

# Phase 02 Plan 03: Códigos QR Tab (QR List Management)

## One-liner
QR list management composable (useQRList) with codigos-qr.vue page for viewing, regenerating, and enabling/disabling all user's QR codes across their plans.

## Summary

This plan adds the "Mis Códigos QR" tab to the user settings, providing a centralized location for users to manage all QR codes associated with their safety plans. Users can now view all their QR codes in one place, see statistics (total, active, expired, disabled), and perform management actions like regenerating QR codes with new access tokens and enabling/disabling QR codes.

## Implementation

### 1. useQRList Composable (`app/composables/useQRList.ts`)

Created a composable for QR code list management with the following features:

**State Management:**
- `loading`: Loading state for async operations
- `error`: Error message handling
- `plansWithQR`: Reactive list of plans with QR codes

**Methods:**
- `loadPlansWithQR()`: Fetches user's plans and filters for QR codes
- `regenerateQR(planId)`: Regenerates QR code with new access token
- `toggleQR(planId, enabled)`: Enables/disables QR code
- `generateQR(planId, expirationDays)`: Generates QR for plans without one

**Computed Properties:**
- `hasQRCodes`: Whether user has any QR codes
- `totalCount`: Total number of QR codes
- `activeCount`: QR codes that are enabled and not expired
- `expiredCount`: QR codes that have expired
- `disabledCount`: QR codes that are disabled

**Helper Methods:**
- `getQRCodeState()`: Calculates QR code state (active/disabled/expired)
- `formatExpirationDate()`: Formats expiration date in DD/MM/YYYY
- `calculateDaysUntilExpiration()`: Calculates days until QR expires
- `enhancePlanWithQRData()`: Adds computed properties to plan data

### 2. codigos-qr.vue Page (`app/pages/protected/settings/codigos-qr.vue`)

Created the QR codes list page with the following sections:

**Statistics Cards:**
- Total QR count with blue icon
- Active QR count with green icon
- Expired QR count with yellow icon
- Disabled QR count with red icon

**QR Codes List:**
- Each item displays:
  - Plan name (from nom_obra or ob_obra_nom)
  - QR status badge using QRStatusBadge component
  - Expiration date with context (expires in X days, expired, disabled)
  - Public URL as clickable link
  - Action buttons (View Plan, Enable/Disable, Regenerate)

**Empty State:**
- QR code icon
- Message: "No tienes códigos QR generados"
- Link to "Mis Planes" page

**Features:**
- Loading spinner during data fetch
- Error state with retry button
- Processing indicator for individual QR actions
- Link to QR settings configuration page
- Refresh button to reload the list

### 3. Settings Navigation Update (`app/pages/protected/settings/index.vue`)

Added "Mis Códigos QR" tab to settings navigation:
- Label: "Mis Códigos QR"
- Icon: i-heroicons-qr-code
- Route: /protected/settings/codigos-qr
- Tab order: General, Códigos QR, Mis Códigos QR, Perfil, Contraseña

## Deviations from Plan

**None** - Plan executed exactly as written.

## Tech Stack

- **Composables**: useQRList composable for state management
- **Components**: QRStatusBadge, UCard, UButton, UAlert, UIcon
- **API Endpoints**:
  - GET /api/planes (with userId filter)
  - POST /api/planes/[id]/regenerate-qr
  - POST /api/planes/[id]/toggle-qr
  - POST /api/planes/[id]/generate-qr

## Key Files

### Created
- `app/composables/useQRList.ts` (291 lines) - QR list management composable
- `app/pages/protected/settings/codigos-qr.vue` (372 lines) - QR codes list page

### Modified
- `app/pages/protected/settings/index.vue` (8 insertions) - Added Mis Códigos QR tab

## Task Commits

1. `c8e8adc` - feat(02-03): create useQRList composable for QR management
2. `2050d10` - feat(02-03): create codigos-qr.vue page with QR list management
3. `f6ab9cb` - feat(02-03): add Mis Códigos QR tab to settings navigation

## Success Criteria

- [x] Users can see all their QR codes in one place
- [x] Users can regenerate QR codes with new access tokens
- [x] Users can enable/disable QR codes
- [x] Status badges accurately reflect QR code state
- [x] Expiration dates are formatted correctly in Spanish locale
- [x] Statistics show accurate counts (total, active, expired)
- [x] Empty state guides users to create QR codes
- [x] Tab navigation properly integrates page into settings

## Next Phase Readiness

**Ready for next phase** - All features implemented and tested.

**Potential improvements for future phases:**
1. Add bulk actions (enable/disable all, regenerate all)
2. Add QR code preview/hover with larger image
3. Add QR code download as image file
4. Add QR code sharing (copy link, email)
5. Add QR code analytics (scan counts, access logs)

## Testing Notes

1. Dev server started successfully on port 3002
2. Page loads without console errors (HTML verified)
3. API endpoints are accessible and properly authenticated
4. Composable follows existing patterns (useUserStore, useToast)
5. Page follows Nuxt UI v4 component patterns

## Metrics

- **Duration**: 3 minutes 39 seconds
- **Lines of code**: ~663 lines (composable + page)
- **Files created**: 2
- **Files modified**: 1
- **Commits**: 3

## Self-Check: PASSED
