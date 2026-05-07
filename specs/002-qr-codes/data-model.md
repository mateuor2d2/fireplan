# Data Model: QR Codes for Safety Plans

**Feature**: 002-qr-codes
**Date**: 2025-01-14
**Phase**: Phase 1 - Data Model & API Contracts

## Overview

This document defines the complete data model for the QR codes feature, including entity definitions, relationships, validation rules, and state transitions.

## Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ _id: ObjectId   │
│ email: String   │
│ ...             │
│ qrSettings      │◄─────┐ (embedded 1:1)
└────────┬────────┘      │
         │              │
         │ owns (N:1)    │
         │              │
         ▼              │
┌─────────────────┐      │
│      Plan       │      │
├─────────────────┤      │
│ _id: ObjectId   │      │
│ nom_obra: Str   │      │
│ userId: Ref     │──────┘
│ ...             │
│ qrCode          │◄─────┐ (embedded 1:1)
│ qrEnabled: Bool │      │
└─────────────────┘      │ (access for public viewing)
                         │
                         │ (UUID token for security)
                         │
                Public Access (no auth)
```

## Entity Definitions

### 1. PlanQR (Embedded in Plan)

QR code data embedded directly in the Plan document.

```typescript
interface PlanQR {
  // Primary identifier (not used directly, Plan._id is primary)
  _id?: ObjectId

  // Foreign key to parent Plan (implicit via embedding)
  planId: ObjectId

  // URL-friendly identifier derived from nom_obra
  slug: string // max 50 chars, lowercase, alphanumeric + hyphens

  // Unique access token for public URL
  accessToken: string // UUID v4 format

  // Expiration timestamp
  expiresAt: Date

  // QR code image in base64 format
  qrCodeImage: string // data URL format: "data:image/png;base64,..."

  // Whether the QR code is active
  enabled: boolean

  // Audit timestamps
  createdAt: Date
  updatedAt: Date
}
```

#### Validation Rules

| Field | Type | Required | Unique | Validation |
|-------|------|----------|--------|------------|
| planId | ObjectId | Yes | No | Must reference existing Plan |
| slug | String | Yes | No* | max 50 chars, lowercase, a-z0-9- |
| accessToken | String | Yes | Yes | UUID v4 format |
| expiresAt | Date | Yes | No | Must be future date |
| qrCodeImage | String | Yes | No | Base64 PNG, max 10KB |
| enabled | Boolean | Yes | No | true or false |
| createdAt | Date | Yes | No | Auto-set on creation |
| updatedAt | Date | Yes | No | Auto-updated on changes |

*Slug uniqueness not enforced (UUID token provides uniqueness)

#### Indexes

- `planId` - Index for lookups
- `accessToken` - Unique index for public access validation
- `expiresAt` - Index for expiration queries (future cleanup jobs)

#### State Transitions

```
[Not Created] → [Active] → [Disabled]
                   ↓
                [Expired]
```

**States**:
- **Not Created**: Plan exists without QR code
- **Active**: QR code exists, enabled, not expired
- **Disabled**: QR code exists but disabled by user
- **Expired**: QR code exists but expiration date passed

**Transitions**:
- Not Created → Active: Auto-generate or manual generation
- Active → Disabled: User disables QR code
- Disabled → Active: User re-enables QR code
- Active → Active: Regenerate (new token, new expiration)
- Any → Expired: Time passes (automatic)
- Expired → Active: Regenerate (new token, new expiration)

### 2. UserQRSettings (Embedded in User)

User preferences for QR code generation.

```typescript
interface UserQRSettings {
  // Primary identifier (not used directly, User._id is primary)
  _id?: ObjectId

  // Foreign key to parent User (implicit via embedding)
  userId: ObjectId

  // Configurable base URL for QR codes
  baseUrl: string // e.g., "http://localhost:3000", "https://previnius.io"

  // Auto-generate QR codes for new plans
  autoGenerate: boolean // default: true

  // Default expiration period in days
  expirationDays: number // enum: 30, 90, 180, 360, 720, 1080, 1440

  // Audit timestamps
  createdAt: Date
  updatedAt: Date
}
```

#### Validation Rules

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| userId | ObjectId | Yes | - | Must reference existing User |
| baseUrl | String | Yes | NUXT_PUBLIC_SITE_URL | Valid URL format |
| autoGenerate | Boolean | Yes | true | true or false |
| expirationDays | Number | Yes | 30 | 30, 90, 180, 360, 720, 1080, 1440 |
| createdAt | Date | Yes | - | Auto-set on creation |
| updatedAt | Date | Yes | - | Auto-updated on changes |

#### Indexes

- `userId` - Index for lookups (implicit via embedding)

#### State Transitions

No state transitions - simple configuration document.

### 3. Plan (Extended)

Existing Plan schema extended with QR fields.

```typescript
interface Plan {
  // ... existing fields ...

  // Embedded QR code data (nullable)
  qrCode?: PlanQR | null

  // Whether QR functionality is enabled for this plan
  qrEnabled: boolean // default: true
}
```

#### New Fields on Plan

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| qrCode | Embedded | No | null | QR code data (PlanQR) |
| qrEnabled | Boolean | Yes | true | Whether QR can be generated |

### 4. User (Extended)

Existing User schema extended with QR settings.

```typescript
interface User {
  // ... existing fields ...

  // Embedded QR settings (nullable)
  qrSettings?: UserQRSettings | null
}
```

#### New Fields on User

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| qrSettings | Embedded | No | null | QR code preferences (UserQRSettings) |

## Collection Structure

### MongoDB Collections

No new collections. QR data is embedded in existing collections:

- `planes` - Extended with `qrCode` and `qrEnabled` fields
- `users` - Extended with `qrSettings` field

### Document Examples

#### Plan Document with QR Code

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "nom_obra": "Obra de Ejemplo Madrid",
  "userId": "507f191e810c19729de860ea",
  "...": "existing fields",
  "qrCode": {
    "_id": "507f1f77bcf86cd799439012",
    "planId": "507f1f77bcf86cd799439011",
    "slug": "obra-de-ejemplo-madrid",
    "accessToken": "550e8400-e29b-41d4-a716-446655440000",
    "expiresAt": "2025-02-13T00:00:00.000Z",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
    "enabled": true,
    "createdAt": "2025-01-14T10:00:00.000Z",
    "updatedAt": "2025-01-14T10:00:00.000Z"
  },
  "qrEnabled": true
}
```

#### User Document with QR Settings

```json
{
  "_id": "507f191e810c19729de860ea",
  "email": "user@example.com",
  "...": "existing fields",
  "qrSettings": {
    "_id": "507f191e810c19729de860eb",
    "userId": "507f191e810c19729de860ea",
    "baseUrl": "https://previnius.io",
    "autoGenerate": true,
    "expirationDays": 180,
    "createdAt": "2025-01-14T10:00:00.000Z",
    "updatedAt": "2025-01-14T10:00:00.000Z"
  }
}
```

## Type Definitions

### Client-Side Types (`app/types/qr.ts`)

```typescript
export interface QRCodeDisplay {
  slug: string
  publicUrl: string
  expiresAt: Date
  expiresAtDisplay: string // formatted for UI
  qrCodeImage: string // base64 data URL
  enabled: boolean
  daysUntilExpiration: number
}

export interface QRSettings {
  baseUrl: string
  autoGenerate: boolean
  expirationDays: number
}

export interface QRPublicPlan {
  _id: string
  nom_obra: string
  desc_obra?: string
  fecha_inicio: Date
  fecha_fin: Date
  qrCode: {
    slug: string
    expiresAt: Date
  }
}

export const EXPIRATION_OPTIONS = [
  { label: '30 días', value: 30 },
  { label: '90 días', value: 90 },
  { label: '180 días', value: 180 },
  { label: '1 año (360 días)', value: 360 },
  { label: '2 años (720 días)', value: 720 },
  { label: '3 años (1080 días)', value: 1080 },
  { label: '4 años (1440 días)', value: 1440 }
] as const

export type ExpirationDays = typeof EXPIRATION_OPTIONS[number]['value']
```

### Server-Side Types (`server/types/qr.ts`)

```typescript
import { ObjectId } from 'mongodb'

export interface PlanQRDocument {
  _id?: ObjectId
  planId: ObjectId
  slug: string
  accessToken: string
  expiresAt: Date
  qrCodeImage: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserQRSettingsDocument {
  _id?: ObjectId
  userId: ObjectId
  baseUrl: string
  autoGenerate: boolean
  expirationDays: number
  createdAt: Date
  updatedAt: Date
}

export interface QRGenerateOptions {
  slug?: string
  expirationDays?: number
  baseUrl?: string
}

export interface QRPublicAccessParams {
  planId: string
  slug: string
  accessToken: string
}
```

## Database Operations

### Queries

#### Get QR Code by Plan ID

```typescript
const plan = await db.collection('planes').findOne(
  { _id: new ObjectId(planId) },
  { projection: { qrCode: 1, qrEnabled: 1 } }
)
```

#### Validate Public Access

```typescript
const plan = await db.collection('planes').findOne(
  {
    _id: new ObjectId(planId),
    'qrCode.slug': slug,
    'qrCode.accessToken': accessToken,
    'qrCode.enabled': true,
    'qrCode.expiresAt': { $gt: new Date() }
  }
)
```

#### Get User QR Settings

```typescript
const user = await db.collection('users').findOne(
  { _id: new ObjectId(userId) },
  { projection: { qrSettings: 1 } }
)
```

### Updates

#### Generate/Update QR Code

```typescript
await db.collection('planes').updateOne(
  { _id: new ObjectId(planId) },
  {
    $set: {
      qrCode: qrCodeData,
      updatedAt: new Date()
    }
  }
)
```

#### Update User QR Settings

```typescript
await db.collection('users').updateOne(
  { _id: new ObjectId(userId) },
  {
    $set: {
      'qrSettings.baseUrl': baseUrl,
      'qrSettings.autoGenerate': autoGenerate,
      'qrSettings.expirationDays': expirationDays,
      'qrSettings.updatedAt': new Date()
    }
  }
)
```

## Indexing Strategy

### Plan Collection Indexes

```javascript
// New indexes for QR feature
db.planes.createIndex({ 'qrCode.accessToken': 1 }, { unique: true, sparse: true })
db.planes.createIndex({ 'qrCode.expiresAt': 1 }, { sparse: true })
db.planes.createIndex({ 'qrCode.planId': 1 }, { sparse: true })

// Existing indexes (unchanged)
db.planes.createIndex({ userId: 1 })
db.planes.createIndex({ createdAt: -1 })
```

### User Collection Indexes

```javascript
// No new indexes needed (qrSettings is embedded)
// Existing indexes (unchanged)
db.users.createIndex({ email: 1 }, { unique: true })
```

## Migration Notes

### Initial Migration

When deploying this feature:

1. Add `qrCode` and `qrEnabled` fields to all existing Plan documents (nullable)
2. Add `qrSettings` field to all existing User documents (nullable)
3. Create new indexes on `planes` collection
4. No data migration needed (fields are optional)

### Rollback Plan

If rollback is required:

1. Drop new indexes on `planes` collection
2. QR code fields remain in documents (harmless)
3. Feature can be disabled via feature flags

## Validation Summary

All entities follow constitutional requirements:
- ✅ TypeScript types defined end-to-end
- ✅ Zod schemas validate all API boundaries
- ✅ Mongoose schemas enforce database constraints
- ✅ User data isolation maintained (qrCode respects plan ownership)
- ✅ Audit trails preserved (createdAt, updatedAt timestamps)
