# Tasks: QR Codes for Safety Plans

**Input**: Design documents from `/specs/002-qr-codes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per feature specification, tests are NOT explicitly required. Integration tests will be added for critical user journeys.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `app/` at repository root (components, pages, stores, types, schemas)
- **Backend**: `server/` at repository root (api, models, services, utils, types)
- **Tests**: `tests/` at repository root (contract, integration, types)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency setup

- [ ] T001 Install new dependencies: qrcode and slugify packages via bun
- [ ] T002 [P] Add @types/qrcode for TypeScript support via bun
- [ ] T003 Verify existing dependencies: uuid (already in package.json)
- [ ] T004 Create directory structure: app/components/qr/, app/pages/public/planes/, server/services/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Create Zod validation schemas in app/schemas/qr.ts (PlanQR, UserQRSettings, QRGenerateOptions, QRSettingsUpdate, QRPublicAccessParams, all response types)
- [ ] T006 [P] Create client-side TypeScript types in app/types/qr.ts (QRCodeDisplay, QRSettings, QRPublicPlan, EXPIRATION_OPTIONS)
- [ ] T007 [P] Create server-side TypeScript types in server/types/qr.ts (PlanQRDocument, UserQRSettingsDocument, QRGenerateOptions, QRPublicAccessValidation, IQRService interface)
- [ ] T008 [P] Create QR code generation utility in server/utils/qr-generator.ts (generateQRCodeImage function using qrcode library)
- [ ] T009 [P] Create slug generation utility in server/utils/slug-generator.ts (generateSlug function using slugify with Spanish character support)
- [ ] T010 [P] Create QR service in server/services/qrService.ts (generateForPlan, regenerateForPlan, validatePublicAccess, getUserSettings, updateUserSettings methods)
- [ ] T011 Extend Plan model schema in server/models/Plan.ts with qrCode (embedded PlanQR) and qrEnabled (boolean) fields
- [ ] T012 Extend User model schema in server/models/User.ts with qrSettings (embedded UserQRSettings) field
- [ ] T013 Create MongoDB indexes for QR feature on planes collection (accessToken unique, expiresAt, planId)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - QR Code Generation and PDF Printing (Priority: P1) 🎯 MVP

**Goal**: Automatically generate QR codes when plans are created and embed them in the first page of PDFs

**Independent Test**: Create a new plan with auto-generate QR enabled → QR code generated automatically → Generate PDF → QR code visible in upper-right corner of first page with expiration date

### Tests for User Story 1

- [ ] T014 [P] [US1] Integration test for QR auto-generation flow in tests/integration/qr-generation.test.ts (create plan → verify QR generated → verify PDF embedding)
- [ ] T015 [P] [US1] Contract test for POST /api/planes/[id]/generate-qr endpoint in tests/contract/qr-api.test.ts (validate request/response schemas, error codes)
- [ ] T016 [P] [US1] TypeScript type validation test in tests/types/qr-types.test.ts (validate PlanQR, UserQRSettings types match Zod schemas)

### Implementation for User Story 1

- [ ] T017 [P] [US1] Create generate-qr.post.ts API endpoint in server/api/planes/[id]/generate-qr.post.ts (Zod validation, ownership check, QR generation via service)
- [ ] T018 [P] [US1] Create regenerate-qr.post.ts API endpoint in server/api/planes/[id]/regenerate-qr.post.ts (Zod validation, ownership check, QR regeneration with new token)
- [ ] T019 [US1] Extend planes store in app/stores/planes.ts with generateQRCode and regenerateQRCode methods (call API endpoints, update state)
- [ ] T020 [US1] Create useQRCode composable in app/composables/useQRCode.ts (generateQRCode, regenerateQRCode functions with loading/error states)
- [ ] T021 [US1] Create QRStatusBadge component in app/components/qr/QRStatusBadge.vue (display QR status, generate/regenerate buttons, QR preview)
- [ ] T022 [US1] Create QRPreview component in app/components/qr/QRPreview.vue (display QR code image, expiration date, copy URL button)
- [ ] T023 [US1] Integrate QRStatusBadge into plan detail view in app/pages/protected/planes/[id].vue (display badge, handle generate/regenerate actions)
- [ ] T024 [US1] Modify PDF generation in server/api/planes/[id]/generate-pdf.get.ts to embed QR code in first page (upper-right corner, explanatory text, expiration date)
- [ ] T025 [US1] Add QR auto-generation hook to plan creation flow in existing plan creation endpoint (check user.qrSettings.autoGenerate, call QR generation service)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Public Plan Access and Download (Priority: P2)

**Goal**: Enable public access to plans via QR codes with download functionality, no authentication required

**Independent Test**: Access public plan URL directly → Page loads without auth → Plan information displayed → Download button works → Expired QR shows error message

### Tests for User Story 2

- [ ] T026 [P] [US2] Integration test for public access flow in tests/integration/public-access.test.ts (valid QR → access plan, expired QR → error, download PDF)
- [ ] T027 [P] [US2] Contract test for GET /public/planes/[id]/[slug] endpoint in tests/contract/qr-api.test.ts (validate response schemas, expiration handling, error codes)
- [ ] T028 [P] [US2] Contract test for GET /public/planes/[id]/[slug]/download endpoint in tests/contract/qr-api.test.ts (validate PDF response, error handling)

### Implementation for User Story 2

- [ ] T029 [P] [US2] Create public plan access page in app/pages/public/planes/[id]/[slug].vue (no auth middleware, plan display, download button, expiration warning)
- [ ] T030 [US2] Create public plan access API endpoint in server/api/public/planes/[id]/[slug].get.ts (no auth, validate QR token/expiration, return plan data)
- [ ] T031 [US2] Create public PDF download API endpoint in server/api/public/planes/[id]/[slug]/download.get.ts (no auth, validate QR, return PDF buffer with proper headers)
- [ ] T032 [US2] Add expiration warning banner to public plan page in app/pages/public/planes/[id]/[slug].vue (show when < 7 days to expiration)
- [ ] T033 [US2] Implement error states for public access in app/pages/public/planes/[id]/[slug].vue (QR expired message, plan not found message, proper HTTP status codes)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - QR Configuration and Management (Priority: P3)

**Goal**: Provide user settings for QR configuration (base URL, auto-generate toggle, expiration days) and manual QR management

**Independent Test**: Access QR settings → View current settings → Update settings → Create new plan → Settings applied → Regenerate QR from plan detail → New token generated

### Tests for User Story 3

- [ ] T034 [P] [US3] Integration test for QR settings flow in tests/integration/qr-settings.test.ts (update settings → verify new plans use settings, regenerate QR)
- [ ] T035 [P] [US3] Contract test for GET /api/user/qr-settings endpoint in tests/contract/qr-api.test.ts (validate response schema, default values)
- [ ] T036 [P] [US3] Contract test for PUT /api/user/qr-settings endpoint in tests/contract/qr-api.test.ts (validate request schema, update logic, error handling)

### Implementation for User Story 3

- [ ] T037 [P] [US3] Create get-qr-settings API endpoint in server/api/user/qr-settings/index.get.ts (return user.qrSettings or defaults)
- [ ] T038 [P] [US3] Create update-qr-settings API endpoint in server/api/user/qr-settings/index.put.ts (Zod validation, update user.qrSettings, return updated settings)
- [ ] T039 [US3] Extend user store in app/stores/user.ts with getQRSettings and updateQRSettings methods (call API endpoints, cache settings)
- [ ] T040 [P] [US3] Create QRConfigForm component in app/components/qr/QRConfigForm.vue (base URL input, auto-generate toggle, expiration selector, save button)
- [ ] T041 [US3] Create QR settings page in app/pages/protected/settings/qr.vue (QRConfigForm integration, load/save logic, error handling)
- [ ] T042 [US3] Add QR settings tab to existing settings navigation in app/pages/protected/settings/index.vue (link to qr.vue, active state)
- [ ] T043 [US3] Integrate QR settings with plan creation flow in existing plan creation (read user.qrSettings.autoGenerate, call QR generation if true)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T044 [P] Add error handling for edge cases in QR service in server/services/qrService.ts (plan deleted, slug truncation, invalid base URL fallback)
- [ ] T045 [P] Add rate limiting consideration for public endpoints in server/api/public/planes/[id]/[slug].get.ts (document future enhancement, add basic throttling if needed)
- [ ] T046 [P] Update CLAUDE.md with QR feature documentation in CLAUDE.md (add QR section to architecture, new components, API endpoints)
- [ ] T047 [P] Run quickstart.md validation (test all examples in quickstart, verify URLs work, check file paths are correct)
- [ ] T048 Performance optimization: add database query indexes in server/models/Plan.ts (verify accessToken, expiresAt indexes are created)
- [ ] T049 Security validation: verify public endpoints don't expose sensitive data in server/api/public/planes/[id]/[slug].get.ts (audit response data, check for user info leakage)
- [ ] T050 Code cleanup: remove unused imports and console.logs in all new QR-related files
- [ ] T051 Accessibility review: ensure QR components have proper ARIA labels in app/components/qr/ (QRStatusBadge, QRPreview, QRConfigForm)
- [ ] T052 Add graceful degradation for PDF QR embedding in server/api/planes/[id]/generate-pdf.get.ts (wrap QR embedding in try-catch, continue PDF generation if QR fails)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Independent of US1 (public access works independently)
  - User Story 3 (P3): Can start after Foundational - Independent of US1/US2 (settings work independently)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1 (public access uses QR data but independently testable)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on US1/US2 (settings apply to new QR codes, independently testable)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (if following TDD)
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T001-T004)
- All Foundational tasks marked [P] can run in parallel (T005-T013)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel (e.g., T014-T016 for US1)
- API endpoints within a story marked [P] can run in parallel (e.g., T017-T018 for US1)
- Components within a story marked [P] can run in parallel (e.g., T021-T022 for US1)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Integration test for QR auto-generation flow in tests/integration/qr-generation.test.ts"
Task: "Contract test for POST /api/planes/[id]/generate-qr endpoint in tests/contract/qr-api.test.ts"
Task: "TypeScript type validation test in tests/types/qr-types.test.ts"

# Launch all API endpoints for User Story 1 together:
Task: "Create generate-qr.post.ts API endpoint in server/api/planes/[id]/generate-qr.post.ts"
Task: "Create regenerate-qr.post.ts API endpoint in server/api/planes/[id]/regenerate-qr.post.ts"

# Launch all components for User Story 1 together:
Task: "Create QRStatusBadge component in app/components/qr/QRStatusBadge.vue"
Task: "Create QRPreview component in app/components/qr/QRPreview.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T013) - CRITICAL
3. Complete Phase 3: User Story 1 (T014-T025)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

**MVP Deliverable**: QR codes auto-generate for plans, embed in PDFs, scannable and working

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T013)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T013)
2. Once Foundational is done:
   - Developer A: User Story 1 (T014-T025)
   - Developer B: User Story 2 (T026-T033)
   - Developer C: User Story 3 (T034-T043)
3. Stories complete and integrate independently

---

## Summary

**Total Tasks**: 52
**Tasks by User Story**:
- Setup: 4 tasks
- Foundational: 9 tasks
- User Story 1 (P1): 12 tasks (3 tests + 9 implementation)
- User Story 2 (P2): 8 tasks (3 tests + 5 implementation)
- User Story 3 (P3): 10 tasks (3 tests + 7 implementation)
- Polish: 9 tasks

**Parallel Opportunities**: 27 tasks marked [P] can run in parallel within their phases

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 25 tasks for functional QR code generation and PDF embedding

**Independent Test Criteria**:
- US1: Create plan → QR auto-generates → PDF includes QR in upper-right corner
- US2: Access public URL → Plan loads → Download works → Expired QR shows error
- US3: Update settings → Create plan → Settings applied → Regenerate works

**Format Validation**: All tasks follow the checklist format `- [ ] [ID] [P?] [Story?] Description with file path`

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are written as integration tests (not full TDD, but test critical journeys)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
