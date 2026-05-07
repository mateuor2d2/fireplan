# Phase 1: Database & Models

## Objective

Establish the data layer for issue reporting: Coordinator and VerificationCode models, with all associated schemas, types, and tests.

## Context

### Existing Codebase
- Database: MongoDB with Mongoose ODM
- Model location: `/server/models/`
- Existing Issue model: `/server/models/Issue.ts` (uses `obraId` field)
- Authentication: JWT-based with user model at `/server/models/User.ts`

### Technical Constraints
- Nuxt 4 migration in progress (must use relative imports only - no `~` or `@` aliases)
- TypeScript 5.9+ with strict mode enabled
- SSR-safe patterns (no `process.client` guards)
- Zod for runtime validation
- Pinia stores for state management

### Dependencies
- `server/models/Planes.ts` - existing Plan model (for `obraId` reference)
- `app/stores/user.ts` - existing User store
- `app/stores/planes.ts` - existing Planes store

## Tasks

### Task 1. Create Coordinator Mongoose model

**File:** `/server/models/Coordinator.ts`

**Requirements:**
- Must use relative imports (no `~` or `@` aliases)
- Schema fields:
  - `obraId`: String, required, indexed (foreign key to Planes collection)
  - `name`: String, required (full name of coordinator)
  - `cargo`: String, required (role/title - "Coordinador de seguridad", "Responsable de prevención", etc.)
  - `email`: String, required, lowercase, unique
  - `phone`: String, required (format validation needed)
  - `smsEnabled`: Boolean, default: false (admin controls SMS notifications per-coordinator)
  - `active`: Boolean, default: true (allows disabling without deleting coordinator)
- Indexes:
  - `{ obraId: 1 }` - Fast lookups by work
  - `{ email: 1 }` - Unique email constraint
- Timestamps: `createdAt`, `updatedAt`

**Code Structure:**
```typescript
import { Schema, model, Document } from "mongoose"

export interface ICoordinator extends Document {
  obraId: string
  name: string
  cargo: string
  email: string
  phone: string
  smsEnabled: boolean
  active: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Verification:**
- [ ] Model created with all required fields
- [ ] Indexes created for obraId and email
- [ ] TypeScript interface exported
- [ ] Model exported as `default`

---

### Task 2. Create VerificationCode Mongoose model

**File:** `/server/models/VerificationCode.ts`

**Requirements:**
- Must use relative imports
- Schema fields:
  - `code`: String, required, unique, 6 digits (regex: `/^[0-9]{6}$/`)
  - `email`: String, optional
  - `phone`: String, optional (partial match on phone number)
  - `method`: String, required, enum: ['email', 'sms', 'both'], default: 'email'
  - `expiresAt`: Date, required (15 minutes from generation)
  - `verified`: Boolean, default: false
  - `obraId`: String, required (to link verification to issue)
  - `ipAddress`: String (for rate limiting by IP)
  - `createdAt`: Date
- Indexes:
  - `{ code: 1 }` - Fast lookup by code
  - `{ expiresAt: 1, expiresAt: -1 }` - TTL index for auto-cleanup
  - `{ obraId: 1, createdAt: -1 }` - Fast lookup by obra
- Timestamps: `createdAt`, `updatedAt`

**Code Structure:**
```typescript
import { Schema, model, Document } from "mongoose"

export interface IVerificationCode extends Document {
  code: string
  email?: string
  phone?: string
  method: 'email' | 'sms' | 'both'
  expiresAt: Date
  verified: boolean
  obraId: string
  ipAddress: string
  createdAt: Date
  updatedAt: Date
}
```

**Verification:**
- [ ] Model created with all fields
- [ ] Code validation regex enforced in schema
- [ ] Indexes created including TTL for automatic cleanup
- [ ] TypeScript interface exported
- [ ] Model exported as `default`

---

### Task 3. Create Zod schemas

**Files:**
- `/server/schemas/coordinator.ts` - Coordinator validation schema
- `/server/schemas/verification.ts` - VerificationCode validation schema

**Requirements:**
- Use existing validation patterns from `/app/schemas/qr.ts`
- Include detailed error messages for validation failures
- Include both create and update schemas for Coordinator (partial updates allowed)
- For VerificationCode, include strict validation for code format and expiration

**Coordinator Schema Requirements:**
```typescript
// CoordinatorCreateSchema
export const CoordinatorCreateSchema = z.object({
  obraId: z.string().regex(/^[0-9a-f]{24}$/, 'Invalid obra ID format'),
  name: z.string().min(1).max(100),
  cargo: z.string().min(1).max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone format'),
  smsEnabled: z.boolean().optional(),
  active: z.boolean().optional()
})

// CoordinatorUpdateSchema
export const CoordinatorUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  cargo: z.string().min(1).max(100).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone format').optional(),
  smsEnabled: z.boolean().optional(),
  active: z.boolean().optional()
})
```

**VerificationCode Schema Requirements:**
```typescript
export const VerificationCodeCreateSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone format').optional(),
  method: z.enum(['email', 'sms', 'both']).default('email'),
  obraId: z.string().regex(/^[0-9a-f]{24}$/, 'Invalid obra ID format'),
  ipAddress: z.string().optional()
})

export const VerificationCodeValidateSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, 'Invalid code format'),
  obraId: z.string().regex(/^[0-9a-f]{24}$/, 'Invalid obra ID format')
})
```

**Verification:**
- [ ] Coordinator schemas created with proper validation
- [ ] VerificationCode schemas created with strict validation
- - Code must match exactly 6 digits
- - Phone validation accepts international format
- - Email validation follows standard format
- [ ] All schemas exported and usable in API endpoints

---

### Task 4: Create TypeScript types

**File:** `/app/types/issue-reporting.ts`

**Requirements:**
- Must use relative imports
- Define interfaces matching Mongoose interfaces
- Export DTOs for API responses
- Include query parameter types
- Add helper types where useful

**Type Definitions:**
```typescript
// Coordinator types
export interface Coordinator {
  _id?: string
  obraId: string
  name: string
  cargo: string
  email: string
  phone: string
  smsEnabled: boolean
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CoordinatorCreate {
  obraId: string
  name: string
  cargo: string
  email: string
  phone: string
  smsEnabled?: boolean
  active?: boolean
}

export interface CoordinatorUpdate {
  name?: string
  cargo?: string
  email?: string
  phone?: string
  smsEnabled?: boolean
  active?: boolean
}

// VerificationCode types
export interface VerificationCode {
  _id?: string
  code: string
  email?: string
  phone?: string
  method: 'email' | 'sms' | 'both'
  expiresAt: Date
  verified: boolean
  obraId: string
  ipAddress?: string
  createdAt: Date
  updatedAt: Date
}

export interface VerificationCodeCreate {
  email?: string
  phone?: string
  method?: 'email' | 'sms' | 'both'
  obraId: string
  ipAddress?: string
}

export interface VerificationCodeValidate {
  code: string
  obraId: string
}

// API Response types
export interface CoordinatorResponse {
  success: true
  data: Coordinator
}

export interface VerificationCodeResponse {
  success: true
  data: VerificationCode
}

export interface CoordinatorListResponse {
  success: true
  data: Coordinator[]
}

export interface VerificationCodeResponse {
  success: true
  data: VerificationCode
}
```

**Verification:**
- [ ] All type definitions created
- [ ] Types exported and usable
- [ ] Matches Mongoose interfaces exactly
- [ - ] No `~` or `@` alias imports used
- [ ] Proper TypeScript types for all models

---

### Task 5: Create unit tests for models

**File:** `tests/models/coordinator.test.ts`

**Requirements:**
- Test CRUD operations for both models
- Test validation schemas
- Test index functionality
- Test TTL index (VerificationCode expiration)
- Test email uniqueness constraint
- Test phone validation regex
- Use test database to avoid polluting main database

**Test Cases:**
```typescript
// Coordinator model tests
- Create a coordinator with valid data
- Attempt to create coordinator with duplicate email (should fail)
- Create multiple coordinators for same obraId
- Update coordinator data
- Delete coordinator (soft delete via active: false)
- Test phone validation (valid vs invalid formats)
- Test cargo validation (min/max length)

// VerificationCode model tests
- Generate verification code (code should be 6 digits)
- Test expiration (code should be rejected after 15 minutes)
- Test code validation regex (rejects codes that are not 6 digits)
- Test uniqueness constraint (code + obraId must be unique)
- Test that expired codes cannot be used for verification
- Test that verified flag is properly set
- Test TTL index cleanup
```

**Verification:**
- [ ] All CRUD operations work correctly
- [ ] Validation errors throw appropriate errors
- [ ] Indexes function as expected
- [ ] Duplicate email constraint enforced
- [ ] TTL index automatically cleans up expired codes
- [ ] Phone validation accepts international format
- [ ] All tests pass with 100% coverage

---

## Success Criteria

- [ ] Coordinator model created with `obraId`, `name`, `cargo`, `email`, `phone`, `smsEnabled`, `active` fields
- [ ] VerificationCode model created with `code`, `email`, `phone`, `method`, `expiresAt`, `verified`, `obraId`, `ipAddress` fields
- [ ] Both models have proper indexes (obraId, email for Coordinator; code, obraId, expiresAt for VerificationCode)
- [ ] Zod schemas created for validation (create and update for Coordinator; create and validate for VerificationCode)
- [ ] TypeScript types exported and usable in stores/API
- [ ] Unit tests created and passing with 100% coverage

## Dependencies

**Existing files to reference:**
- `/server/models/Planes.ts` - For obraId reference structure
- `/app/stores/user.ts` - User store patterns
- `/app/schemas/qr.ts` - Zod schema patterns and existing validation patterns

**New files to create:**
- `/server/models/Coordinator.ts`
- `/server/models/VerificationCode.ts`
- `/server/schemas/coordinator.ts`
- `/server/schemas/verification.ts`
- `/app/types/issue-reporting.ts`
- `tests/models/coordinator.test.ts`

**Estimated Complexity:** Low to Medium
**Estimated Time:** 2-3 days for completion

---

*Last updated: 2025-01-17*