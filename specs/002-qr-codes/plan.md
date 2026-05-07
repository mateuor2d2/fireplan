# Implementation Plan: QR Codes for Safety Plans

**Branch**: `002-qr-codes` | **Date**: 2025-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-qr-codes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a QR code system that enables public access to safety plans through scannable QR codes printed on PDFs. The system will auto-generate unique QR codes when plans are created, embed them in the first page of PDFs, and provide public access pages for viewing and downloading plans. Users can configure QR generation behavior, expiration dates, and base URLs through settings.

## Technical Context

**Language/Version**: TypeScript 5.9+ with Nuxt 3.18+
**Primary Dependencies**: Nuxt UI Pro v4, Vue 3, Pinia, Mongoose, Zod, pdfmake, Sharp, Stripe
**New Dependencies**: qrcode (QR code generation), slugify (URL-friendly slug generation)
**Storage**: MongoDB with Mongoose ODM, AWS S3 for file storage
**Testing**: Vitest for unit tests, integration tests for user journeys, contract tests for API validation
**Target Platform**: Web application (server-side rendering + client-side interactivity)
**Project Type**: Full-stack SaaS web application
**Performance Goals**: API response <200ms, PDF generation <35s (including QR rendering), QR generation <500ms
**Constraints**: Legal compliance (RD 1627/1997), eIDAS signature compliance, multi-user data isolation
**Scale/Scope**: Construction safety plan management with 10k+ users; QR codes must remain valid for up to 4 years

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Mandatory Compliance Gates

**✅ PASSED - All constitutional requirements met**

- **Safety-First Development**: QR codes provide access to safety plans but do not modify safety calculations or compliance data. No safety-critical changes required.
- **Legal Compliance by Design**: QR codes facilitate document access but do not alter document content. Existing RD 1627/1997 compliance maintained. Audit trail preserved through QR code creation/update timestamps.
- **Full-Stack TypeScript Integration**: All new code will use TypeScript with Zod validation at API boundaries. Type safety will extend from Vue components through stores to API routes to Mongoose models.
- **Document Generation Excellence**: QR code integration into PDF generation will follow existing pdfmake patterns. QR codes will be validated for size and format before embedding. Graceful degradation if QR data invalid.
- **Multi-User Data Isolation**: QR codes respect user ownership. Public access does not bypass ownership validation - plan ownership controls editing, public access controls viewing. Each user's QR settings are isolated.
- **Page-Component-Store-API Pattern**: Feature will follow strict architectural pattern:
  - Pages: Settings tab, public plan page, plan detail view
  - Components: QR configuration form, QR status badge, QR preview
  - Stores: Extended planes store with QR methods, extended user store with QR settings
  - API: QR generation endpoints, QR settings endpoints, public access endpoints
  - NO direct component-to-API communication
- **Architectural Compliance**: Pages orchestrate layout and routing, components encapsulate UI logic, stores manage state/business logic, API routes handle persistence and external integrations.

### Performance Requirements

- API response times under 200ms for core operations (QR generation, settings updates)
- PDF generation completion within 35 seconds (30s baseline + 5s for QR rendering)
- No image compression needed (QR codes are generated, not uploaded)

### Security Requirements

- JWT tokens using secure HTTP-only cookies (existing system)
- Public access pages do not require authentication (by design)
- QR code tokens (UUID v4) provide sufficient security for public access
- Expiration validation on public access prevents indefinite access
- CSRF protection enabled and CSP headers configured (existing system)

**Result**: ✅ PASSED - All constitutional requirements satisfied

## Project Structure

### Documentation (this feature)

```text
specs/002-qr-codes/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api-contract.md  # API endpoint specifications
│   └── schema-contract.md # Zod validation schemas
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Nuxt 4 Full-Stack Application (QR Codes Feature)

app/
├── components/
│   └── qr/
│       ├── QRConfigForm.vue           # QR settings configuration form
│       ├── QRStatusBadge.vue          # Display QR code status on plans
│       └── QRPreview.vue              # QR code preview component
├── composables/
│   └── useQRCode.ts                   # QR code generation composable
├── pages/
│   ├── protected/
│   │   └── settings/
│   │       └── qr.vue                 # QR settings page
│   └── public/
│       └── planes/
│           └── [id]/
│               └── [slug].vue         # Public plan access page
├── stores/
│   ├── planes.ts                      # Extended with QR methods
│   └── user.ts                        # Extended with QR settings
├── schemas/
│   └── qr.ts                          # Zod schemas for QR validation
└── types/
    └── qr.ts                          # TypeScript types for QR feature

server/
├── api/
│   ├── planes/
│   │   └── [id]/
│   │       ├── generate-qr.post.ts    # Generate QR code endpoint
│   │       └── regenerate-qr.post.ts  # Regenerate QR code endpoint
│   ├── user/
│   │   └── qr-settings/
│   │       ├── index.get.ts           # Get QR settings
│   │       └── index.put.ts           # Update QR settings
│   └── public/
│       └── planes/
│           └── [id]/
│               └── [slug].get.ts      # Public plan access endpoint
│               └── [slug]/
│                   └── download.get.ts # Public PDF download endpoint
├── models/
│   ├── Plan.ts                        # Extended with qrCode and qrEnabled
│   ├── User.ts                        # Extended with qrSettings
│   └── PlanQR.ts                      # New QR code model
├── services/
│   └── qrService.ts                   # QR code business logic
├── utils/
│   ├── qr-generator.ts                # QR code generation utility
│   └── slug-generator.ts              # Slug generation utility
└── types/
    └── qr.ts                          # Server-side QR types

tests/
├── contract/
│   └── qr-api.test.ts                 # API contract tests
├── integration/
│   ├── qr-generation.test.ts          # QR generation user journey
│   └── public-access.test.ts          # Public access user journey
└── types/
    └── qr-types.test.ts               # TypeScript type validation
```

**Structure Decision**: Nuxt 4 full-stack application with clear separation between client-side (app/) and server-side (server/) code, following constitutional requirements for TypeScript integration, multi-user data isolation, and page→component→store→api architectural pattern.

## Complexity Tracking

> **No constitutional violations - this section not applicable**

All features align with constitutional requirements. No additional complexity beyond standard patterns needed.

## Phase 0: Research & Technology Decisions

See [research.md](./research.md) for detailed research findings.

### Key Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| **qrcode library** | Mature, well-maintained, pure JavaScript, supports base64 output, no native dependencies | qrcode-terminal (CLI only), qr-image (less maintained) |
| **slugify library** | Widely used, supports Unicode/Spanish characters, customizable | Custom slug implementation (maintenance burden), slug (less features) |
| **UUID v4 for tokens** | Standard library (uuid), already in package.json, cryptographically random | NanoID (smaller but non-standard), custom implementation (security risk) |
| **Embedded QR in PDF** | pdfmake supports base64 images, maintains self-contained PDFs | External image references (breaks offline viewing) |
| **Public route without auth** | Nuxt allows route-specific middleware, public access by design | Protected routes with token passing (unnecessary complexity) |

## Phase 1: Data Model & API Contracts

See [data-model.md](./data-model.md) for complete data model and [contracts/](./contracts/) for API specifications.

### Entity Relationships

```
User (1:1) → UserQRSettings
Plan (1:1) → PlanQR
Plan (N:1) → User (ownership)
```

### API Endpoints

- `POST /api/planes/[id]/generate-qr` - Generate QR code for a plan
- `POST /api/planes/[id]/regenerate-qr` - Regenerate QR code (new token, extended expiration)
- `GET /api/user/qr-settings` - Get user QR settings
- `PUT /api/user/qr-settings` - Update user QR settings
- `GET /public/planes/[id]/[slug]` - Public plan access (no auth)
- `GET /public/planes/[id]/[slug]/download` - Public PDF download (no auth)

## Phase 2: Implementation Tasks

See [tasks.md](./tasks.md) - to be generated by `/speckit.tasks` command.

### Implementation Layers

Following the constitutional 5-layer pattern:

1. **Model Layer** - Extend Plan and User schemas, create PlanQR model
2. **Service Layer** - QR generation, slug generation, validation logic
3. **Store Layer** - Extend planes and user stores with QR methods
4. **Component Layer** - QR configuration form, status badge, preview
5. **Page Layer** - Settings page, public access page, plan detail integration

### Integration Points

- PDF generation: Modify `/server/api/planes/[id]/generate-pdf.get.ts` to embed QR codes
- Plan creation: Hook into existing plan creation flow for auto-generation
- User settings: Integrate QR settings into existing settings tab

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| QR code rendering breaks PDF generation | High | Graceful degradation, extensive testing with PDF generation |
| Public access bypasses ownership | Medium | Ownership validation still enforced for editing, public access only for viewing |
| QR code expiration confusion | Low | Clear messaging, warning banners for upcoming expiration |
| Slug collisions | Low | UUID token provides uniqueness, slug is for readability only |
| Performance degradation from QR generation | Low | QR generation is fast (<500ms), done once per plan |

## Success Metrics

From [spec.md](./spec.md):

- **SC-001**: Users can create a safety plan with an auto-generated QR code in under 30 seconds
- **SC-002**: QR codes are scannable by any standard QR scanner with 99% success rate
- **SC-003**: Public plan pages load in under 2 seconds without authentication
- **SC-004**: PDF generation with QR code completes within 35 seconds
- **SC-005**: 90% of users successfully configure QR settings without requiring support assistance
- **SC-006**: QR code URLs work correctly across all environments with 100% accuracy
- **SC-007**: Expired QR codes are properly blocked with clear messaging 100% of the time
- **SC-008**: Plan download from public page completes successfully in under 10 seconds

## Next Steps

1. Execute `/speckit.tasks` to generate detailed implementation task list
2. Execute `/mom.scaffold-entity` to create PlanQR model
3. Execute `/mom.implement-layer` for each of the 5 layers
4. Run integration tests and contract tests
5. Deploy to staging environment for validation
