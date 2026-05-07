# External Integrations

**Analysis Date:** 2025-01-16

## APIs & External Services

**Authentication Providers:**
- Google OAuth - User authentication via Google accounts
  - SDK/Client: google-auth-library (9.15.1), @googleapis/oauth2 (1.0.7)
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Implementation: `/server/api/auth/google.get.ts`, `/server/api/auth/google/callback.get.ts`
- GitHub OAuth - User authentication via GitHub accounts
  - SDK/Client: @octokit/oauth-app (8.0.3)
  - Auth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - Implementation: `/server/api/auth/github.get.ts`, `/server/api/auth/github/callback.get.ts`

**Payment Processing:**
- Stripe - Payment collection and subscription management
  - SDK/Client: stripe (18.5.0) backend, @stripe/stripe-js (7.9.0) frontend
  - Auth: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Implementation: `/server/api/payments/`, `/server/utils/stripe.ts`
  - Webhook: `/server/api/payments/webhook.post.ts`

**Email Service:**
- Mailgun - Transactional email sending
  - SDK/Client: mailgun.js (12.6.0)
  - Auth: `API_KEY_MAILGUN`, `MG_DOMAIN`
  - Implementation: `/server/utils/email.ts`
  - Usage: Password reset emails, notifications

**Communication (Configured but Not Detected):**
- Twilio - SMS and WhatsApp messaging
  - Auth: `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_WHATSAPP_FROM`
  - Status: Configured in runtime config but no implementation detected

**Digital Signatures (Planned/Documented):**
- Documenso - Electronic signature integration
  - Auth: `DOCUMENSO_API_KEY`, `DOCUMENSO_BASE_URL`, `DOCUMENSO_WEBHOOK_SECRET` (documented but not detected in code)
  - Status: Referenced in specs but not implemented

## Data Storage

**Databases:**
- MongoDB - Primary document database
  - Connection: `ME_CONFIG_MONGODB_URL` (defaults to mongodb://localhost:27017/preveniusdbDev)
  - Client: Mongoose ODM (8.21.0)
  - Implementation: `/server/utils/db.ts`, `/server/models/`
  - Collections: planes, users, conceptos, mastertables, payments, templates, capitulos, issues, invoices, passwordResetTokens, paymentAnalytics, printingTemplate, userPresupuesto, userPresupuestoSettings

**SQLite (Present but Unused):**
- better-sqlite3 (12.6.0) - Included in dependencies but no usage detected

**File Storage:**
- AWS S3 - Cloud object storage for images and files
  - Region: `AWS_REGION` (defaults to eu-west-1)
  - Auth: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`
  - Implementation: `/server/api/services/s3.service.ts`, `/server/api/s3/`
  - Features: Upload, download, delete, signed URLs, listing

**Caching:**
- None - No dedicated caching layer detected

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication with OAuth providers
  - Implementation: `/server/utils/auth.ts`, `/server/api/auth/`
  - JWT secret: `JWT_SECRET` (defaults to "your-jwt-secret-key")
  - Token storage: HTTP-only cookies
  - OAuth flow: Google and GitHub OAuth2
  - Password hashing: bcryptjs with salt rounds of 10

## Monitoring & Observability

**Error Tracking:**
- None - No dedicated error tracking service (Sentry, etc.) detected

**Logs:**
- Console-based logging - Using console.log, console.error throughout codebase
- No centralized logging service detected

**Performance Monitoring:**
- None detected

## CI/CD & Deployment

**Hosting:**
- Not specified in configuration
- Compatible with: Vercel, Netlify, AWS Lambda, Node.js servers

**CI Pipeline:**
- None detected

**Build Configuration:**
- Nitro prerendering configured for homepage
- Route rules for static generation
- Source maps disabled in production builds

## Environment Configuration

**Required env vars:**
- `ME_CONFIG_MONGODB_URL` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `AWS_REGION` - AWS region (default: eu-west-1)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_BUCKET_NAME` - S3 bucket name
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification
- `API_KEY_MAILGUN` - Mailgun API key
- `MG_DOMAIN` - Mailgun domain
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `TWILIO_SID` - Twilio account SID (configured but unused)
- `TWILIO_TOKEN` - Twilio auth token (configured but unused)
- `TWILIO_WHATSAPP_FROM` - Twilio WhatsApp number (configured but unused)
- `NUXT_PUBLIC_SITE_URL` - Public site URL (default: http://localhost:3000)

**Secrets location:**
- `.env` file in project root
- Runtime configuration in `nuxt.config.ts`
- No secrets manager integration detected

## Webhooks & Callbacks

**Incoming:**
- Stripe Webhook - Payment status updates
  - Endpoint: `/server/api/payments/webhook.post.ts`
  - Secret: `STRIPE_WEBHOOK_SECRET`
  - Events: Payment intents, subscription updates
- Documenso Webhook - Signature status updates (documented but not implemented)
  - Secret: `DOCUMENSO_WEBHOOK_SECRET`
  - Status: Referenced in CLAUDE.md but not detected in code

**Outgoing:**
- None detected - No outgoing webhook system implemented

## Third-Party Libraries

**PDF Generation:**
- pdfmake - Server-side PDF creation with custom fonts
- jspdf - Client-side PDF generation
- html2canvas - HTML to canvas for PDF embedding

**QR Codes:**
- qrcode (1.5.4) - QR code generation for public plan access
  - Implementation: `/server/utils/qr-generator.ts`
  - Usage: Generate base64 PNG QR codes for public URLs

**Image Processing:**
- Sharp (0.34.5) - High-performance image compression
  - Implementation: `/server/utils/imageCompression.ts`
  - Usage: Compress images before PDF embedding

**Markdown Processing:**
- marked (16.4.2) - Markdown to HTML conversion
- markdown-it (14.1.0) - Alternative markdown parser
- md-editor-v3 (5.8.5) - Markdown editor component

**Template Engine:**
- handlebars (4.7.8) - PDF template rendering
  - Implementation: Referenced in `/server/api/planes/[id]/generate-pdf.get.ts`

**URL Utilities:**
- slugify (1.6.6) - URL-friendly slug generation
  - Implementation: `/server/utils/slug-generator.ts`
  - Usage: Generate QR code slugs for public URLs

**Utilities:**
- uuid (11.1.0) - Unique identifier generation
- bcryptjs (3.0.3) - Password hashing
- jsonwebtoken (9.0.3) - JWT token management

---

*Integration audit: 2025-01-16*
