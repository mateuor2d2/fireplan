# Research: QR Codes for Safety Plans

**Feature**: 002-qr-codes
**Date**: 2025-01-14
**Phase**: Phase 0 - Research & Technology Decisions

## Overview

This document consolidates research findings for implementing QR code functionality in the v9planesN3Bui3 safety plan management system. All technical decisions align with constitutional requirements and existing system patterns.

## Technology Decisions

### 1. QR Code Generation Library

**Decision**: Use `qrcode` npm package

**Rationale**:
- Mature, well-maintained (latest release: 2024)
- Pure JavaScript implementation (no native dependencies)
- Supports base64 output directly (required for PDF embedding)
- Compatible with Node.js and browser environments
- MIT license
- 1.7M weekly downloads (strong community adoption)

**Alternatives Considered**:
| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| qrcode | Base64 output, pure JS, stable | Larger bundle size | ✅ Selected |
| qrcode-terminal | Fast, lightweight | CLI only, no base64 | ❌ Not suitable |
| qr-image | Smaller bundle | Less maintained, limited options | ❌ Maintenance risk |

**Implementation Notes**:
```typescript
import QRCode from 'qrcode'

const qrCodeImage = await QRCode.toDataURL(url, {
  width: 200,
  margin: 1,
  errorCorrectionLevel: 'M' // Medium (15% error correction)
})
```

### 2. Slug Generation Library

**Decision**: Use `slugify` npm package

**Rationale**:
- Widely used (400K weekly downloads)
- Excellent Unicode/Spanish character support (critical for Spanish construction plans)
- Highly customizable (custom replacements, extensions)
- Active maintenance
- Zero dependencies

**Alternatives Considered**:
| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| slugify | Unicode support, customizable | Larger than alternatives | ✅ Selected |
| slug | Smaller bundle | Limited Unicode support | ❌ Spanish chars issue |
| Custom implementation | No dependencies | Maintenance burden, security risks | ❌ Not justified |

**Implementation Notes**:
```typescript
import slugify from 'slugify'

slugify.extend({
  'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
  'ñ': 'ni', 'ü': 'u'
})

const slug = slugify(planName, {
  lower: true,
  strict: true,
  trim: true
}).substring(0, 50) // Truncate to 50 chars
```

### 3. Access Token Generation

**Decision**: Use UUID v4 via existing `uuid` package

**Rationale**:
- Already in package.json (no new dependency)
- Cryptographically random
- Standard format (RFC 4122)
- Collision-resistant (122 random bits)
- Node.js native support via `crypto.randomUUID()`

**Alternatives Considered**:
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| UUID v4 | Standard, secure | 36 characters | ✅ Selected |
| NanoID | Smaller, URL-safe | Non-standard, shorter (21 chars) | ❌ UUID sufficient |
| Custom implementation | Full control | Security risk, testing burden | ❌ Re-inventing wheel |

**Implementation Notes**:
```typescript
import { v4 as uuidv4 } from 'uuid'
// OR use Node.js native:
const accessToken = crypto.randomUUID()
```

### 4. PDF Integration Strategy

**Decision**: Embed QR code as base64 image in pdfmake document definition

**Rationale**:
- pdfmake natively supports base64 images
- Self-contained PDFs (no external dependencies)
- Works offline (no network requests)
- Aligns with existing PDF generation patterns
- No additional S3 storage required

**Alternatives Considered**:
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Base64 embedding | Self-contained, offline | Larger PDF size | ✅ Selected |
| S3 URL references | Smaller PDF | Requires network, breaks offline | ❌ Usability issue |
| Hybrid (both) | Flexible | Complexity, storage costs | ❌ Unnecessary |

**Implementation Notes**:
```typescript
// Position QR in upper-right corner of first page
{
  pageBreak: 'after',
  content: [
    {
      image: qrCodeImage, // base64 data URL
      width: 100,
      absolutePosition: { x: 450, y: 50 } // upper-right
    },
    {
      text: 'Escanea para acceder al plan',
      absolutePosition: { x: 450, y: 160 }
    },
    {
      text: `Válido hasta: ${formatDate(expiresAt)}`,
      absolutePosition: { x: 450, y: 175 }
    }
  ]
}
```

### 5. Public Access Implementation

**Decision**: Use Nuxt public routes without authentication middleware

**Rationale**:
- Nuxt allows route-specific middleware configuration
- Clean separation between protected and public routes
- No authentication overhead for public access
- Aligns with requirement (FR-013: no authentication required)

**Alternatives Considered**:
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Public routes | Simple, clear separation | None | ✅ Selected |
| Protected with token | More control | Unnecessary complexity | ❌ Over-engineering |
| Middleware bypass | Flexible | Violates patterns | ❌ Architectural violation |

**Implementation Notes**:
```typescript
// app/pages/public/planes/[id]/[slug].vue
// No route middleware = public access
// Route pattern: /public/planes/:planId/:slug
```

### 6. Data Storage Strategy

**Decision**: Store QR codes as embedded documents in Plan collection

**Rationale**:
- 1:1 relationship (one plan → one QR code)
- QR data is small (<5KB base64 image)
- No complex queries needed
- Aligns with existing MongoDB patterns
- Single query retrieves plan + QR data

**Alternatives Considered**:
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Embedded in Plan | Simple, fast | Larger documents | ✅ Selected |
| Separate collection | Normalized | Additional queries, complexity | ❌ No benefit |
| Hybrid references | Flexible | Unnecessary for 1:1 | ❌ Over-engineering |

**Schema Design**:
```typescript
// Plan schema extension
{
  qrCode: {
    slug: String,
    accessToken: String,
    expiresAt: Date,
    qrCodeImage: String, // base64
    enabled: Boolean,
    createdAt: Date,
    updatedAt: Date
  },
  qrEnabled: {
    type: Boolean,
    default: true
  }
}
```

### 7. User Settings Storage

**Decision**: Store QR settings as embedded document in User collection

**Rationale**:
- 1:1 relationship (one user → one QR settings)
- Small data footprint
- No complex queries
- Consistent with QR storage pattern

**Schema Design**:
```typescript
// User schema extension
{
  qrSettings: {
    baseUrl: {
      type: String,
      default: process.env.NUXT_PUBLIC_SITE_URL
    },
    autoGenerate: {
      type: Boolean,
      default: true
    },
    expirationDays: {
      type: Number,
      default: 30,
      enum: [30, 90, 180, 360, 720, 1080, 1440]
    },
    createdAt: Date,
    updatedAt: Date
  }
}
```

## Best Practices Research

### QR Code Best Practices

1. **Error Correction Level**: Use 'M' (Medium, 15%) for balance between size and reliability
2. **Minimum Size**: 200x200px ensures scannability by all smartphones
3. **Quiet Zone**: 1-module margin (default in qrcode library)
4. **Contrast**: Black on white provides best scannability
5. **URL Length**: Keep under 150 characters for optimal QR density

### PDF Integration Best Practices

1. **Position**: Upper-right corner avoids overlapping content
2. **Sizing**: 100-150px in PDF coordinates (scales with page)
3. **Explanatory Text**: Include "Scan to access" below QR
4. **Expiration Display**: Show date in DD/MM/YYYY format (Spanish locale)
5. **Graceful Degradation**: Continue PDF generation if QR fails

### Security Best Practices

1. **Token Entropy**: UUID v4 provides 122 random bits (collision-resistant)
2. **Expiration**: Validate server-side on every public access request
3. **No Sensitive Data**: QR only contains URL, not plan data
4. **Rate Limiting**: Consider rate limiting on public endpoints (future enhancement)
5. **Logging**: Log public access for analytics (future enhancement)

## Integration Points Analysis

### 1. Plan Creation Flow

**Current**: Plan created → saved to database → return success
**With QR**: Plan created → generate QR (if auto-generate enabled) → save to database → return success

**Location**: `/server/api/planes/` endpoints

### 2. PDF Generation Flow

**Current**: Plan loaded → content generated → PDF created → return buffer
**With QR**: Plan loaded → content generated → QR embedded (if exists) → PDF created → return buffer

**Location**: `/server/api/planes/[id]/generate-pdf.get.ts`

### 3. Settings Integration

**Current**: User settings page with tabs (profile, notifications, etc.)
**With QR**: Add "QR Codes" tab to existing settings

**Location**: `/app/pages/protected/settings/qr.vue`

## Performance Considerations

### QR Code Generation

- **Expected Time**: <500ms for single QR code
- **CPU Usage**: Low (pure JavaScript, no native dependencies)
- **Memory**: Minimal (small base64 strings)
- **Impact**: Negligible on plan creation flow

### PDF Generation

- **Baseline**: 30 seconds (existing)
- **QR Overhead**: +2-5 seconds (image embedding)
- **Target**: <35 seconds total
- **Strategy**: Graceful degradation if QR fails

### Public Access

- **Query Time**: <100ms (single database lookup by planId)
- **Render Time**: <500ms (simple page, minimal components)
- **Target**: <2 seconds total load time
- **Caching**: Future enhancement (cache public pages)

## Risk Mitigation

### 1. QR Code Generation Failures

**Risk**: QR library throws error during generation
**Mitigation**: Wrap in try-catch, log error, continue without QR
**User Impact**: Plan created without QR, can manually generate later

### 2. PDF Generation Failures

**Risk**: QR embedding breaks PDF generation
**Mitigation**: Validate QR data before embedding, wrap in try-catch
**User Impact**: PDF generated without QR, QR can be regenerated

### 3. Slug Collisions

**Risk**: Multiple plans generate same slug
**Mitigation**: UUID token provides uniqueness, slug is for readability only
**User Impact**: None (access token is unique identifier)

### 4. Expiration Confusion

**Risk**: Users confused about expiration dates
**Mitigation**: Clear messaging, warning banners 7 days before expiration
**User Impact**: Minimal (clear communication)

## Dependencies Summary

### New Dependencies Required

```json
{
  "qrcode": "^1.5.3",
  "slugify": "^1.6.6"
}
```

### Existing Dependencies Used

- `uuid`: ^11.1.0 (already in package.json)
- `pdfmake`: ^0.2.23 (already in package.json)
- Zod schemas (existing pattern)
- Mongoose models (existing pattern)

## Open Questions - All Resolved

All technical questions have been resolved through research. No open questions remain.

## Next Steps

1. ✅ Phase 0 complete: All technical decisions made
2. → Phase 1: Create data-model.md with complete schema definitions
3. → Phase 1: Generate API contracts in contracts/ directory
4. → Phase 1: Create quickstart.md for developers
5. → Phase 2: Execute /speckit.tasks for implementation task list
