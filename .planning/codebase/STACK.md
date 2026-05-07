# Technology Stack

**Analysis Date:** 2025-01-16

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code (frontend, backend, types)
- JavaScript (ES Modules) - Some Node.js utilities and legacy code

**Secondary:**
- Vue 3 Template Syntax - Component templates in `.vue` files
- Markdown - Content management (docs, blog posts)

## Runtime

**Environment:**
- Node.js (via Nuxt 3.18+ / Nuxt 4 compatibility mode)
- Bun 10.11.0 - Package manager and runtime (configured but not primary)

**Package Manager:**
- pnpm 10.11.0 - Primary package manager (specified in package.json)
- Lockfile: bun.lockb present but pnpm is configured
- Note: Package manager discrepancy - pnpm configured but bun lockfile exists

## Frameworks

**Core:**
- Nuxt 4.2.2 - Full-stack Vue framework (with Nuxt 3 compatibility mode)
- Vue 3 - Progressive JavaScript framework (implicit via Nuxt)
- Nuxt UI Pro 4.3.0 - UI component library with Tailwind CSS integration

**State Management:**
- Pinia 3.0.4 - Vue state management (via @pinia/nuxt 0.11.3)

**Content:**
- @nuxt/content 3.10.0 - File-based content management for docs/blog
- @nuxt/image 1.11.0 - Image optimization component

**Testing:**
- Not detected - No test framework configured or test files present

**Build/Dev:**
- Vite - Build tool (implicit via Nuxt 4)
- Nitro - Server engine (implicit via Nuxt)
- TypeScript Compiler (vue-tsc 2.2.12) - Type checking
- ESLint 9.39.2 - Linting (via @nuxt/eslint 1.12.1)

## Key Dependencies

**Critical:**
- Mongoose 8.21.0 - MongoDB ODM for database operations
- Zod 3.25.76 - Runtime type validation and schema definition
- pdfmake 0.2.23 - PDF generation for safety plans
- Stripe 18.5.0 - Payment processing (backend)
- @stripe/stripe-js 7.9.0 - Payment processing (frontend)

**Infrastructure:**
- @aws-sdk/client-s3 3.966.0 - AWS S3 integration for file storage
- @aws-sdk/s3-request-presigner 3.966.0 - S3 signed URL generation
- Sharp 0.34.5 - High-performance image processing and compression
- bcryptjs 3.0.3 - Password hashing
- jsonwebtoken 9.0.3 - JWT token generation/validation
- mailgun.js 12.6.0 - Email service integration
- qrcode 1.5.4 - QR code generation
- uuid 11.1.0 - Unique ID generation

**Authentication:**
- google-auth-library 9.15.1 - Google OAuth integration
- @googleapis/oauth2 1.0.7 - Google OAuth2 API
- @octokit/oauth-app 8.0.3 - GitHub OAuth integration

**Markdown/Parsing:**
- marked 16.4.2 - Markdown to HTML parser
- markdown-it 14.1.0 - Alternative markdown parser
- node-html-parser 7.0.2 - HTML parsing for PDF generation
- handlebars 4.7.8 - Template engine for PDF templates

**PDF/Document Generation:**
- pdfmake 0.2.23 - PDF document creation
- jspdf 3.0.4 - Client-side PDF generation
- html2canvas 1.4.1 - HTML to canvas conversion for PDFs

**Utilities:**
- slugify 1.6.6 - URL-friendly slug generation
- @vueuse/nuxt 13.9.0 - Vue composition utilities
- @standard-schema/spec 1.1.0 - Schema validation standard

**UI Components:**
- @nuxt/ui 4.3.0 - Nuxt UI Pro component library
- md-editor-v3 5.8.5 - Markdown editor component

**Three.js:**
- three 0.177.0 - 3D graphics library
- @types/three 0.177.0 - TypeScript definitions

**Metadata:**
- nuxt-og-image 5.1.13 - Open Graph image generation

**Development Tools:**
- TypeScript 5.9.3 - Static typing
- cross-env 10.1.0 - Cross-platform environment variables
- better-sqlite3 12.6.0 - SQLite database (present but usage not detected)

## Configuration

**Environment:**
- Configured via runtime config in `nuxt.config.ts`
- Environment variables loaded from `.env` file
- Key configs required: MongoDB, Stripe, AWS S3, Mailgun, OAuth (Google/GitHub)

**Build:**
- Nuxt configuration in `nuxt.config.ts`
- Vite build configuration with chunk splitting
- TypeScript config extends `.nuxt/tsconfig.json`
- ESLint configuration in `eslint.config.mjs`
- Content collections defined in `content.config.ts`

## Platform Requirements

**Development:**
- Node.js 18+ (required for Nuxt 4)
- pnpm 10.11.0 (configured package manager)
- MongoDB connection (local or remote)
- 8GB+ RAM recommended (NODE_OPTIONS=--max-old-space-size=8192 in scripts)

**Production:**
- Node.js server or serverless platform (Vercel, Netlify, AWS Lambda)
- MongoDB database (MongoDB Atlas recommended)
- AWS S3 bucket for file storage
- Stripe account for payments
- Mailgun account for emails
- OAuth provider credentials (Google, GitHub)

---

*Stack analysis: 2025-01-16*
