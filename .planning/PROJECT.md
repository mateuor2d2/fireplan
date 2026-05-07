# v9planesN3Bui3 - Construction Safety Plan Management

## What This Is

A SaaS application for construction safety plan management. Users create, manage, and generate compliant safety plans (RD 1627/1997) for construction projects. The system includes QR code-based public issue reporting for workplace safety incidents.

**Currently building:** Stripe payment integration for paid plan creation and optional QR issue reporting subscriptions.

## Current Milestone: v1.1 Stripe Payments

**Goal:** Monetize safety plan creation with one-time payments and optional recurring subscriptions for QR issue reporting.

**Target features:**
- One-time payment flow before safety plan creation (pay-per-plan, flat price)
- Optional monthly subscription per plan for QR issue reporting access
- Stripe Checkout integration with payment confirmation
- Payment tracking and history per user

## Core Value

**Compliant safety plans, efficiently generated** — Users create legally compliant Spanish construction safety plans with optional real-time issue tracking.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

✓ Multi-user safety plan management system — existing
✓ QR code generation with access control — existing (002-qr-codes)
✓ MongoDB + Mongoose for data persistence — existing
✓ Pinia stores for state management — existing
✓ JWT authentication system — existing
✓ Public QR issue reporting form — existing (Phase 4)
✓ Public S3 upload endpoint — existing (Phase 4.3)
✓ Issues dashboard with routing — existing (Phase 4.1)

### Active

<!-- Current scope. Building toward these. -->

**v1.1 - Stripe Payments:**
- [ ] **Stripe Checkout integration** - Embedded checkout for one-time plan payments
- [ ] **Payment-before-creation flow** - User pays, then receives plan creation access
- [ ] **Plan pricing configuration** - Admin-configurable flat price per safety plan
- [ ] **Payment tracking model** - Track payments per user/plan with status
- [ ] **Optional QR subscription** - Monthly subscription per plan for issue reporting
- [ ] **Subscription management** - Activate/deactivate QR issue access per plan
- [ ] **Payment history** - User-facing payment and subscription history
- [ ] **Webhook handling** - Stripe webhook for payment/subscription events

**Remaining QR Issue Reporting (from v1.0):**
- [ ] **Email verification system** - Send 6-digit code via email server
- [ ] **SMS verification system** - Send 6-digit code via Twilio (admin-controlled)
- [ ] **Coordinator notification table** - Health & safety coordinators per work
- [ ] **Instant notification system** - Email/SMS to coordinators on new issues
- [ ] **Issue status tracking** - Public read-only view by reference number
- [ ] **Coordinator workflow** - Assign, update status, add comments, resolve

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Anonymous issue submission (security concern) — All submissions must be verified
- Direct issue creation without QR code (bypasses access control) — QR code only access
- User account creation for issue reporters — Verification + reference number is sufficient
- Two-way messaging between reporter and coordinators — Use existing comment system
- File upload validation beyond basic image types (photos only)
- Multi-language support — Spanish only initially
- Free plan creation without payment — v1.1 requires payment before creation
- Complex tiered pricing — Flat price per plan, subscription for QR add-on

## Context

**Technical Environment:**
- **Framework**: Nuxt 3 with Nuxt UI Pro, Vue 3 composition API, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **State**: Pinia stores
- **API**: RESTful endpoints with JWT auth
- **Payment**: Stripe (keys configured in environment)

**Existing Components:**
- `/app/stores/planes.ts` - Safety plan store with full CRUD
- `/app/stores/issues.ts` - Issue store with Photo and Comment interfaces
- `/server/models/Issue.ts` - Issue model (obraId, title, type, status, priority, photos, comments)
- `/server/api/issues/` - CRUD endpoints for issues (authenticated)
- `/server/api/planes/` - CRUD endpoints for safety plans
- `/app/pages/protected/planes/[id]/issues` - Issues dashboard page

**External Services (configured):**
- **Stripe** - Payments: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Twilio** - SMS verification: `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_WHATSAPP_FROM`
- **Mailgun** - Email service: `API_KEY_MAILGUN`, `MG_DOMAIN`
- **S3** - File storage: `AWS_*` environment variables

**Database Collections Existing:**
- **Users** - `{ email, passwordHash, name, role, ... }`
- **Planes** - Safety plan documents with obra, plan, contratista, promotor data
- **Issues** - Issue tracking with photos and comments
- **VerificationCodes** - `{ code, contact, expiresAt, verified, obraId, ipAddress }`

**Database Collections to Add (v1.1):**
- **Payments** - `{ userId, planId, stripePaymentIntentId, amount, status, type }`
- **Subscriptions** - `{ userId, planId, stripeSubscriptionId, status, currentPeriodEnd }`

## Constraints

**Technical:**
- **Nuxt 4 migration in progress** — Must work with Nuxt 3→4 migration path
- **TypeScript strict mode** — All new code must use proper typing
- **Relative path imports only** — No `~` or `@` aliases (Nuxt 4 requirement)
- **SSR-safe patterns** - Use `v-if` for modals, guard `window` usage with `process.client`

**Stripe:**
- **Payment flow security** - Never store full card details; use Stripe Checkout
- **Webhook verification** - Verify Stripe signature on all webhook events
- **Idempotency** - Handle duplicate webhook events gracefully
- **Error handling** - Graceful failure if Stripe API is unavailable

**Pricing:**
- **Flat pricing model** - Single price per safety plan (no complex tiers)
- **Subscription per plan** - QR issue reporting is subscribed per plan, not per user
- **Admin configuration** - Prices should be configurable by admin

**Security:**
- **Payment-before-creation** - Users cannot create plans without successful payment
- **Subscription enforcement** - QR issue access requires active subscription
- **Webhook security** - Only accept events from verified Stripe signatures

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Stripe Checkout over Elements | Simpler integration, PCI compliance handled by Stripe | Less custom UI but better security |
| Payment before creation | Guarantee revenue before service delivery | Better monetization but higher barrier |
| Per-plan QR subscription | Aligns revenue with actual usage | More complex billing but fairer pricing |
| Webhook for async events | Handle payment confirmations reliably | More complex than polling but necessary |

*Last updated: 2026-01-25 after starting Milestone v1.1 Stripe Payments*
