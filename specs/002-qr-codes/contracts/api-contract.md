# API Contract: QR Codes for Safety Plans

**Feature**: 002-qr-codes
**Date**: 2025-01-14
**Version**: 1.0.0

## Overview

This document defines the REST API contract for the QR codes feature. All endpoints follow constitutional architectural patterns and include Zod validation schemas.

## Base URL

```
/api (authenticated endpoints)
/public (public endpoints)
```

## Authentication

- **Authenticated endpoints**: JWT token via HTTP-only cookie
- **Public endpoints**: No authentication required

## Common Response Format

### Success Response

```typescript
{
  success: true,
  data: T
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

## Endpoints

### 1. Generate QR Code

**Endpoint**: `POST /api/planes/{id}/generate-qr`
**Authentication**: Required
**Description**: Generate a QR code for a plan (or regenerate existing)

#### Request

```typescript
POST /api/planes/507f1f77bcf86cd799439011/generate-qr

// Request body (optional)
{
  expirationDays?: number, // Override user default (30, 90, 180, 360, 720, 1080, 1440)
  baseUrl?: string        // Override user default
}
```

#### Response (200 OK)

```typescript
{
  success: true,
  data: {
    qrCode: {
      slug: string,
      accessToken: string,
      publicUrl: string,
      expiresAt: string, // ISO 8601
      expiresAtDisplay: string, // DD/MM/YYYY
      qrCodeImage: string, // base64 data URL
      enabled: true,
      createdAt: string,
      updatedAt: string
    }
  }
}
```

#### Errors

| Code | Status | Description |
|------|--------|-------------|
| PLAN_NOT_FOUND | 404 | Plan does not exist |
| PLAN_ACCESS_DENIED | 403 | User does not own the plan |
| QR_ALREADY_EXISTS | 400 | QR code already exists (use regenerate endpoint) |
| INVALID_EXPIRATION_DAYS | 400 | Expiration days not in allowed values |
| INVALID_BASE_URL | 400 | Base URL format invalid |

---

### 2. Regenerate QR Code

**Endpoint**: `POST /api/planes/{id}/regenerate-qr`
**Authentication**: Required
**Description**: Regenerate an existing QR code with new token and extended expiration

#### Request

```typescript
POST /api/planes/507f1f77bcf86cd799439011/regenerate-qr

// Request body (optional)
{
  expirationDays?: number, // Override user default
  baseUrl?: string        // Override user default
}
```

#### Response (200 OK)

```typescript
{
  success: true,
  data: {
    qrCode: {
      slug: string,
      accessToken: string, // NEW token
      publicUrl: string,   // NEW URL with new token
      expiresAt: string,   // NEW expiration date
      expiresAtDisplay: string,
      qrCodeImage: string, // NEW QR code image
      enabled: true,
      createdAt: string,
      updatedAt: string
    }
  }
}
```

#### Errors

| Code | Status | Description |
|------|--------|-------------|
| PLAN_NOT_FOUND | 404 | Plan does not exist |
| PLAN_ACCESS_DENIED | 403 | User does not own the plan |
| QR_NOT_EXISTS | 404 | QR code does not exist (use generate endpoint) |
| INVALID_EXPIRATION_DAYS | 400 | Expiration days not in allowed values |
| INVALID_BASE_URL | 400 | Base URL format invalid |

---

### 3. Get User QR Settings

**Endpoint**: `GET /api/user/qr-settings`
**Authentication**: Required
**Description**: Get current user's QR settings

#### Request

```typescript
GET /api/user/qr-settings
```

#### Response (200 OK)

```typescript
{
  success: true,
  data: {
    qrSettings: {
      baseUrl: string,
      autoGenerate: boolean,
      expirationDays: number
    }
  }
}
```

#### Errors

| Code | Status | Description |
|------|--------|-------------|
| SETTINGS_NOT_FOUND | 404 | QR settings not configured (returns defaults) |

---

### 4. Update User QR Settings

**Endpoint**: `PUT /api/user/qr-settings`
**Authentication**: Required
**Description**: Update current user's QR settings

#### Request

```typescript
PUT /api/user/qr-settings

{
  baseUrl: string,
  autoGenerate: boolean,
  expirationDays: number // 30, 90, 180, 360, 720, 1080, or 1440
}
```

#### Response (200 OK)

```typescript
{
  success: true,
  data: {
    qrSettings: {
      baseUrl: string,
      autoGenerate: boolean,
      expirationDays: number,
      createdAt: string,
      updatedAt: string
    }
  }
}
```

#### Errors

| Code | Status | Description |
|------|--------|-------------|
| INVALID_BASE_URL | 400 | Base URL format invalid |
| INVALID_EXPIRATION_DAYS | 400 | Expiration days not in allowed values |

---

### 5. Public Plan Access

**Endpoint**: `GET /public/planes/{id}/{slug}`
**Authentication**: None (public)
**Description**: Access a plan publicly via QR code

#### Request

```typescript
GET /public/planes/507f1f77bcf86cd799439011/obra-de-ejemplo-madrid
```

#### Response (200 OK) - QR Valid and Not Expired

```typescript
{
  success: true,
  data: {
    plan: {
      _id: string,
      nom_obra: string,
      desc_obra?: string,
      fecha_inicio: string, // ISO 8601
      fecha_fin: string,    // ISO 8601
      qrCode: {
        slug: string,
        expiresAt: string,
        expiresAtDisplay: string,
        daysUntilExpiration: number,
        isExpiringSoon: boolean // true if < 7 days
      }
    },
    downloadUrl: string // /public/planes/{id}/{slug}/download
  }
}
```

#### Response (410 Gone) - QR Expired

```typescript
{
  success: false,
  error: {
    code: "QR_EXPIRED",
    message: "Este código QR ha caducado",
    details: {
      expiredAt: string,
      contactInfo?: string
    }
  }
}
```

#### Response (404 Not Found) - Invalid QR or Plan Not Found

```typescript
{
  success: false,
  error: {
    code: "PLAN_NOT_ACCESSIBLE",
    message: "El plan no es accesible o no existe"
  }
}
```

---

### 6. Public PDF Download

**Endpoint**: `GET /public/planes/{id}/{slug}/download`
**Authentication**: None (public)
**Description**: Download a plan PDF publicly via QR code

#### Request

```typescript
GET /public/planes/507f1f77bcf86cd799439011/obra-de-ejemplo-madrid/download
```

#### Response (200 OK) - PDF File

```typescript
Content-Type: application/pdf
Content-Disposition: attachment; filename="plan-nombre-obra.pdf"

<PDF binary data>
```

#### Response (410 Gone) - QR Expired

```typescript
{
  success: false,
  error: {
    code: "QR_EXPIRED",
    message: "Este código QR ha caducado"
  }
}
```

#### Response (404 Not Found) - Invalid QR or Plan Not Found

```typescript
{
  success: false,
  error: {
    code: "PLAN_NOT_ACCESSIBLE",
    message: "El plan no es accesible o no existe"
  }
}
```

---

## Zod Validation Schemas

See [schema-contract.md](./schema-contract.md) for complete Zod validation schemas.

## Rate Limiting

**Authenticated endpoints**: Standard rate limits apply
**Public endpoints**: Consider implementing rate limiting (future enhancement)

## CORS

**Public endpoints**: Allow CORS for all origins (by design for public access)
**Authenticated endpoints**: Standard CORS policy

## OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: v9planes QR Codes API
  version: 1.0.0
  description: QR code generation and public access API

servers:
  - url: http://localhost:3000/api
    description: Development
  - url: https://previnius.io/api
    description: Production

paths:
  /planes/{id}/generate-qr:
    post:
      summary: Generate QR code for a plan
      tags: [QR Codes]
      security:
        - cookieAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                expirationDays:
                  type: number
                  enum: [30, 90, 180, 360, 720, 1080, 1440]
                baseUrl:
                  type: string
                  format: uri
      responses:
        '200':
          description: QR code generated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QRCodeResponse'
        '400':
          description: Invalid request
        '403':
          description: Access denied
        '404':
          description: Plan not found

  /planes/{id}/regenerate-qr:
    post:
      summary: Regenerate QR code
      tags: [QR Codes]
      security:
        - cookieAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/QRGenerateOptions'
      responses:
        '200':
          description: QR code regenerated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QRCodeResponse'

  /user/qr-settings:
    get:
      summary: Get user QR settings
      tags: [User Settings]
      security:
        - cookieAuth: []
      responses:
        '200':
          description: QR settings retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QRSettingsResponse'
    put:
      summary: Update user QR settings
      tags: [User Settings]
      security:
        - cookieAuth: []
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/QRSettingsUpdate'
      responses:
        '200':
          description: QR settings updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QRSettingsResponse'

components:
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: auth-token
  schemas:
    QRCodeResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            qrCode:
              $ref: '#/components/schemas/QRCode'
    QRCode:
      type: object
      properties:
        slug:
          type: string
        accessToken:
          type: string
          format: uuid
        publicUrl:
          type: string
          format: uri
        expiresAt:
          type: string
          format: date-time
        expiresAtDisplay:
          type: string
        qrCodeImage:
          type: string
          format: byte
        enabled:
          type: boolean
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
    QRSettingsResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            qrSettings:
              $ref: '#/components/schemas/QRSettings'
    QRSettings:
      type: object
      properties:
        baseUrl:
          type: string
          format: uri
        autoGenerate:
          type: boolean
        expirationDays:
          type: number
          enum: [30, 90, 180, 360, 720, 1080, 1440]
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
    QRSettingsUpdate:
      type: object
      required:
        - baseUrl
        - autoGenerate
        - expirationDays
      properties:
        baseUrl:
          type: string
          format: uri
        autoGenerate:
          type: boolean
        expirationDays:
          type: number
          enum: [30, 90, 180, 360, 720, 1080, 1440]
    QRGenerateOptions:
      type: object
      properties:
        expirationDays:
          type: number
          enum: [30, 90, 180, 360, 720, 1080, 1440]
        baseUrl:
          type: string
          format: uri

# Public endpoints would be defined separately with a different server URL
# and no security requirements
```

## Error Codes Reference

| Code | HTTP Status | Description |
|------|------------|-------------|
| PLAN_NOT_FOUND | 404 | Plan does not exist |
| PLAN_ACCESS_DENIED | 403 | User does not own the plan |
| QR_NOT_EXISTS | 404 | QR code does not exist |
| QR_ALREADY_EXISTS | 400 | QR code already exists |
| QR_EXPIRED | 410 | QR code has expired |
| PLAN_NOT_ACCESSIBLE | 404 | Plan not accessible via public QR |
| INVALID_EXPIRATION_DAYS | 400 | Expiration days not in allowed values |
| INVALID_BASE_URL | 400 | Base URL format invalid |
| SETTINGS_NOT_FOUND | 404 | QR settings not found |
| UNAUTHORIZED | 401 | Authentication required |
| SERVER_ERROR | 500 | Internal server error |

## Testing Notes

### Contract Testing

All endpoints should have contract tests that validate:
- Request/response schemas match Zod definitions
- Error codes are consistent
- Status codes are correct
- Authentication/authorization works as expected

### Integration Testing

Critical user journeys:
1. User creates plan → QR auto-generates (if enabled)
2. User manually generates QR code
3. User regenerates QR code (new token)
4. User updates QR settings
5. Public user accesses plan via QR code
6. Public user downloads PDF via QR code
7. Expired QR code shows appropriate message
