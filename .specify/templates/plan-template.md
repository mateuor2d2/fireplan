# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9+ with Nuxt 3.18+
**Primary Dependencies**: Nuxt UI Pro, Vue 3, Pinia, Mongoose, Zod, pdfmake, Sharp, Stripe
**Storage**: MongoDB with Mongoose ODM, AWS S3 for file storage
**Testing**: Vitest for unit tests, integration tests for user journeys, contract tests for API validation
**Target Platform**: Web application (server-side rendering + client-side interactivity)
**Project Type**: Full-stack SaaS web application
**Performance Goals**: API response <200ms, PDF generation <30s, image compression <500KB
**Constraints**: Legal compliance (RD 1627/1997), eIDAS signature compliance, multi-user data isolation
**Scale/Scope**: Construction safety plan management for 10k+ users with complex document generation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Mandatory Compliance Gates

**❌ CRITICAL: Project cannot proceed if any gate fails**

- **Safety-First Development**: Any feature affecting safety calculations, legal compliance, or risk assessment MUST have documented review process
- **Legal Compliance by Design**: Spanish construction law (RD 1627/1997) compliance MUST be validated; audit trails MUST be implemented
- **Full-Stack TypeScript Integration**: Type safety MUST extend end-to-end; Zod schemas MUST validate all boundaries
- **Document Generation Excellence**: PDF generation MUST be tested with various image types and sizes; templates MUST support construction terminology
- **Multi-User Data Isolation**: User scope validation MUST be enforced; tenant isolation MUST be implemented
- **Page-Component-Store-API Pattern**: All features MUST follow page→component→store→api pattern; direct component-to-API communication PROHIBITED
- **Architectural Compliance**: Pages orchestrate layout, components encapsulate UI logic, stores manage state/business logic, API routes handle persistence

### Performance Requirements

- API response times under 200ms for core operations
- PDF generation completion within 30 seconds
- Image compression optimization to under 500KB for PDF use

### Security Requirements

- JWT tokens using secure HTTP-only cookies
- S3 file access with signed URLs and expiration
- CSRF protection enabled and CSP headers configured

**Result**: [✅ PASSED / ❌ FAILED - specify which gates failed and justification]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Nuxt 3 Full-Stack Application (v9planesN3Bui3 Structure)
app/
├── components/          # Vue components
├── composables/         # Vue composables
├── pages/              # Auto-routed pages
├── stores/             # Pinia stores
├── schemas/            # Zod validation schemas
├── types/              # TypeScript type definitions
└── middleware/         # Route middleware

server/
├── api/                # API routes by domain
│   ├── planes/
│   ├── user/
│   ├── payments/
│   └── templates/
├── models/             # Mongoose schemas
├── services/           # Business logic
├── utils/              # Utility functions
├── middleware/         # Server middleware
└── types/              # Server type definitions

tests/
├── contract/           # API contract tests
├── integration/        # User journey tests
├── compliance/         # Legal compliance tests
└── types/              # TypeScript validation tests
```

**Structure Decision**: Nuxt 3 full-stack application with clear separation between client-side (app/) and server-side (server/) code, following constitutional requirements for TypeScript integration and multi-user data isolation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
