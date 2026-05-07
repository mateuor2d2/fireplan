# Feature Specification: QR Codes for Safety Plans

**Feature Branch**: `001-qr-codes`
**Created**: 2025-01-14
**Status**: Draft
**Input**: User description: "Feature: QR para Planes de Seguridad - Sistema de generación de códigos QR para acceso y descarga de planes de seguridad. Los planes serán accesibles públicamente mediante un QR impreso en la primera página."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - QR Code Generation and PDF Printing (Priority: P1)

As a safety plan creator, I want QR codes to be automatically generated and printed on my plan PDFs, so that anyone can quickly access the plan by scanning the code.

**Why this priority**: This is the core value proposition - without QR generation and printing, the feature provides no value. This story enables the primary use case of sharing plans via QR codes.

**Independent Test**: Can be fully tested by creating a new plan and verifying that:
1. A QR code is generated automatically
2. The QR code appears on the first page of the PDF in the upper-right corner
3. The QR code contains a valid URL
4. The QR code is scannable and at least 200x200px

**Acceptance Scenarios**:

1. **Given** a user creates a new safety plan with auto-generate QR enabled, **When** the plan is saved, **Then** a unique QR code is generated with a public URL and expiration date
2. **Given** a user generates a PDF for a plan with a QR code, **When** the PDF is viewed, **Then** the QR code is visible in the upper-right corner of the first page with expiration date below it
3. **Given** a user scans the QR code from a printed PDF, **When** they open the link, **Then** they are taken to the public plan page
4. **Given** a user has auto-generate QR disabled, **When** they create a plan, **Then** no QR code is generated until they manually trigger it

---

### User Story 2 - Public Plan Access and Download (Priority: P2)

As a person with a printed safety plan, I want to scan the QR code and access the plan online without logging in, so that I can view or download the digital version.

**Why this priority**: This enables the consumption side of the feature - people accessing plans via QR. Without this, the QR codes have nowhere to lead.

**Independent Test**: Can be fully tested by accessing a public plan URL directly and verifying that:
1. The page loads without authentication
2. Plan information is displayed
3. Download button works
4. Expiration status is shown

**Acceptance Scenarios**:

1. **Given** a user accesses a valid public plan URL, **When** the page loads, **Then** they see the plan preview with a download button (no authentication required)
2. **Given** a user accesses an expired QR code URL, **When** the page loads, **Then** they see an expiration message instead of the plan
3. **Given** a user clicks the download button on the public page, **When** the download completes, **Then** they receive the complete PDF of the safety plan
4. **Given** a QR code is nearing expiration (within 7 days), **When** the public page loads, **Then** a warning banner displays the expiration date

---

### User Story 3 - QR Configuration and Management (Priority: P3)

As a safety plan creator, I want to configure QR settings and manage existing QR codes, so that I can control how QR codes are generated and when they expire.

**Why this priority**: This provides flexibility and control but is not essential for basic functionality. Default settings work for most users.

**Independent Test**: Can be fully tested by accessing settings and verifying that:
1. QR settings can be viewed and modified
2. Base URL can be changed for different environments
3. Auto-generation can be toggled
4. Expiration period can be selected

**Acceptance Scenarios**:

1. **Given** a user accesses QR settings, **When** they view the settings, **Then** they see base URL, auto-generate toggle, and expiration selector
2. **Given** a user changes the base URL from localhost:3000 to previnius.io, **When** they save, **Then** new QR codes use the new base URL
3. **Given** a user disables auto-generate QR, **When** they create a new plan, **Then** no QR is generated automatically
4. **Given** a user selects 720 days (2 years) as expiration, **When** a new QR is generated, **Then** it expires 720 days from creation
5. **Given** a user has an existing plan with a QR code, **When** they view the plan detail, **Then** they see options to regenerate or disable the QR code

---

### Edge Cases

- What happens when a plan is deleted but the QR code is still valid? (The QR link should show a "plan not found" message)
- How does the system handle QR codes when a plan is duplicated? (A new QR code should be generated for the duplicate)
- What happens when the base URL configuration is invalid? (System should fall back to NUXT_PUBLIC_SITE_URL)
- How does the system handle very long plan names when generating slugs? (Slug should be truncated to reasonable length, e.g., 50 characters)
- What happens when a user tries to regenerate a QR code multiple times quickly? (System should enforce a minimum interval, e.g., 5 minutes)
- How does the system handle QR codes when a plan's ownership is transferred? (QR should remain valid; ownership affects editing, not public access)
- What happens when the configured base URL changes after QR codes have been generated? (Existing QR codes continue to work; new QRs use the new base URL)

## Requirements *(mandatory)*

### Functional Requirements

#### QR Code Generation

- **FR-001**: System MUST automatically generate a unique QR code when a new plan is created if auto-generate is enabled (default: true)
- **FR-002**: System MUST generate a URL-friendly slug from the plan name (nom_obra) for use in the public URL
- **FR-003**: System MUST generate a unique access token (UUID v4) for each QR code
- **FR-004**: System MUST calculate expiration date based on user's configured expiration days (default: 30 days)
- **FR-005**: System MUST generate QR code image in base64 format with minimum size of 200x200px
- **FR-006**: System MUST support manual QR code generation for existing plans without QR codes
- **FR-007**: System MUST support regenerating QR codes for existing plans (creates new token and extends expiration)

#### PDF Integration

- **FR-008**: System MUST print the QR code on the first page of generated PDFs when a valid QR code exists
- **FR-009**: QR code MUST be positioned in the upper-right corner of the first page
- **FR-010**: QR code MUST include explanatory text below it: "Escanea para acceder al plan"
- **FR-011**: QR code MUST display expiration date below the code in format: "Válido hasta: DD/MM/YYYY"
- **FR-012**: PDF generation MUST complete successfully even if QR code data is invalid or missing (graceful degradation)

#### Public Access

- **FR-013**: Public plan pages MUST be accessible without authentication
- **FR-014**: Public plan URL MUST follow pattern: `/public/planes/{planId}/{slug}`
- **FR-015**: System MUST validate QR code expiration before granting access
- **FR-016**: Expired QR codes MUST display expiration message with no plan access
- **FR-017**: Invalid or missing QR codes MUST display "plan not accessible" message
- **FR-018**: Public plan page MUST display key plan information (title, description, dates)
- **FR-019**: Public plan page MUST provide a prominent download button for the PDF
- **FR-020**: Public plan page MUST show expiration warning when within 7 days of expiration

#### Configuration

- **FR-021**: System MUST provide QR settings in user settings with base URL, auto-generate toggle, and expiration selector
- **FR-022**: Users MUST be able to configure base URL (default: NUXT_PUBLIC_SITE_URL)
- **FR-023**: Users MUST be able to toggle auto-generation on/off (default: on)
- **FR-024**: Users MUST be able to select expiration period from predefined options: 30, 90, 180, 360, 720, 1080, or 1440 days
- **FR-025**: System MUST fall back to NUXT_PUBLIC_SITE_URL if user-configured base URL is invalid
- **FR-026**: QR settings MUST apply to all newly generated QR codes for that user

#### Data Management

- **FR-027**: System MUST store QR code data including planId, slug, accessToken, expiresAt, qrCodeImage, and enabled flag
- **FR-028**: System MUST maintain QR code data when plans are updated (unless QR is manually regenerated)
- **FR-029**: System MUST support disabling QR codes without deleting the data
- **FR-030**: System MUST track creation and update timestamps for QR codes

### Constitutional Compliance Requirements

- **CR-001**: System MUST maintain user data isolation with ownership validation - QR codes respect user ownership
- **CR-002**: All safety-critical features MUST support Spanish construction law (RD 1627/1997) compliance
- **CR-003**: System MUST use TypeScript end-to-end with Zod validation at all boundaries
- **CR-004**: Document generation MUST produce legally valid safety plans with proper formatting
- **CR-005**: Digital signatures MUST be eIDAS compliant and legally binding
- **CR-006**: API response times MUST be under 200ms for core operations
- **CR-007**: PDF generation MUST complete within 30 seconds with proper image handling
- **CR-008**: Features MUST follow page→component→store→api architectural pattern
- **CR-009**: Direct component-to-API communication is PROHIBITED; all data flow MUST go through stores
- **CR-010**: API routes MUST NOT directly manipulate UI state

### Key Entities

- **PlanQR**: Represents the QR code data for a safety plan
  - planId: Reference to the associated Plan
  - slug: URL-friendly identifier derived from plan name
  - accessToken: Unique UUID token for accessing the plan
  - expiresAt: Timestamp when the QR code expires
  - qrCodeImage: Base64-encoded QR code image
  - enabled: Whether the QR code is active
  - createdAt/updatedAt: Timestamps for tracking

- **UserQRSettings**: Represents user preferences for QR code generation
  - userId: Reference to the user
  - baseUrl: Configurable base URL for QR codes (e.g., localhost:3000, previnius.io)
  - autoGenerate: Whether to automatically generate QR codes for new plans (default: true)
  - expirationDays: Number of days until QR code expiration (default: 30)
  - createdAt/updatedAt: Timestamps for tracking

- **Plan**: Existing safety plan entity (extended with QR fields)
  - qrCode: Reference to PlanQR data (nullable)
  - qrEnabled: Whether QR functionality is enabled for this plan (default: true)

- **User**: Existing user entity (extended with QR settings)
  - qrSettings: Reference to UserQRSettings (nullable)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a safety plan with an auto-generated QR code in under 30 seconds
- **SC-002**: QR codes are scannable by any standard QR scanner (smartphone camera, dedicated scanner) with 99% success rate
- **SC-003**: Public plan pages load in under 2 seconds without authentication
- **SC-004**: PDF generation with QR code completes within 35 seconds (within the 30-second baseline + 5 seconds overhead for QR rendering)
- **SC-005**: 90% of users successfully configure QR settings without requiring support assistance
- **SC-006**: QR code URLs work correctly across all environments (localhost, staging, production) with 100% accuracy
- **SC-007**: Expired QR codes are properly blocked with clear messaging 100% of the time
- **SC-008**: Plan download from public page completes successfully in under 10 seconds for typical plans (up to 50 pages)

## Assumptions

1. Users have access to QR code scanning capabilities (smartphone cameras or dedicated scanners)
2. The base URL (NUXT_PUBLIC_SITE_URL) is properly configured for each environment
3. Plans are primarily accessed and downloaded by users who have physical access to printed PDFs
4. Standard expiration periods (30-1440 days) cover all reasonable use cases
5. QR codes do not need to track access statistics or analytics (may be added later)
6. Public access does not require any form of authentication or tracking
7. Plan ownership remains with the creator regardless of who accesses it via QR code
8. PDF generation service has capacity to handle QR code rendering overhead
9. Slug generation from plan names produces sufficiently unique identifiers
10. UUID v4 provides sufficient uniqueness for access tokens

## Dependencies

### System Dependencies

- **Existing Plan Schema**: Must be extended to include qrCode and qrEnabled fields
- **Existing User Schema**: Must be extended to include qrSettings field
- **PDF Generation Service**: `/server/api/planes/[id]/generate-pdf.get.ts` must be modified
- **Plan Store**: `/app/stores/planes.ts` must be extended for QR management
- **User Store**: `/app/stores/user.ts` must be extended for QR settings

### External Dependencies

- **qrcode library**: For generating QR code images
- **uuid library**: For generating unique access tokens (already in package.json)
- **slugify library**: For generating URL-friendly slugs from plan names

### Environment Configuration

- **NUXT_PUBLIC_SITE_URL**: Must be configured for each environment (dev, staging, production)

## Out of Scope

The following features are explicitly out of scope for this implementation:

1. QR code access analytics or tracking (who scans, when, how many times)
2. QR code password protection or additional security layers
3. Bulk QR code generation or management
4. QR code customization (colors, logos, shapes)
5. Dynamic QR codes (where the target URL can be changed without regenerating)
6. QR code expiration notifications or reminders
7. Multi-language support for public plan pages (Spanish only in this iteration)
8. QR code sharing via email or social media (users can share the URL manually)
9. QR code preview during plan creation (shown only after plan is saved)
10. Advanced QR code features like vCard, calendar events, or other data formats

## Open Questions

None - all requirements have been specified with reasonable defaults based on industry standards and existing system patterns.
