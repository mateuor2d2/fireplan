# Architecture

**Analysis Date:** 2025-01-16

## Pattern Overview

**Overall:** Nuxt 3 Full-Stack Application with Client-Server Separation

**Key Characteristics:**
- Nuxt 3 with Nitro server-side rendering and API routes
- Pinia for centralized state management
- MongoDB with Mongoose ODM for data persistence
- RESTful API design with JWT authentication
- Component-based Vue 3 composition API architecture
- Multi-step form workflow for safety plan creation

## Nuxt 4 Layer Pattern

**Request Flow Pattern:** Page → Component → Store → Services → Database

This layered architecture separates concerns and enables data flow in both directions (read/write operations).

```
┌─────────────────────────────────────────────────────────────────┐
│                         Page Layer                              │
│  Location: /app/pages/                                           │
│  Purpose: Route handlers, page-level logic, data loading        │
│  Examples: /app/pages/protected/planes/[[id]]/dashboard.vue     │
│           /app/pages/public/planes/[id]/[slug].vue                │
├─────────────────────────────────────────────────────────────────┤
│                       Component Layer                             │
│  Location: /app/components/                                       │
│  Purpose: Reusable UI components, presentation logic             │
│  Examples: ObraDashboard.vue, IssueReportForm.vue               │
│  Depends on: Stores for data, Composables for logic               │
│  Used by: Pages for composition                                  │
├─────────────────────────────────────────────────────────────────┤
│                        Store Layer                                │
│  Location: /app/stores/                                          │
│  Purpose: Centralized state management, API orchestration        │
│  Examples: planes.ts, user.ts, issues.ts                        │
│  Depends on: Server API layer for data persistence               │
│  Used by: Components for reactive data access                    │
├─────────────────────────────────────────────────────────────────┤
│                       Services Layer                                │
│  Location: /server/services/                                    │
│  Purpose: Business logic, external integrations, utilities       │
│  Examples: qrService.ts, verificationService.ts, issueQRService.ts│
│  Depends on: Models for data structures, external APIs            │
│  Used by: API routes for complex operations                    │
├─────────────────────────────────────────────────────────────────┤
│                      Database Layer                                │
│  Location: /server/models/ + MongoDB                             │
│  Purpose: Data persistence, schema definitions                   │
│  Examples: Planes.ts, Issue.ts, Coordinator.ts                  │
│  Depends on: MongoDB connection                                 │
│  Used by: Services and API routes for data operations           │
└─────────────────────────────────────────────────────────────────┘
```

**Read Flow (Page displays data):**
1. Page mounts → calls store method (e.g., `planesStore.fetchPlan(id)`)
2. Store → API endpoint (e.g., `GET /api/planes/[id]`)
3. API route → service layer (optional, for business logic)
4. Service/Model → Database query
5. Data flows back: Database → Service → API → Store → Component → Page

**Write Flow (Page modifies data):**
1. Component triggers store action (e.g., `issuesStore.updateStatus(id, status)`)
2. Store → API endpoint (e.g., `PATCH /api/issues/[id]/status`)
3. API route → service layer (validation, business logic)
4. Service → Model → Database update
5. Response flows back: Database → Service → API → Store → Component

## Layers

**Frontend Application Layer (`/app/`):**
- Purpose: Client-side Vue 3 application with Nuxt framework
- Location: `/app/`
- Contains: Pages, components, stores, composables, schemas, types
- Depends on: Server API layer for data persistence and business logic
- Used by: End users via web browser

**Server API Layer (`/server/`):**
- Purpose: Backend API with database access and external service integrations
- Location: `/server/`
- Contains: API endpoints, models, middleware, services, utilities
- Depends on: MongoDB database, external APIs (Stripe, S3, Mailgun, OAuth)
- Used by: Frontend application via HTTP requests

**Data Layer (`/server/models/`):**
- Purpose: Mongoose schema definitions and database models
- Location: `/server/models/`
- Contains: MongoDB schemas for User, Planes, Concepto, MasterTable, etc.
- Depends on: MongoDB database connection
- Used by: Server API layer for data operations

**State Management Layer (`/app/stores/`):**
- Purpose: Pinia stores for reactive client-side state
- Location: `/app/stores/`
- Contains: Stores for planes, user, conceptos, presupuestos, templates, masterTables
- Depends on: Server API layer for data persistence
- Used by: Components and pages for reactive data access

**Validation Layer (`/app/schemas/`):**
- Purpose: Zod validation schemas for runtime type checking
- Location: `/app/schemas/`
- Contains: Schemas for planes, conceptos, presupuestos, qr, memorias
- Depends on: Zod library
- Used by: Forms and API endpoints for data validation

## Data Flow

**Plan Creation Flow:**

1. User navigates to `/protected/planes` and clicks "Crear Plan"
2. Multi-step form collects data across 4 sections: obra, plan, contratista, promotor
3. Form validation via Zod schemas in `/app/schemas/planes.ts`
4. Data submitted via POST to `/api/planes` endpoint
5. Server validates request, creates Planes document in MongoDB
6. Response returns created plan with generated ID
7. Pinia store (`/app/stores/planes.ts`) updates local state
8. User redirected to plan-specific pages for detailed editing

**Plan Editing Flow:**

1. User opens plan via `/protected/planes/[id]/[section]`
2. Page fetches plan data via GET `/api/planes/[id]` or loads from store
3. User modifies data in section-specific forms (obra, plan, contratista, promotor, tecnicos, partidas, presupuesto)
4. Changes submitted via PATCH `/api/planes/[id]` or section-specific endpoints
5. Server updates MongoDB document and returns updated data
6. Store updates reactive state, triggering UI re-renders

**Authentication Flow:**

1. User submits credentials to `/api/auth/login` or OAuth via `/api/auth/google`/`/api/auth/github`
2. Server validates credentials, generates JWT token
3. Token stored in HTTP-only cookie (`auth_token`)
4. Server middleware (`/server/middleware/auth.ts`) validates token on protected routes
5. User context attached to event and accessible in API handlers
6. Client-side middleware (`/app/middleware/auth.ts`) protects routes
7. User store (`/app/stores/user.ts`) manages authentication state

**PDF Generation Flow:**

1. User requests PDF via `/protected/planes/[id]/impresion`
2. Plan data fetched from MongoDB with related templates and conceptos
3. Handlebars template selected based on user settings
4. Images processed and converted to base64 via `/server/utils/imageCompression.ts`
5. Template rendering with Handlebars compiles HTML
6. pdfmake generates PDF from compiled content
7. PDF returned to client for download/print

**QR Code Public Access Flow:**

1. Admin generates QR code via POST `/api/planes/[id]/generate-qr`
2. Server creates unique slug and access token, stores in plan document
3. QR code image generated and embedded in plan
4. Public accessed via GET `/public/planes/[id]/[slug]`
5. Server validates slug, token, expiration, and enabled status
6. Plan data returned (filtered for public safety)
7. PDF download via GET `/public/planes/[id]/[slug]/download`

**State Management:**

- **Reactive Updates:** Pinia stores use Vue reactivity with array copies for mutations
- **Persistence:** Store methods make corresponding API calls to sync with server
- **User Settings:** Individual user preferences (appSettings, qrSettings) stored in user document
- **Plan-specific Data:** Capitulos and partidas persisted per plan based on user settings

## Key Abstractions

**Plan Entity:**
- Purpose: Core business entity representing construction safety plans
- Examples: `/server/models/Planes.ts`, `/app/stores/planes.ts`, `/app/types/planes.ts`
- Pattern: Document-based schema with embedded sub-documents (contratista, promotor, qrCode)

**Concepto (Work Item):**
- Purpose: Reusable construction concepts/work items with user ownership
- Examples: `/server/models/Concepto.ts`, `/app/stores/conceptos.ts`
- Pattern: User-scoped entities that can be referenced across multiple plans

**Master Tables:**
- Purpose: Reference data for chapters (capitulos), risks (riesgos), and other lookups
- Examples: `/server/models/MasterTable.ts`, `/app/stores/masterTables.ts`
- Pattern: Key-value collections with user customization support

**Tree Partidas:**
- Purpose: Hierarchical organization of conceptos by capitulos
- Examples: Tree structure in `/app/stores/planes.ts`
- Pattern: Nested array structure with parent-child relationships

**Presupuesto (Budget):**
- Purpose: Budget calculations with user-specific settings
- Examples: `/server/models/PresupuestoDefault.ts`, `/app/stores/presupuestos.ts`
- Pattern: Per-item pricing with user overrides and global defaults

## Entry Points

**Application Root:**
- Location: `/app/app.vue`
- Triggers: Application initialization
- Responsibilities: Root component setup, SEO configuration, layout wrapper

**Public Pages:**
- Location: `/app/pages/index.vue`, `/app/pages/login.vue`, `/app/pages/pricing.vue`, etc.
- Triggers: Direct URL access or navigation
- Responsibilities: Marketing pages, authentication forms, public content

**Protected Plan Pages:**
- Location: `/app/pages/protected/planes/[[id]]/*.vue`
- Triggers: Navigation from plan list or direct URL
- Responsibilities: Plan editing interface across multiple sections (obra, plan, contratista, promotor, tecnicos, partidas, presupuesto, impresion)

**API Endpoints:**
- Location: `/server/api/**/*.ts`
- Triggers: HTTP requests from frontend
- Responsibilities: Data CRUD operations, authentication, external service integration

**Server Middleware:**
- Location: `/server/middleware/auth.ts`
- Triggers: All API requests
- Responsibilities: JWT validation, user authentication, route protection

**Public QR Access:**
- Location: `/app/pages/public/planes/[id]/[slug].vue`, `/server/api/public/planes/[id]/[slug]/`
- Triggers: QR code scan or direct link access
- Responsibilities: Public plan access without authentication

## Error Handling

**Strategy:** Centralized error handling with composable pattern

**Patterns:**
- **Client-side:** `/app/composables/useErrorHandler.ts` provides consistent error handling across components
- **Server-side:** try-catch blocks in API endpoints return structured error responses
- **Validation errors:** Zod schemas provide detailed validation error messages
- **Authentication errors:** 401 responses with redirect to login
- **Not found errors:** 404 responses for missing resources
- **Validation middleware:** Server-side validation in API endpoints before database operations

## Cross-Cutting Concerns

**Logging:** Console-based logging throughout server and client code

**Validation:**
- Client-side: Zod schemas with VeeValidate integration
- Server-side: Zod validation in API endpoints
- Database: Mongoose schema validation

**Authentication:**
- JWT tokens stored in HTTP-only cookies
- Server middleware for API protection
- Client middleware for route protection
- Multi-provider OAuth (Google, GitHub)

**Authorization:**
- User-scoped data ownership (createdBy field on plans)
- Admin-only routes protected by role checks
- Public QR access with token validation

**Image Processing:**
- Sharp compression for large images
- Base64 conversion for PDF embedding
- S3 storage for uploaded images

**Payment Integration:**
- Stripe for payment processing
- Payment-gated PDF generation
- Usage tracking and analytics

---

*Architecture analysis: 2025-01-16*
