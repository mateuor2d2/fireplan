# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**v9planesN3Bui3** is a comprehensive SaaS application for construction safety plan management, built as a Nuxt 3 application with Nuxt UI Pro. It provides a complete workflow for creating, managing, and generating safety plans for construction projects with compliance to Spanish construction law (RD 1627/1997).

## Architecture

### Tech Stack

- **Frontend**: Nuxt 3 with Vue 3, TypeScript
- **UI Framework**: Nuxt UI Pro with Tailwind CSS
- **State Management**: Pinia stores
- **Backend**: Nuxt server API with Nitro
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with OAuth (Google, GitHub)
- **File Storage**: AWS S3
- **Payments**: Stripe integration
- **Email**: Mailgun
- **Digital Signatures**: Documenso API integration for e-signatures
- **Package Manager**: bun 1.3.x (specified in package.json)
- **Image Processing**: Sharp for compression and optimization
- **PDF Generation**: pdfmake with custom HTML parsing

### Key Domain Areas

#### 1. Safety Plans (`/app/stores/planes.ts`)

- **Core Entity**: Construction safety plans (Planes)
- **Forms**: Multi-step form divided into 4 main sections:
  - Obra (Construction Project details)
  - Plan (Safety Plan details)
  - Contratista (Contractor information)
  - Promotor (Promoter information)
- **Features**: Partidas (work items), presupuestos (budgets), subcontratistas (subcontractors), technical staff (tec_obra), insurance (seguros_contratista)
- **Tree Structure**: Plans use a tree-based structure for organizing partidas by capitulos

#### 2. Concepts & Budget Management

- **Conceptos** (`/app/stores/conceptos.ts`): Reusable construction concepts/work items with user ownership
- **Presupuestos** (`/app/stores/presupuestos.ts`): Budget calculations and management
- **Master Tables** (`/app/stores/masterTables.ts`): Reference data for capitulos (chapters), riesgos (risks), etc.
- **Tree Partidas**: Hierarchical organization of conceptos by capitulos with filtering by user ownership

#### 3. Document Generation

- **Templates** (`/app/stores/templates.ts`): Document templates for safety plans
- **PDF Generation**: Server-side PDF creation using pdfmake with HTML parsing
- **Image Management**: S3 integration for image upload, compression, and storage with markdown support
- **Image Processing**: Automatic compression using Sharp, base64 conversion with validation
- **Printing**: Controlled printing with payment validation

#### 4. User Management

- **Authentication**: Multi-provider OAuth (Google, GitHub) + email/password
- **User Plans**: Plans are user-scoped with ownership validation
- **Payment Integration**: Stripe for plan purchases and subscriptions
- **Digital Signatures**: Documenso integration for legally binding electronic signatures
- **User Settings**: Individual persistence settings for capitulos and partidas per plan

## Development Commands

### Development (Use bun)

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Type checking
bun typecheck

# Linting
bun lint

# Build for production
bun build

# Preview production build
bun preview
```

**Note**: The project uses bun 1.3.x as the primary package manager (specified in package.json). Both bun.lockb and bun-lock.yaml are present.

### Environment Setup

Required environment variables (from `nuxt.config.ts:19-65`):

- `ME_CONFIG_MONGODB_URL` - MongoDB connection string (defaults to mongodb://localhost:27017/preveniusdbDev)
- `JWT_SECRET` - JWT signing secret
- `AWS_*` - AWS S3 configuration (region, access key, secret key, bucket name)
- `STRIPE_*` - Stripe keys (publishable key, secret key, webhook secret)
- `DOCUMENSO_*` - Documenso API configuration (API key, base URL, webhook secret)
- `GOOGLE_CLIENT_*` / `GITHUB_CLIENT_*` - OAuth credentials
- `API_KEY_MAILGUN` / `MG_DOMAIN` - Mailgun configuration
- `TWILIO_*` - Twilio configuration (SID, token, WhatsApp)
- `NUXT_PUBLIC_SITE_URL` - Public site URL (defaults to http://localhost:3000)

## Key File Structure

### Frontend (`/app/`)

- **Pages**: `/pages/protected/planes/` - Main plan management interface
- **Stores**: Pinia stores for state management (planes.ts, user.ts, conceptos.ts, etc.)
- **Composables**: 15+ reusable Vue composables (useFormHandler, useErrorHandler, useS3, etc.)
- **Schemas**: Zod validation schemas for forms
- **Types**: TypeScript type definitions
- **Components**: Generic table components, form components, tree components

### Backend (`/server/`)

- **API Routes**: 80+ RESTful endpoints under `/api/` with Zod validation
- **Models**: 15+ Mongoose schemas for MongoDB with TypeScript interfaces
- **Middleware**: Authentication and validation middleware
- **Services**: Business logic and external service integrations
- **Types**: TypeScript type definitions for API responses and database documents
- **Utils**: Database connection (`db.ts`), image processing, PDF generation

### Content Management

- **Nuxt Content**: `/content/` for marketing pages, docs, blog
- **Collections**: Defined in `/content.config.ts` with Zod schemas for docs, posts, pricing, index

## Common Development Patterns

### Plan Data Flow

1. **Creation**: Multi-step form collects obra, plan, contratista, promotor data
2. **Storage**: Saved to MongoDB via `/api/planes` endpoints
3. **Editing**: Plan-specific editing with validation
4. **Generation**: PDF generation with user-specific templates
5. **Printing**: Payment-gated printing with usage tracking

### Form Validation

- Uses Zod schemas for runtime validation
- Client-side validation with VeeValidate
- Server-side validation in API endpoints
- Type-safe form handling with TypeScript
- Custom form field composables (`useFormHandler`, `usePlanFormField`, `usePresupuestoFormField`)

### State Management

- **Planes Store**: Central state for current plan and plan list with reactive updates
- **User Store**: Authentication and user preferences with appSettings
- **Master Tables**: Shared reference data across plans
- **Conceptos/Presupuestos**: Reusable components for plan building
- **Reactive Updates**: All store methods properly handle Vue reactivity with array copies

### Component Architecture

- **Table Components**: Generic table components (`TableGenericDocPer`, `TableBase`, etc.) for CRUD operations
- **Form Components**: Reusable form components with validation
- **Tree Components**: Hierarchical tree components for partidas selection
- **Modal Components**: Edit/copy modals for various entities
- **Composables**: Custom hooks for common functionality (error handling, loading, S3, etc.)

## API Architecture

### RESTful Design

- 80+ API endpoints following REST patterns
- Consistent error handling and response format
- JWT-based authentication with OAuth providers
- Zod validation for all request/response schemas
- CSRF protection and security headers

### Authentication Middleware

- Server-side middleware (`/server/middleware/auth.ts`) for API protection
- Client-side middleware (`/app/middleware/auth.ts`) for route protection
- Token-based authentication with secure cookies
- Multi-provider OAuth integration (Google, GitHub)

## Database Schema

### Core Collections

- **planes**: Main safety plan documents
- **users**: User accounts with OAuth integration
- **conceptos**: Reusable construction concepts
- **mastertables**: Reference data (chapters, risks, etc.)
- **payments**: Stripe payment records
- **signatures**: Documenso signature records and workflow status
- **templates**: Document templates
- **userpresupuestosettings**: Individual user budget settings
- **capitulos**: Chapter definitions with user-specific titles

### Plan Document Structure

- Basic construction project details (nom_obra, desc_obra, dates)
- Safety plan specifications
- Contractor and promoter information (contratista, promotor)
- Work items (partidas) organized by chapters in tree structure
- Budget calculations (presupuesto, userPresupuesto)
- Technical staff (tec_obra) and subcontractor lists (subcontratistas)
- Insurance documentation (seguros_contratista)
- Graphic details (det_graf) and chapter descriptions (desc_cap_obra)
- User-specific data (userCapitulos, userPartidas, treePartidas)

## Image Processing & PDF Generation

### Recent Fixes (Critical)

- **Image Validation**: Added `validateImageForPdfmake()` function to validate base64 format and size limits
- **Image Compression**: Automatic compression using Sharp for images >200KB
- **Error Handling**: Comprehensive error tracking with context and fallback mechanisms
- **Base64 Conversion**: Enhanced validation and format checking for pdfmake compatibility

### Image Processing Pipeline

1. **Upload**: Images uploaded to S3 via DetallesGraficosComponent
2. **Compression**: Automatic compression for large images using Sharp
3. **Base64 Conversion**: Validated conversion with size limits (500KB max)
4. **HTML Generation**: Clean HTML structure for pdfmake parsing
5. **PDF Embedding**: Proper image placement with validation

### Key Functions

- `imageUrlToBase64()` in `/server/utils/imageUtils.ts`: Converts URLs to base64 with compression
- `validateImageForPdfmake()` in `/server/api/planes/[id]/generate-pdf.get.ts`: Validates images for PDF
- `compressImageToBase64()` in `/server/utils/imageCompression.ts`: Compresses and converts images

## Security Architecture

### Content Security Policy (CSP)

- Comprehensive CSP configuration in `nuxt.config.ts` with nonce support
- SRI (Subresource Integrity) enabled for external resources
- Strict security mode with CSRF protection
- Development and production-specific CSP rules

### Security Headers

- HSTS (HTTPS only in production)
- X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- Cross-Origin policies with S3 bucket whitelisting
- Permissions policy for camera, microphone, geolocation

### Data Protection

- User data isolation and ownership validation
- Secure cookie configuration with SameSite strict
- JWT token handling with secure HTTP-only cookies
- Environment-based security configuration

## Digital Signatures & Legal Compliance

### Documenso Integration

- **API Integration**: Plans can be sent for signature through Documenso after PDF generation
- **Legal Compliance**: All signatures are eIDAS compliant and legally binding in Spain/EU
- **Webhook Handling**: Configure `DOCUMENSO_WEBHOOK_SECRET` for signature status updates
- **Template Management**: Document templates are automatically synced with Documenso
- **RD 1627/1997 Compliance**: Full compliance with Spanish construction safety regulations

### Signature Workflow

1. Plan completion and PDF generation
2. Optional sending to Documenso for signature
3. Multi-party signing with legal validation
4. Real-time status updates via webhooks
5. Legally binding electronic signatures

## QR Codes for Public Plan Access

### Overview

QR codes enable public access to safety plans without requiring authentication. This feature allows stakeholders to view and download plans by scanning a QR code, with configurable expiration and access control.

### Components

- **QRConfigForm** (`/app/components/qr/QRConfigForm.vue`): Configuration form for QR settings
- **QRPreview** (`/app/components/qr/QRPreview.vue`): QR code display with expiration info and actions
- **QRStatusBadge** (`/app/components/qr/QRStatusBadge.vue`): Status badge showing QR code state
- **useQRCode** (`/app/composables/useQRCode.ts`): Composable for QR operations

### API Endpoints

#### User Settings
- `GET /api/user/qr-settings` - Get user's QR settings
- `PUT /api/user/qr-settings` - Update user's QR settings

#### QR Code Management
- `POST /api/planes/[id]/generate-qr` - Generate QR code for a plan
- `POST /api/planes/[id]/regenerate-qr` - Regenerate QR code with new token

#### Public Access (No Authentication)
- `GET /public/planes/[id]/[slug]` - Public plan access via QR code
- `GET /public/planes/[id]/[slug]/download` - Public PDF download via QR code

### User Settings

Users can configure QR code behavior in `/protected/settings/qr`:
- **autoGenerate**: Automatically generate QR codes when creating plans
- **baseUrl**: Base URL for public QR code links
- **expirationDays**: QR code validity period (30, 90, 180, 360, 720, 1080, or 1440 days)

### QR Code States

- **active**: QR code is valid and accessible
- **disabled**: QR code has been disabled by the user
- **expired**: QR code has passed its expiration date

### Database Schema

QR codes are embedded in the Plan document (`server/models/Planes.ts`):
```typescript
qrCode: {
  planId: ObjectId,
  slug: String,           // URL-friendly identifier
  accessToken: String,    // Unique access token (UUID)
  expiresAt: Date,        // Expiration timestamp
  qrCodeImage: String,    // Base64 PNG data URL
  enabled: Boolean,       // Access control flag
  createdAt: Date,
  updatedAt: Date
}
qrEnabled: Boolean        // Master switch for QR functionality
```

### Database Indexes

QR feature indexes for optimal query performance:
- `qrCode.slug` - For public plan lookups
- `qrCode.expiresAt` - For expiration queries
- `qrEnabled` - For filtering enabled plans
- `qrCode.accessToken` - Unique index for token validation

### Public Access Security

Public endpoints have built-in security:
- **No authentication required** - Access via QR code token only
- **Token validation** - QR slug and token must match
- **Expiration checking** - Expired QR codes return 410 Gone
- **Enabled checking** - Disabled QR codes return 403 Forbidden
- **Data filtering** - Only public-safe data is exposed (no user IDs, payment info, etc.)

### PDF Integration

QR codes are automatically embedded in generated PDFs:
- Displayed in upper-right corner of first page
- Includes expiration date
- Rendered as 80x80px image
- Gracefully degrades if QR data is missing

### Rate Limiting Considerations

Public endpoints should implement rate limiting (documented in code):
- Plan access: 100 requests/hour per IP
- PDF downloads: 20 downloads/hour per IP (stricter due to resource intensity)

## Important Technical Notes

- **Vue Reactivity**: When working with arrays in stores, always create new array references to trigger reactivity
- **Database Updates**: All store methods that modify data should make corresponding API calls
- **User Settings**: Respect individual user persistence settings for automatic saves
- **Error Handling**: Use the `useErrorHandler` composable for consistent error handling across the application
- **Image Management**: Images are uploaded to S3 and referenced by URL in markdown content
- **Tree Partidas**: The treePartidas array maintains the hierarchical structure of selected partidas by capitulo
- **PDF Images**: Recent fixes ensure images display correctly in PDFs through validation and compression
- **Package Manager**: Use bun for dependency management (bun@10.11.0)
- **Type Safety**: Comprehensive TypeScript usage with Zod validation schemas throughout

## Common Issues & Solutions

### Images Not Appearing in PDFs

- Check image URL validation in `validateImageForPdfmake()`
- Verify base64 format and size limits (500KB max)
- Ensure Sharp compression is working for large images
- Check console logs for detailed error messages

### Database Connection Issues

- Verify `ME_CONFIG_MONGODB_URL` environment variable
- Check MongoDB connection in `/server/utils/db.ts`
- Ensure proper error handling and retry logic

### Form Validation Errors

- Check Zod schemas in `/app/schemas/` directory
- Verify client-side VeeValidate integration
- Ensure server-side validation matches client-side

### Authentication Issues

- Check JWT_SECRET environment variable
- Verify cookie configuration in browser
- Ensure auth middleware is properly configured
- Check OAuth provider credentials

### CSP Violations

- Review CSP configuration in `nuxt.config.ts`
- Check browser console for CSP violation details
- Ensure all external resources are whitelisted
- Verify nonce generation for inline scripts

### Digital Signatures Integration

- **Documenso API**: Configure `DOCUMENSO_API_KEY` and `DOCUMENSO_BASE_URL` environment variables
- **Signature Workflows**: Plans can be sent for signature through Documenso after PDF generation
- **Legal Compliance**: All signatures are eIDAS compliant and legally binding in Spain/EU
- **Webhook Handling**: Configure `DOCUMENSO_WEBHOOK_SECRET` for signature status updates
- **Template Management**: Document templates are automatically synced with Documenso

## Active Technologies
- TypeScript 5.9+ with Nuxt 3.18+ + Nuxt UI Pro v4, Vue 3, Pinia, Mongoose, Zod, pdfmake, Sharp, Stripe (002-qr-codes)

- TypeScript 5.9+ with Nuxt 3.18+ → Nuxt 4 migration + Nuxt UI Pro (upgrade to v4), Vue 3, Pinia, Mongoose, Zod, pdfmake, Sharp, Stripe (001-nuxt4-migration)
- MongoDB with Mongoose ODM, AWS S3 for file storage (001-nuxt4-migration)
- TypeScript 5.9+ with Nuxt 3.18+ → Nuxt 4 migration + Nuxt UI Pro v4, Vue 3, Pinia, Mongoose, Zod, pdfmake, Sharp, Stripe (001-nuxt4-migration)
- MongoDB with Mongoose ODM (shared between directories), AWS S3 for file storage (001-nuxt4-migration)

## Recent Changes

- 002-qr-codes: QR code feature for public plan access
  - Public plan access and PDF download via QR codes (no auth required)
  - User-configurable QR settings (auto-generate, base URL, expiration)
  - QR code management components (QRConfigForm, QRPreview, QRStatusBadge)
  - Database indexes for optimal QR query performance
  - Security validation and rate limiting documentation
  - Accessibility improvements with proper ARIA labels
  - Code cleanup with console.log removal
  - Graceful degradation for PDF QR embedding
- 001-nuxt4-migration: Added TypeScript 5.9+ with Nuxt 3.18+ → Nuxt 4 migration + Nuxt UI Pro (upgrade to v4), Vue 3, Pinia, Mongoose, Zod, pdfmake, Sharp, Stripe
