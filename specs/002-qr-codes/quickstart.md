# Quickstart: QR Codes for Safety Plans

**Feature**: 002-qr-codes
**Branch**: `002-qr-codes`
**Date**: 2025-01-14

## Overview

This guide helps developers quickly understand and work with the QR codes feature for safety plans.

## Prerequisites

```bash
# Install new dependencies
bun add qrcode slugify

# Install TypeScript types
bun add -D @types/qrcode
```

## Architecture Summary

The QR codes feature follows the constitutional 5-layer pattern:

```
┌─────────────────────────────────────────────────────┐
│ Page Layer (UI & Routing)                          │
│ - Settings page, public access page                │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ Component Layer (Reusable UI Logic)                 │
│ - QR config form, status badge, preview            │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ Store Layer (State & Business Logic)               │
│ - Extended planes/user stores with QR methods       │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ API Layer (Persistence & External Integrations)     │
│ - QR generation, settings, public access endpoints │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│ Model Layer (Data Models)                          │
│ - PlanQR, UserQRSettings embedded documents        │
└─────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. QR Code Lifecycle

```
[Not Created]
     ↓ (auto-generate or manual)
[Active] ←→ [Regenerate]
     ↓ (time passes)
[Expired]
     ↓ (regenerate)
[Active]
```

### 2. Public Access Flow

```
User scans QR → Opens public URL → Server validates → Show plan/download PDF
```

**Validation Steps**:
1. Plan exists?
2. QR code enabled?
3. Access token matches?
4. Not expired?

If all pass → Show public plan page
If any fail → Show appropriate error message

### 3. Settings Hierarchy

```
User QR Settings → Default for new QR codes
Manual Override → Specific QR code options
```

## Quick Reference

### Data Model

```typescript
// Plan QR (embedded in Plan)
{
  qrCode: {
    slug: string,           // URL-friendly from nom_obra
    accessToken: string,    // UUID v4
    expiresAt: Date,        // Calculated from settings
    qrCodeImage: string,    // Base64 PNG
    enabled: boolean,
    createdAt: Date,
    updatedAt: Date
  },
  qrEnabled: boolean        // Master switch per plan
}

// User QR Settings (embedded in User)
{
  qrSettings: {
    baseUrl: string,        // e.g., "https://previnius.io"
    autoGenerate: boolean,  // Auto-generate for new plans
    expirationDays: number, // 30, 90, 180, 360, 720, 1080, 1440
    createdAt: Date,
    updatedAt: Date
  }
}
```

### API Endpoints

```typescript
// Authenticated
POST /api/planes/{id}/generate-qr      // Generate QR code
POST /api/planes/{id}/regenerate-qr    // Regenerate QR code
GET  /api/user/qr-settings              // Get user settings
PUT  /api/user/qr-settings              // Update user settings

// Public (no auth)
GET  /public/planes/{id}/{slug}        // Public plan page
GET  /public/planes/{id}/{slug}/download // Public PDF download
```

### Public URL Format

```
{baseUrl}/public/planes/{planId}/{slug}
```

Example: `https://previnius.io/public/planes/507f1f77bcf86cd799439011/obra-de-ejemplo-madrid`

## Common Tasks

### Generate QR Code for a Plan

```typescript
// In a component or store
const { generateQRCode } = useQRCode()

const result = await generateQRCode(planId, {
  expirationDays: 180,  // optional override
  baseUrl: 'https://previnius.io'  // optional override
})

// Result contains:
// - slug
// - publicUrl
// - expiresAt
// - qrCodeImage (base64)
```

### Update User QR Settings

```typescript
// In settings component
const { updateQRSettings } = useQRSettings()

await updateQRSettings({
  baseUrl: 'https://previnius.io',
  autoGenerate: true,
  expirationDays: 180
})
```

### Display QR Status

```typescript
// In plan detail component
<QRStatusBadge
  :plan="plan"
  @generate="handleGenerateQR"
  @regenerate="handleRegenerateQR"
/>
```

### Access Public Plan Page

```typescript
// No authentication required
const publicUrl = `/public/planes/${planId}/${slug}`
window.open(publicUrl, '_blank')
```

## File Locations

### Frontend

```
app/
├── components/qr/
│   ├── QRConfigForm.vue           # Settings form
│   ├── QRStatusBadge.vue          # Status display
│   └── QRPreview.vue              # QR preview
├── pages/
│   ├── protected/settings/qr.vue  # Settings page
│   └── public/planes/[id]/[slug].vue # Public page
├── stores/
│   ├── planes.ts                  # Extended with QR methods
│   └── user.ts                    # Extended with QR settings
├── composables/
│   └── useQRCode.ts               # QR utilities
├── schemas/qr.ts                  # Zod schemas
└── types/qr.ts                    # TypeScript types
```

### Backend

```
server/
├── api/
│   ├── planes/[id]/
│   │   ├── generate-qr.post.ts
│   │   └── regenerate-qr.post.ts
│   ├── user/qr-settings/
│   │   ├── index.get.ts
│   │   └── index.put.ts
│   └── public/planes/[id]/
│       └── [slug].get.ts
│       └── [slug]/download.get.ts
├── models/
│   ├── Plan.ts                    # Extended with qrCode
│   ├── User.ts                    # Extended with qrSettings
│   └── PlanQR.ts                  # QR code model (optional)
├── services/
│   └── qrService.ts               # Business logic
├── utils/
│   ├── qr-generator.ts            # QR generation
│   └── slug-generator.ts          # Slug generation
└── types/qr.ts                    # Server types
```

## Development Workflow

### 1. Add QR Code to Existing Plan

```bash
# Start development server
bun dev

# Navigate to plan detail
# Click "Generate QR" button
# QR code appears in status badge
# Generate PDF to see QR on first page
```

### 2. Test Public Access

```bash
# Generate QR code for a test plan
# Copy the public URL from the QR response
# Open in incognito window (no auth)
# Verify plan loads correctly
# Test download button
```

### 3. Configure QR Settings

```bash
# Navigate to Settings > QR Codes
# Update base URL for your environment
# Toggle auto-generate on/off
# Select default expiration period
# Save changes
# Create new plan to verify settings apply
```

## Testing

### Unit Tests

```typescript
// tests/unit/qr-generator.test.ts
import { generateQRCode } from '~/utils/qr-generator'

describe('QR Code Generator', () => {
  it('should generate valid QR code', async () => {
    const qr = await generateQRCode('https://example.com')
    expect(qr).toMatch(/^data:image\/png;base64,/)
  })
})
```

### Integration Tests

```typescript
// tests/integration/qr-flow.test.ts
describe('QR Code Flow', () => {
  it('should generate QR and access publicly', async () => {
    // 1. Create plan
    // 2. Generate QR
    // 3. Access public URL
    // 4. Verify plan loads
    // 5. Download PDF
  })
})
```

### Contract Tests

```typescript
// tests/contract/qr-api.test.ts
describe('QR API Contract', () => {
  it('should match schema', async () => {
    const response = await POST('/api/planes/123/generate-qr')
    expect(response).toMatchSchema(QRCodeResponseSchema)
  })
})
```

## Troubleshooting

### QR Code Not Appearing in PDF

1. Check if `plan.qrCode` exists
2. Check if `plan.qrEnabled` is true
3. Check PDF generation logs for errors
4. Verify QR image is valid base64

### Public Access Shows "Plan Not Accessible"

1. Check if plan exists
2. Check if QR code is enabled
3. Check if access token matches
4. Check if QR code is expired

### Settings Not Applying

1. Check if `user.qrSettings` exists
2. Check if `autoGenerate` is true
3. Verify settings are being saved to database
4. Check browser console for errors

## Environment Configuration

```bash
# .env (development)
NUXT_PUBLIC_SITE_URL=http://localhost:3000

# .env.production
NUXT_PUBLIC_SITE_URL=https://previnius.io
```

## Performance Considerations

- QR code generation: <500ms
- Public page load: <2 seconds
- PDF generation with QR: <35 seconds
- Database queries: Indexed on `accessToken` and `planId`

## Security Notes

- Public URLs contain UUID tokens (not guessable)
- QR codes expire automatically
- No sensitive data in QR codes (only URLs)
- Rate limiting recommended for public endpoints (future)

## Migration Notes

### Initial Deployment

```bash
# Run migration to add new fields
bun run migrate:add-qr-fields

# Create indexes
bun run migrate:create-qr-indexes
```

### Rollback

```bash
# QR fields remain in database (harmless)
# Feature can be disabled via feature flags
# No data migration needed for rollback
```

## Next Steps

1. Review [data-model.md](./data-model.md) for complete schema definitions
2. Review [contracts/api-contract.md](./contracts/api-contract.md) for API specifications
3. Review [research.md](./research.md) for technology decisions
4. Execute `/speckit.tasks` to generate implementation tasks

## Support

For questions or issues:
1. Check this quickstart first
2. Review the feature specification
3. Check API contracts
4. Contact the development team

---

**Last Updated**: 2025-01-14
**Feature Version**: 1.0.0
