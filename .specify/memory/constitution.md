<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0 (Added Page-Component-Store-API architectural pattern principle)
- Modified principles: None
- Added sections: Principle VI (Page-Component-Store-API Architecture Pattern)
- Removed sections: None
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md (Added architectural compliance gates)
  ✅ .specify/templates/spec-template.md (Added CR-008 through CR-010 for pattern compliance)
  ✅ .specify/templates/tasks-template.md (Added architectural compliance tasks T021-T025)
- Follow-up TODOs: None
-->

# v9planesN3Bui3 Constitution

## Core Principles

### I. Safety-First Development
All development MUST prioritize construction safety compliance and user wellbeing. Code changes affecting safety calculations, legal compliance, or risk assessment MUST undergo rigorous review. Spanish construction law (RD 1627/1997) compliance is non-negotiable and MUST be automatically validated where possible.

**Rationale**: Construction safety plans have legal implications affecting worker safety; errors can result in serious legal and safety consequences.

### II. Legal Compliance by Design
Every feature MUST consider Spanish construction regulations from inception. Data persistence MUST maintain audit trails for legal compliance. Digital signatures MUST be eIDAS compliant and legally binding. Document generation MUST produce legally valid safety plans.

**Rationale**: The system operates in a regulated legal environment where compliance failures can result in severe penalties and endanger workers.

### III. Full-Stack TypeScript Integration
TypeScript MUST be used consistently across frontend, backend, and database schemas. Type safety MUST extend from Vue components through API routes to MongoDB models. Zod schemas MUST validate all data boundaries. NO type assertions should bypass safety checks.

**Rationale**: Complex domain objects (safety plans, budgets, legal entities) require compile-time validation to prevent runtime errors that could affect compliance.

### IV. Document Generation Excellence
PDF generation MUST be reliable, image-aware, and template-driven. All images MUST be properly compressed and validated for pdfmake compatibility. Document templates MUST support multi-language construction terminology. Generated PDFs MUST be print-ready with proper pagination.

**Rationale**: Safety plans are legal documents that must be professionally formatted and include all necessary graphics and signatures.

### V. Multi-User Data Isolation
User data MUST be strictly segregated with ownership validation. All API endpoints MUST enforce user scope. Tenant isolation MUST be implemented at database and application levels. Cross-user data access MUST be prevented by design.

**Rationale**: Construction companies handle sensitive project and worker data that must remain confidential and segregated.

### VI. Page-Component-Store-API Architecture Pattern
All features MUST follow the page→component→store→api architectural pattern. Pages orchestrate layout and routing, components encapsulate reusable UI logic, stores manage state and business logic, and API routes handle data persistence and external integrations. Direct component-to-API communication is PROHIBITED; all data flow MUST go through stores. API routes MUST NOT directly manipulate UI state.

**Rationale**: This pattern ensures clear separation of concerns, testability, and maintainability in complex domain applications like construction safety management.

## Technical Standards

### Development Workflow
All code changes MUST follow test-driven development where feasible. Frontend components MUST be built with Nuxt UI Pro components. Backend API routes MUST use Zod validation schemas. Database operations MUST use Mongoose with proper indexing. All image processing MUST use Sharp for compression. Feature implementation MUST follow page→component→store→api pattern without exception.

### Performance & Reliability
API response times MUST be under 200ms for core operations. PDF generation MUST complete within 30 seconds. Image compression MUST optimize files to under 500KB for PDF use. S3 integration MUST handle file expiration and refresh automatically. Error handling MUST provide user-friendly messages without exposing system details.

### Security Requirements
JWT tokens MUST use secure HTTP-only cookies. S3 file access MUST use signed URLs with expiration. All user inputs MUST be sanitized and validated. CSRF protection MUST be enabled. CSP headers MUST be properly configured. Stripe integration MUST follow PCI compliance guidelines.

## Development Practices

### Code Organization
Frontend components MUST follow Vue 3 Composition API patterns. State management MUST use Pinia stores with proper reactivity. API routes MUST be organized by domain (planes, user, payments, etc). Database models MUST include TypeScript interfaces and proper validation.

### Testing Strategy
Integration tests MUST cover critical user journeys: plan creation, PDF generation, payment processing, and digital signatures. Contract tests MUST validate API schemas. Frontend components MUST have accessibility testing. PDF generation MUST be tested with various image types and sizes.

### Documentation Standards
All API endpoints MUST have OpenAPI documentation. Complex business logic MUST be documented inline. User-facing features MUST have help documentation. Database schema changes MUST be tracked with migration notes.

## Governance

This constitution supersedes all conflicting practices. Amendments require: (1) Impact analysis on existing features, (2) Update of dependent templates and documentation, (3) Version increment following semantic versioning, (4) Team review and approval.

All pull requests MUST verify constitutional compliance. Complexity MUST be justified with business value. Use CLAUDE.md for runtime development guidance. Constitution compliance MUST be checked in all analysis workflows.

**Version**: 1.1.0 | **Ratified**: 2025-12-01 | **Last Amended**: 2025-12-01