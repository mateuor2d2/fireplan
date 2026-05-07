---
phase: 04-public-form
plan: 01
subsystem: api
tags: [zod, mongoose, typescript, issue-reporting, qr-codes, verification]

# Dependency graph
requires:
  - phase: 002-qr-codes
    provides: QR code infrastructure, issueQRService, validateIssueQRAccess function
  - phase: 001-nuxt4-migration
    provides: Nuxt 3 application, MongoDB connection, existing Issue model
provides:
  - Public API endpoint for anonymous issue submission via QR code
  - Zod validation schema for issue reporting data
  - VerificationCode model for email/SMS validation
  - Reference number generation utility with collision handling
  - TypeScript types for issue reporting system
affects: [05-coordinator-notifications, 06-coordinator-dashboard, 07-public-status-tracking]

# Tech tracking
tech-stack:
  added: [Zod validation, reference number generation, verification codes, public API endpoints]
  patterns: [Zod schema validation, UUID-based access tokens, sparse unique indexes, collision retry logic]

key-files:
  created:
    - app/schemas/issue-reporting.ts (Zod validation schemas)
    - server/utils/referenceNumber.ts (Reference number generator)
    - server/api/public/issue-report/submit.post.ts (Public submission endpoint)
    - server/models/VerificationCode.ts (Verification code model)
  modified:
    - app/types/issue-reporting.ts (Added public submission types)
    - server/models/Issue.ts (Added referenceNumber field)

key-decisions:
  - "Public submission accepts pre-uploaded photo URLs (not file uploads) - simplifies endpoint, delegates upload to client"
  - "Reference numbers use format INC-{YEAR}-{MONTH}-{RANDOM 6-CHAR} with uppercase characters excluding I/O for clarity"
  - "VerificationCode model uses TTL index for automatic cleanup after 15 minutes"
  - "Issue model uses sparse unique index on referenceNumber to allow null values while enforcing uniqueness"

patterns-established:
  - "Pattern: Zod schema validation with Spanish error messages for UX consistency"
  - "Pattern: Public API endpoints follow naming convention /api/public/{feature}/{action}"
  - "Pattern: All API errors use createError with statusCode, statusMessage, and message"
  - "Pattern: Collision handling with retry logic (max 5 attempts) for unique generation"

# Metrics
duration: 11min
completed: 2025-01-17
---

# Phase 04 Plan 01: Public API Endpoint Summary

**Anonymous issue submission endpoint with QR code validation, verification code checking, and unique reference number generation using Zod schemas and Mongoose models**

## Performance

- **Duration:** 11 minutes
- **Started:** 2025-01-17T17:53:53Z
- **Completed:** 2025-01-17T18:05:27Z
- **Tasks:** 5/5 completed
- **Files modified:** 6 files (4 created, 2 modified)

## Accomplishments

- **Public API endpoint** for anonymous issue submission via QR code with comprehensive validation
- **Zod validation schema** with Spanish error messages for consistent UX
- **VerificationCode model** with TTL-based auto-cleanup and GDPR-compliant phone storage
- **Reference number generator** with collision handling and format validation
- **Issue model enhancement** with referenceNumber field for public tracking

## Task Commits

Each task was committed atomically:

1. **Task 1: Add public submission types** - `db40cc3` (feat)
2. **Task 2: Create Zod validation schema** - `5aa28eb` (feat)
3. **Task 3: Create VerificationCode model** - `38a9ce6` (feat)
4. **Task 4: Implement reference number utility** - `e43ea00` (feat)
5. **Task 5: Create public submission endpoint** - `3abed25` (feat)

## Files Created/Modified

### Created Files

- `app/schemas/issue-reporting.ts` - Zod validation schemas for issue reporting
  - IssueReportSubmitSchema: Validates public submission data
  - PhotoUploadSchema, IssueLocationSchema: Nested validation
  - Response schemas: IssueReportResponseSchema, ErrorResponseSchema
  - Error codes: ISSUE_ERROR_CODES for consistent error handling

- `server/utils/referenceNumber.ts` - Reference number generation utility
  - generateReferenceNumber(): Creates unique references with collision retry
  - parseReferenceNumber(): Parses reference into components
  - isValidReferenceNumber(): Validates format
  - Format: INC-{YEAR}-{MONTH}-{RANDOM 6-CHAR}, excludes I/O for clarity

- `server/api/public/issue-report/submit.post.ts` - Public submission endpoint
  - Validates request body with Zod schema
  - Verifies QR access via validateIssueQRAccess()
  - Checks verification code (not expired, not used)
  - Generates reference number
  - Creates Issue document with "public-reporter" marker
  - Marks verification code as used

- `server/models/VerificationCode.ts` - Verification code model
  - 6-digit code (auto-generated)
  - Email/phone contact information
  - 15-minute expiration with TTL auto-cleanup
  - Verification status tracking
  - Indexes: unique (code + obraId), TTL on expiresAt

### Modified Files

- `app/types/issue-reporting.ts` - Added public submission types
  - IssueReportSubmit: Public submission data interface
  - PhotoUpload: Photo array item interface
  - IssueLocation: Structured location interface
  - IssueReportResponse: API response interface

- `server/models/Issue.ts` - Added referenceNumber field
  - Optional field with unique sparse index
  - Allows null values while enforcing uniqueness
  - Indexed for efficient lookups

## Decisions Made

1. **Photo upload via pre-uploaded URLs**: The public submission endpoint accepts photo URLs rather than handling file uploads directly. This simplifies the endpoint and delegates upload responsibility to the client (which will use a separate public upload endpoint in a future phase).

2. **Reference number format**: Uses INC-{YEAR}-{MONTH}-{RANDOM 6-CHAR} format with uppercase alphanumeric characters excluding I and O for clarity (they can be confused with 1 and 0).

3. **Sparse unique index on referenceNumber**: The Issue model uses a sparse unique index to allow null values while enforcing uniqueness on non-null values. This maintains backward compatibility with existing issues that don't have reference numbers.

4. **TTL index for verification code cleanup**: VerificationCode model uses a TTL index on expiresAt field to automatically delete expired codes after 15 minutes, preventing manual cleanup jobs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added referenceNumber field to Issue model**

- **Found during:** Task 4 (Reference number generation utility implementation)
- **Issue:** Issue model lacked referenceNumber field, which is essential for issue tracking and public status lookup. The generateReferenceNumber() function checks uniqueness in the Issue collection, but the field didn't exist.
- **Fix:** Added referenceNumber field to IIssue interface and IssueSchema:
  - Optional field (backward compatible)
  - Unique sparse index (allows null, enforces uniqueness on non-null)
  - Indexed for efficient queries
- **Files modified:** `server/models/Issue.ts`
- **Verification:** TypeScript compilation passes, field properly indexed in schema
- **Committed in:** `e43ea00` (Task 4 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Auto-fix was essential for correctness - referenceNumber field is required for the reference number generation utility to function properly. No scope creep.

## Issues Encountered

None - all tasks executed smoothly without unexpected issues.

## User Setup Required

None - no external service configuration required for this phase. All functionality uses existing infrastructure (MongoDB, existing QR service).

## Next Phase Readiness

### What's Ready

- **Public submission endpoint** is complete and ready for frontend integration
- **VerificationCode model** ready for email/SMS verification service implementation (Phase 2)
- **Reference number generation** ready for public status tracking (Phase 7)
- **Zod schemas** ready for client-side form validation

### Blockers/Concerns

- **Photo upload**: The current implementation accepts pre-uploaded photo URLs. A public S3 upload endpoint needs to be implemented before the form can handle photo uploads. This could be addressed in:
  - Phase 4 (Public Issue Reporting Form) - Create public upload endpoint
  - Phase 5 (Coordinator Notifications) - If photos need to be sent to coordinators

- **Verification code generation**: The endpoint validates verification codes but doesn't generate them. The email/SMS verification service (Phase 2) needs to be implemented to provide codes to users.

- **Error response testing**: The endpoint handles various error cases, but integration testing is needed to verify all error paths return appropriate responses.

### Recommendations

1. **Next immediate step**: Implement Phase 2 (Verification System) to provide email/SMS code generation and delivery
2. **Parallel development**: Phase 4 (Public Form) can be developed alongside Phase 2, using mock verification codes for testing
3. **Testing priority**: Integration tests should cover the full submission flow once verification codes are available

---

*Phase: 04-public-form*
*Plan: 01*
*Completed: 2025-01-17*
