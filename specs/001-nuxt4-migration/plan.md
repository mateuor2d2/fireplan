# Implementation Plan: Directory-Based Nuxt 3 to Nuxt 4 Migration

**Branch**: `001-nuxt4-migration` | **Date**: December 1, 2025 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-nuxt4-migration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Primary requirement: Migrate construction safety management SaaS application from `v9planesN3Bui3` to new `v9PLANESN4BUI4` directory with Nuxt 4 upgrade while maintaining 100% functional compatibility and zero downtime.

Technical approach: Blue-Green directory copy strategy with shared MongoDB database, enabling parallel development and testing while preserving original repository integrity.

## Technical Context

**Language/Version**: TypeScript 5.9+ with Nuxt 3.18+ → Nuxt 4 migration
**Primary Dependencies**: Nuxt UI Pro v4, Vue 3, Pinia, Mongoose, Zod, pdfmake, Sharp, Stripe
**Storage**: MongoDB with Mongoose ODM (shared between directories), AWS S3 for file storage
**Testing**: Vitest for unit tests, integration tests for user journeys, contract tests for API validation
**Target Platform**: Web application (server-side rendering + client-side interactivity)
**Project Type**: Full-stack SaaS web application with directory-based migration
**Performance Goals**: API response <200ms, PDF generation <30s, image compression <500KB, 10x faster builds
**Constraints**: Legal compliance (RD 1627/1997), eIDAS signature compliance, multi-user data isolation, zero downtime migration
**Scale/Scope**: Construction safety plan management for 10k+ users with complex document generation
**Migration Strategy**: Blue-Green directory copy (`v9planesN3Bui3` → `v9PLANESN4BUI4`), 8-day timeline
**Critical Dependencies**: All external APIs (AWS S3, Stripe, Documenso) maintain compatibility during migration
**Database Continuity**: Shared MongoDB instance ensures zero data loss during migration

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

**Result**: ✅ PASSED - Directory-based migration approach maintains all constitutional requirements. Research confirms zero-risk strategy with shared database preserving all data integrity and compliance requirements.

## Project Structure

### Documentation (this feature)

```text
specs/001-nuxt4-migration/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── checklists/          # Quality validation checklists
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Directory Migration Structure

# Original Directory (v9planesN3Bui3) - Nuxt 3 - PRESERVED
/home/mateu/NuxtsProjects/v9planesN3Bui3/
├── pages/              # Auto-routed pages (Nuxt 3)
├── components/         # Vue components (Nuxt 3)
├── layouts/            # Layout components (Nuxt 3)
├── middleware/         # Route middleware (Nuxt 3)
├── stores/             # Pinia stores (shared)
├── server/             # API routes and models (shared)
└── Other files...      # Configuration and utilities

# Target Directory (v9PLANESN4BUI4) - Nuxt 4 - MIGRATION TARGET
/home/mateu/NuxtsProjects/v9PLANESN4BUI4/
├── app/                # New Nuxt 4 directory structure
│   ├── pages/          # Auto-routed pages (migrated)
│   ├── components/     # Vue components (migrated)
│   ├── layouts/        # Layout components (migrated)
│   ├── middleware/     # Route middleware (migrated)
│   ├── stores/         # Pinia stores (migrated)
│   └── utils/          # Utility functions (migrated)
├── server/             # API routes and models (copied and updated)
│   ├── api/            # 80+ API endpoints (upgraded for Nuxt 4)
│   ├── models/         # Mongoose schemas (preserved)
│   ├── services/       # Business logic (preserved)
│   └── utils/          # Server utilities (preserved)
└── tests/              # Test suites (copied and updated)
```

**Structure Decision**: Blue-Green directory migration approach preserving original Nuxt 3 functionality while enabling clean Nuxt 4 upgrade with shared database and external integrations.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
