# Codebase Structure

**Analysis Date:** 2025-01-16

## Directory Layout

```
/home/mateu/NuxtsProjects/v9PLANESN4BUI4/
├── app/                     # Frontend Nuxt 3 application
│   ├── assets/             # Static assets (CSS, fonts)
│   ├── components/         # Vue components
│   ├── composables/        # Vue composables (reusable logic)
│   ├── layouts/            # Nuxt layout components
│   ├── middleware/         # Client-side route middleware
│   ├── pages/              # File-based routing pages
│   ├── plugins/            # Nuxt plugins
│   ├── schemas/            # Zod validation schemas
│   ├── stores/             # Pinia state management stores
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── app.config.ts       # Nuxt app configuration
│   ├── app.vue             # Root application component
│   └── error.vue           # Error page component
├── server/                 # Backend Nitro server
│   ├── api/                # API endpoints (88 files)
│   ├── assets/             # Server-side assets (fonts)
│   ├── middleware/         # Server middleware
│   ├── models/             # Mongoose database models
│   ├── scripts/            # Database seed/maintenance scripts
│   ├── services/           # Business logic services
│   ├── types/              # Server-side TypeScript types
│   ├── utils/              # Server utilities (db, auth, image, pdf)
│   └── vfs_fonts.js        # PDF font definitions (13MB)
├── content/                # Nuxt Content markdown files
├── public/                 # Static public files
├── .planning/              # Planning and analysis documents
├── specs/                  # Feature specifications
├── convert/                # Legacy conversion utilities
├── debug/                  # Debug utilities
├── port/                   # Portable utilities
├── nuxt.config.ts          # Nuxt framework configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── eslint.config.mjs       # ESLint configuration
└── CLAUDE.md               # Project documentation
```

## Directory Purposes

**app/:**
- Purpose: Frontend Nuxt 3 Vue application
- Contains: Pages, components, stores, composables, validation schemas, types
- Key files: `app.vue`, `stores/planes.ts`, `stores/user.ts`, `composables/useFormHandler.ts`

**server/:**
- Purpose: Backend Nitro server with API and database
- Contains: 88 API endpoints, 14 Mongoose models, services, middleware, utilities
- Key files: `api/planes.post.ts`, `models/Planes.ts`, `middleware/auth.ts`, `utils/db.ts`

**content/:**
- Purpose: Nuxt Content for marketing pages, documentation, blog
- Contains: Markdown files for docs, posts, pricing
- Configuration: `content.config.ts`

**app/components/:**
- Purpose: Reusable Vue components
- Contains: 45+ components including tables, modals, forms, QR components
- Key components: `TableBase.vue`, `ModalEditConcepto.vue`, `Memorias.vue`, `qr/QRConfigForm.vue`

**app/pages/:**
- Purpose: File-based routing pages
- Contains: Public pages, protected routes, admin pages
- Key routes: `index.vue`, `login.vue`, `protected/planes/[[id]]/*.vue`

**app/stores/:**
- Purpose: Pinia state management stores
- Contains: 8 stores for planes, user, conceptos, presupuestos, templates, masterTables
- Key stores: `planes.ts`, `user.ts`, `conceptos.ts`, `presupuestos.ts`

**server/api/:**
- Purpose: RESTful API endpoints
- Contains: 88 endpoint files organized by resource
- Organization: Resource-based directories (planes, conceptos, users, payments, auth, public)

**server/models/:**
- Purpose: Mongoose schema definitions
- Contains: 14 models for database entities
- Key models: `Planes.ts`, `User.ts`, `Concepto.ts`, `MasterTable.ts`

**app/schemas/:**
- Purpose: Zod validation schemas
- Contains: Runtime validation for forms and API requests
- Key schemas: `planes.ts`, `qr.ts`, `conceptos.ts`, `presupuestos.ts`

## Key File Locations

**Entry Points:**
- `/app/app.vue`: Root application component with SEO and layout wrapper
- `/app/pages/index.vue`: Homepage
- `/server/middleware/auth.ts`: API authentication middleware

**Configuration:**
- `/nuxt.config.ts`: Nuxt framework configuration (modules, runtime config, nitro aliases)
- `/package.json`: Dependencies (uses pnpm@10.11.0)
- `/tsconfig.json`: TypeScript configuration
- `/content.config.ts`: Nuxt Content collections configuration

**Core Logic:**
- `/app/stores/planes.ts`: Plan state management (1200+ lines)
- `/app/stores/user.ts`: User authentication and settings (300+ lines)
- `/server/api/planes.post.ts`: Plan creation endpoint
- `/server/api/planes/[id]/generate-pdf.get.ts`: PDF generation (70KB)
- `/server/models/Planes.ts`: Plan database schema

**Frontend Components:**
- `/app/components/DetallesGraficosComponent.vue`: Image gallery and S3 upload
- `/app/components/Memorias.vue`: Markdown editor with image insertion
- `/app/components/TableBase.vue`: Generic table component
- `/app/components/ModalEditConcepto.vue`: Concepto editing modal

**API Endpoints:**
- `/server/api/planes/`: Plan CRUD operations
- `/server/api/conceptos/`: Concepto management
- `/server/api/payments/`: Stripe payment processing
- `/server/api/auth/`: Authentication and OAuth
- `/server/api/public/planes/[id]/[slug]/`: Public QR access (no auth)

**Testing:**
- Not detected - No test files found in project

## Naming Conventions

**Files:**
- Components: PascalCase with `.vue` extension (`ModalEditConcepto.vue`, `TableBase.vue`)
- Composables: camelCase with `use` prefix and `.ts` extension (`useFormHandler.ts`, `useS3.ts`)
- Stores: camelCase with `.ts` extension (`planes.ts`, `user.ts`)
- Pages: lowercase with hyphens or bracket params (`index.vue`, `[[id]]/obra.vue`)
- API endpoints: kebab-case with HTTP method suffix (`planes.post.ts`, `[id].patch.ts`)

**Directories:**
- lowercase with hyphens for multi-word names (`protected/planes/[[id]]/`)
- Special: `[[id]]` for catch-all dynamic route parameters

**Types and Interfaces:**
- Interfaces: PascalCase (`IPlan`, `IUser`, `FeathersResponse<T>`)
- Type aliases: PascalCase (`Plan`, `User`, `AppSettings`)
- Zod schemas: camelCase (`planSchema`, `qrSettingsSchema`)

## Where to Add New Code

**New Feature (Frontend):**
- Primary code: `/app/pages/protected/[feature-name]/`
- Components: `/app/components/[FeatureName].vue`
- Store: `/app/stores/[featureName].ts`
- Schema: `/app/schemas/[featureName].ts`
- Types: `/app/types/[featureName].ts`

**New Feature (Backend):**
- API endpoints: `/server/api/[resource-name]/`
- Models: `/server/models/[ResourceName].ts`
- Services: `/server/services/[serviceName].ts`
- Types: `/server/types/[resourceName].ts`

**New Component/Module:**
- Implementation: `/app/components/[ComponentName].vue`
- Composable: `/app/composables/use[FeatureName].ts`
- Styles: `/app/assets/css/` (or scoped styles in component)

**Utilities:**
- Shared helpers (frontend): `/app/utils/[utilityName].ts`
- Shared helpers (backend): `/server/utils/[utilityName].ts`

**API Endpoints:**
- CRUD endpoints: `/server/api/[resource]/[method].ts` (e.g., `planes.post.ts`)
- Nested resources: `/server/api/[resource]/[id]/[action].[method].ts`
- Public endpoints: `/server/api/public/[resource]/...`

## Special Directories

**app/pages/protected/planes/[[id]]/:**
- Purpose: Plan-specific editing pages
- Contains: 11 section pages (obra, plan, contratista, promotor, tecnicos, partidas, presupuesto, impresion, dashboard, detalles-graficos)
- Route parameter: `[[id]]` is catch-all for plan ID

**server/api/public/planes/[id]/[slug]/:**
- Purpose: Public QR code access without authentication
- Contains: Plan view and PDF download endpoints
- Security: Token-based validation, expiration checking, enabled status

**app/components/qr/:**
- Purpose: QR code feature components
- Contains: QRConfigForm, QRPreview, QRStatusBadge components

**server/utils/:**
- Purpose: Shared backend utilities
- Contains: Database connection, authentication, email, image processing, QR generation, PDF generation
- Special: `vfs_fonts.js` is a 13MB font bundle for PDF generation

**content/:**
- Purpose: Nuxt Content for CMS-like functionality
- Configuration: Zod schemas defined in `/content.config.ts`
- Collections: docs, posts, pricing, index

**.planning/codebase/:**
- Purpose: Generated architecture analysis documents
- Generated: Yes (by GSD codebase mapper)
- Committed: Yes

**.nuxt/ and server/.nuxt/:**
- Purpose: Nuxt build output
- Generated: Yes
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: Dependencies
- Generated: Yes
- Committed: No (in .gitignore)

---

*Structure analysis: 2025-01-16*
