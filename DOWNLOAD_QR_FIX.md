# Download QR Fix Summary

## Problem
Both QR codes (in PDF and on dashboard) were pointing to `/public/planes` (the view page) instead of `/public/planes/{id}/{slug}/download` (the download endpoint).

## Changes Made

### 1. QR Generator (`server/utils/qr-generator.ts`)
- Changed `generatePublicQRCode` to generate QR codes pointing to the download endpoint
- QR codes now encode: `{baseUrl}/public/planes/{planId}/{slug}/download`

### 2. QR Service (`server/services/qrService.ts`)
- Updated both `generateForPlan` and `regenerateForPlan` methods
- Now stores the download URL in the `publicUrl` field

### 3. PDF Generation (`server/api/planes/[id]/generate-pdf.get.ts`)
- Added logic to detect if existing QR codes point to the wrong URL
- Automatically regenerates QR codes that don't point to `/download`
- New QR codes generated during PDF creation will point to download endpoint

### 4. Dashboard (`app/pages/protected/planes/[[id]]/dashboard.vue`)
- Added a new "Download QR" section that shows the download URL
- QR Preview component still shows the QR code image (which now points to download)
- Users can copy the download URL directly

## How It Works Now

1. **New QR Codes**: Generated with download URL from the start
2. **Existing QR Codes**: 
   - When PDF is generated, the system checks if QR points to download
   - If not, it regenerates the QR code with the correct download URL
   - The new QR code is saved to the database
3. **Dashboard**: Shows the download QR code and provides copy/test buttons

## Testing

To verify the fix:
1. Generate a new plan QR code
2. Print the PDF - the QR code should point to `/download`
3. Scan the QR from the PDF - it should download the PDF directly
4. Check the dashboard - the download QR section should show the correct URL
5. Existing plans: When you regenerate their PDF, the QR will be updated automatically
