# Roadmap: v9planesN3Bui3 - Construction Safety Plan Management

## Overview

**Milestone v1.1 Stripe Payments** — Monetize safety plan creation with one-time payments and optional recurring subscriptions for QR issue reporting.

This milestone transforms the application from free-to-use to a paid SaaS. Users pay a flat fee per safety plan and optionally subscribe monthly for QR issue reporting access. The payment system uses Stripe Checkout for PCI compliance, webhook-driven state updates for reliability, and server-side enforcement for security.

## Phases

**Phase Numbering:**
- Integer phases (1-6): QR Issue Reporting (v1.0 - SHIPPED)
- Integer phases (7-12): Stripe Payments (v1.1 - current)
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

## v1.1 Stripe Payments

- [x] **Phase 7: Database & API Foundation** - Create subscription and payment models with API endpoints ✅
- [x] **Phase 8: Webhook Infrastructure** - Implement Stripe webhook handlers with signature verification ✅
- [x] **Phase 9: Access Control & Security** - Enforce payment requirements and update CSP headers ✅
- [x] **Phase 10: Frontend Integration** - Build payment components and stores ✅
- [x] **Phase 11: Subscription Management** - Implement pause/resume/cancel and Customer Portal ✅
- [x] **Phase 12: Testing & Monitoring** - Test payment flows and set up monitoring ✅

## Phase Details

### Phase 7: Database & API Foundation
**Goal**: Create data models and API endpoints for payments and subscriptions
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: STAT-01, STAT-02, SUB-01, SUB-02, SUB-03
**Success Criteria** (what must be TRUE):
  1. Payment records can be created and retrieved from database
  2. Subscription records can be created with plan association
  3. API endpoints return proper payment/subscription data
  4. Annual pre-payment discount is supported in model
**Research**: Complete (HIGH confidence - 2025-01-25)
**Plans**: 3 plans in 3 waves
  - [x] 07-01-PLAN.md — Create Subscription model, types, and verify Payment model (Wave 1) ✅
  - [x] 07-03-PLAN.md — Add Stripe subscription helper utilities (Wave 2) ✅
  - [x] 07-02-PLAN.md — Create subscription API endpoints (Wave 3, uses helpers) ✅

### Phase 8: Webhook Infrastructure
**Goal**: Implement Stripe webhook handlers with signature verification
**Depends on**: Phase 7
**Requirements**: WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, WEB-08
**Success Criteria** (what must be TRUE):
  1. Stripe webhooks are received at `/api/webhooks/stripe`
  2. Webhook signature verification rejects unauthorized requests
  3. Payment success events update database correctly
  4. Subscription lifecycle events update status correctly
  5. Duplicate webhook events are handled idempotently
**Research**: Complete (HIGH confidence - 2026-01-26)
**Plans**: 3 plans in 3 waves
  - [x] 08-01-PLAN.md — Create webhook types and WebhookEvent logging model (Wave 1) ✅
  - [x] 08-02-PLAN.md — Create webhook endpoint with signature verification and idempotency (Wave 2) ✅
  - [x] 08-03-PLAN.md — Implement webhook event handlers for checkout, payments, subscriptions, and invoices (Wave 3) ✅

### Phase 9: Access Control & Security (UPDATED: Pay-to-Print Model)
**Goal**: Enforce payment before PDF generation while allowing free plan creation
**Depends on**: Phase 7, Phase 8
**Requirements**: PAY-01, PAY-02, PAY-02a, PAY-02b, SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SUB-04
**Success Criteria** (what must be TRUE):
  1. Users CAN create plans without payment (free to create and fill)
  2. Users CAN access plan creation form without payment
  3. PDF generation requires successful payment
  4. QR issue access requires active subscription
  5. CSP headers whitelist Stripe domains (js.stripe.com, checkout.stripe.com)
  6. All webhooks require signature verification (Phase 8 complete)
**Research**: Complete (HIGH confidence - 2026-01-26)
**Model**: Pay-to-Print (users create plans free, pay to generate PDF)
**Plans**: 3 plans in 3 waves
  - [x] 09-01-PLAN.md — Add payment check to PDF generation endpoint (Wave 1) ✅
  - [x] 09-02-PLAN.md — Create print button payment guard and subscription enforcement (Wave 2) ✅
  - [x] 09-03-PLAN.md — Update CSP headers for Stripe domains (Wave 3) ✅
**Completed:** 2026-01-27

### Phase 10: Frontend Integration
**Goal**: Build payment UI components and integrate Stripe Checkout
**Depends on**: Phase 7, Phase 9
**Requirements**: PAY-03, PAY-04, PAY-05, STAT-03
**Success Criteria** (what must be TRUE):
  1. Users see Stripe Checkout for payment initiation
  2. Payment status displays with visual badges (✅ Paid, ⏳ Pending, ❌ Failed)
  3. Successful payment redirects to plan creation form
  4. Checkout includes plan metadata (user, plan name)
**Research**: Complete (HIGH confidence - 2026-01-27)
**Model**: Pay-to-Print (users create plans free, pay to generate PDF)
**Plans**: 6 plans in 3 waves
  - [x] 10-01-PLAN.md — Payment status endpoint (GET /api/payments/status/[planId]) (Wave 1) ✅
  - [x] 10-02-PLAN.md — Stripe Checkout session creation (POST /api/payments/create-checkout) (Wave 1) ✅
  - [x] 10-03-PLAN.md — PaymentStatusBadge component (Wave 2) ✅
  - [x] 10-04-PLAN.md — Payment page with Stripe Checkout redirection (Wave 2) ✅
  - [x] 10-05-PLAN.md — Enhanced usePaymentGuard with real API integration (Wave 3) ✅
  - [x] 10-06-PLAN.md — Return URL handling and post-payment flow (Wave 3) ✅
**Completed:** 2026-01-27

### Phase 11: Subscription Management
**Goal**: Implement subscription lifecycle management and Customer Portal
**Depends on**: Phase 7, Phase 8, Phase 10
**Requirements**: MGMT-01, MGMT-02, MGMT-03, MGMT-04, METH-01, METH-02
**Success Criteria** (what must be TRUE):
  1. Users can pause subscriptions with `pause_collection` behavior
  2. Users can resume paused subscriptions
  3. Users can cancel subscriptions at period end (not immediate)
  4. Cancellation date and access period are clearly shown
  5. Users can update payment methods via Stripe Customer Portal
**Research**: Complete (HIGH confidence - 2026-01-27)
**Plans**: 8 plans in 3 waves
  - [x] 11-01-PLAN.md — Pause/Resume API endpoints with Stripe pause_collection (Wave 1) ✅
  - [x] 11-02-PLAN.md — Cancel/Re-subscribe API endpoints (Wave 1) ✅
  - [x] 11-03-PLAN.md — Customer Portal session creation (Wave 1) ✅
  - [x] 11-04-PLAN.md — SubscriptionCard GET endpoint, component, and useSubscription composable (Wave 2) ✅
  - [x] 11-05-PLAN.md — PauseDialog and CancelConfirmDialog components (Wave 3) ✅
  - [x] 11-06-PLAN.md — Integration into plan details page (Wave 3) ✅
  - [x] 11-07-PLAN.md — Fix Customer Portal integration with openPortal method (Wave 3) ✅
  - [x] 11-08-PLAN.md — Verify resume subscription wiring (Wave 3) ✅
**Completed:** 2026-02-12

### Phase 12: Testing & Monitoring
**Goal**: Test payment flows and set up monitoring for reliability
**Depends on**: Phase 8, Phase 11
**Requirements**: DUNN-01, DUNN-02, DUNN-03, DUNN-04, DUNN-05, HIST-01, HIST-02, HIST-03
**Success Criteria** (what must be TRUE):
  1. Failed payments trigger Stripe Smart Retries
  2. Payment failures send email notifications via Mailgun
  3. 7-day grace period maintains service access during retries
  4. Users can view payment history with filters
  5. Users can download invoice PDFs via Stripe-hosted URLs
**Research**: Complete (HIGH confidence - 2026-02-14)
**Plans**: 6 plans in 3 waves
  - [x] 12-01-PLAN.md — Invoice PDF download endpoint (Wave 1) ✅
  - [x] 12-02-PLAN.md — Payment failure email notifications (Wave 1) ✅
  - [x] 12-03-PLAN.md — Payment history filters (Wave 1) ✅
  - [x] 12-04-PLAN.md — Subscription access grace period helper (Wave 1) ✅
  - [x] 12-05-PLAN.md — Webhook handler for invoice failures (Wave 2) ✅
  - [x] 12-06-PLAN.md — Add hosted_invoice_url to invoice history (Gap Closure) (Wave 3) ✅
**Completed:** 2026-02-19

### Phase 12.1: Fix Render deployment issues - deep analysis and refactor (INSERTED)

**Goal:** Fix Render deployment configuration to prevent build failures, memory exhaustion, and missing environment variables
**Requirements**: RND-01, RND-02, RND-03, RND-04
**Depends on:** Phase 12
**Success Criteria** (what must be TRUE):
  1. Build completes without OOM errors on Render
  2. App starts and passes health check
  3. All environment variables are configured in render.yaml
  4. Deployment succeeds on Render
**Research:** Complete (HIGH confidence - 2026-02-25)
**Plans:** 1/1 plans complete
  - [ ] 12.1-01-PLAN.md — Fix Render deployment config (Wave 1)

Plans:
- [ ] 12.1-01-PLAN.md — Create .node-version, update render.yaml with memory optimization and Mailgun env vars (Wave 1)

### Phase 13: Password Restoration (URGENT)
**Goal**: Implement forgot password flow with email reset tokens
**Depends on**: Phase 2 (User Profile Settings)
**Requirements**: USR-04, USR-05
**Success Criteria** (what must be TRUE):
1. Users can request password reset via email link
2. Reset tokens expire after 1 hour
3. Password reset form validates new password strength
4. Users regain access after successful reset
5. Security measures prevent token abuse
**Research**: Complete (FEATURE ALREADY IMPLEMENTED - 2026-02-12)
**Plans**: 2 plans in 2 waves
   - [x] 13-01-PLAN.md — Create dedicated forgot-password page (Wave 1) ✅
   - [x] 13-02-PLAN.md — Add forgot password link to Perfil settings (Wave 2) ✅
**Completed:** 2026-02-12

## v1.0 QR Issue Reporting (Completed)

<details>
<summary>✅ v1.0 QR Issue Reporting - SHIPPED</summary>

### Phase 1: Database & Models (Foundational)
**Goal**: Establish data structures for coordinators and verification codes
**Plans**: Complete

### Phase 00: Verification System (Email & SMS)
**Goal**: Implement email and SMS verification services
**Depends on**: Nothing (infrastructure already configured)
**Requirements**: VER-01, VER-02, VER-03, VER-04, VER-05
**Success Criteria** (what must be TRUE):
  1. Users can request verification code via email
  2. Users can request verification code via SMS
  3. Codes are validated with 15-minute expiration
  4. Frontend verification form with resend option
  5. Spanish error messages throughout
**Research**: Complete (HIGH confidence - 2026-02-10)
**Plans**: 4 plans in 4 waves
  - [x] 00-01-PLAN.md — Install Twilio and verify backend setup (Wave 1) ✅
  - [x] 00-02-PLAN.md — Create useVerification composable (Wave 2) ✅
  - [x] 00-03-PLAN.md — Create VerificationForm and integrate (Wave 3) ✅
  - [x] 00-04-PLAN.md — Test and document verification system (Wave 4) ✅

### Phase 2: User Profile Settings
**Goal**: Implement user profile management (perfil), password change (contraseña), and QR codes management (codigos qr) tabs
**Depends on**: Phase 1
**Requirements**: USR-01, USR-02, USR-03
**Success Criteria** (what must be TRUE):
  1. Users can view and edit their profile information (nombre, email, telefono)
  2. Users can change their password with validation
  3. Users can manage their QR codes (list, regenerate, disable)
  4. All tabs use Nuxt UI v4 components with Spanish localization
  5. Settings menu navigation works correctly
**Research**: Complete (HIGH confidence - 2026-02-11)
**Plans**: 3 plans in 2 waves
  - [ ] 02-01-PLAN.md — Create perfil.vue page with user profile form (Wave 1) 🆕
  - [ ] 02-02-PLAN.md — Create contrasena.vue page with password change form (Wave 1) 🆕
  - [ ] 02-03-PLAN.md — Create codigos-qr.vue page with QR list and useQRList composable (Wave 2) 🆕

### Phase 3: Public QR Code Access
**Goal**: Generate QR codes that lead to public issue forms
**Plans**: Complete

### Phase 4: Public Issue Reporting Form
**Goal**: Create anonymous-accessible form for issue submission
**Plans**: Complete

### Phase 4.1: Fix Issues Dashboard Routing (INSERTED)
**Goal**: Fix routing and navigation issues for the issues dashboard
**Plans**: Complete ✅

### Phase 4.2: Add Issues Icon to ElementBase (INSERTED)
**Goal**: Add issues dashboard access button to ElementBase
**Plans**: TBD

### Phase 4.3: Allow Non-Logged Users to Create Issues via QR (INSERTED)
**Goal**: Enable anonymous users to create issues through QR code access
**Plans**: TBD

### Phase 5: Coordinator Notification System
**Goal**: Instantly notify coordinators of new issues
**Plans**: Complete

### Phase 6: Coordinator Dashboard Integration
**Goal**: Allow coordinators to manage issues without authentication barrier
**Plans**: Complete

</details>

## Progress

**Execution Order:**
v1.0: Phase 00 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
v1.1 (COMPLETE): Phase 7 → 8 → 9 → 10 → 11 → 12 → 13 ✅

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 00. Verification System | 4/4 | Complete    | 2026-03-20 | - |
| 1. Database & Models | v1.0 | TBD | Not started | - |
| 2. User Profile Settings | v1.0 | 3/3 | Complete | 2026-02-11 |
| 3. Public QR Code Access | v1.0 | TBD | Not started | - |
| 4. Public Issue Reporting Form | v1.0 | TBD | Not started | - |
| 5. Coordinator Notification System | v1.0 | TBD | Not started | - |
| 6. Coordinator Dashboard Integration | v1.0 | TBD | Not started | - |
| 7. Database & API Foundation | v1.1 | 3/3 | Complete | 2026-01-25 |
| 8. Webhook Infrastructure | v1.1 | 3/3 | Complete | 2026-01-26 |
| 9. Access Control & Security | v1.1 | 3/3 | Complete | 2026-01-27 |
| 10. Frontend Integration | v1.1 | 6/6 | Complete | 2026-01-27 |
| 11. Subscription Management | v1.1 | 8/8 | Complete | 2026-02-12 |
| 12. Testing & Monitoring | v1.1 | 6/6 | Complete | 2026-02-19 |
| 12.1. Render Deployment Fix | 1/1 | Complete   | 2026-03-02 | - |
| 13. Password Restoration | v1.1 | 2/2 | Complete | 2026-02-12 |
| 14. Deployment Optimization | 7/7 | Complete    | 2026-03-03 | - |

---

## Phase 14: Deployment Optimization

**Goal**: Reduce bundle size from 1.6GB node_modules / 71MB server to <800MB / <30MB
**Depends on**: Phase 12.1 (Vercel deployment)
**Success Criteria** (what must be TRUE):
  1. node_modules < 800MB (currently 1.6GB)
  2. .output/server < 40MB (currently 71MB)
  3. Build completes with 4GB memory (currently 8GB)
  4. Vercel deployment succeeds without timeout

**Plans**: 7 plans in 3 waves
  - [x] 14-01-PLAN.md — Remove phantom dependencies (Wave 1) ✅
  - [x] 14-02-PLAN.md — Lazy load pdfmake + externalize heavy deps (Wave 2) ✅
  - [x] 14-03-PLAN.md — Replace sharp with optional dependency (Wave 2) ✅
  - [x] 14-04-PLAN.md — Modularize @aws-sdk imports (Wave 2) ✅
  - [x] 14-05-PLAN.md — Update nuxt.config.ts with Nitro externals (Wave 3) ✅
  - [x] 14-06-PLAN.md — Verify bundle size + deployment test (Wave 3) ✅
  - [x] Fix PDF font issue — Change Roboto to Gudea, fix externalized module handling ✅

**Expected Savings**: ~800MB node_modules, ~40MB server bundle

**Completed:** 2026-03-12

---

## Phase 15: Detalles Gráficos Review

**Goal**: Fix issues with detalles gráficos (graphical details) not printing correctly in PDFs
**Depends on**: Phase 14 (Deployment Optimization)
**Success Criteria** (what must be TRUE):
  1. Detalles graficos images appear in generated PDFs
  2. Images are properly sized and positioned
  3. All images from the plan are included
  4. Images display in correct order
  5. No console errors during PDF generation
  6. PDF generation completes without timeout

**Research**: User reported issues with printing detalles graficos
**Plans**: 1 plan in 1 wave
  - [ ] 15-01-PLAN.md — Review and fix detalles gráficos PDF generation (Wave 1)

### Phase 16: Implement Security Headers
**Goal**: Add CSP headers and security configuration for PCI compliance
**Depends on**: Phase 9 (fixes incomplete security implementation)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. CSP headers whitelist Stripe domains (js.stripe.com, checkout.stripe.com)
  2. HSTS header enforces HTTPS connections
  3. X-Frame-Options header prevents clickjacking
  4. Webhook signature verification is mandatory on all events
  5. Security headers pass PCI compliance checks
**Gap Closure**: Closes 5 security gaps from Phase 09 audit
**Research**: Complete (HIGH confidence - 2026-03-20)
**Plans**: 3 plans in 3 waves
  - [ ] 16-01-PLAN.md — Restore CSP headers with Stripe domain whitelisting (Wave 1)
  - [ ] 16-02-PLAN.md — Implement HSTS and additional security headers (Wave 2)
  - [ ] 16-03-PLAN.md — Security verification and PCI documentation (Wave 3)

### Phase 17: Consolidate Webhook Endpoints
**Goal**: Eliminate duplicate webhook endpoints and standardize event handling
**Depends on**: Phase 8, Phase 12
**Requirements**: WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, WEB-08
**Success Criteria** (what must be TRUE):
  1. Single webhook endpoint at `/api/webhooks/stripe`
  2. No duplicate event processing or race conditions
  3. All Stripe events handled consistently
  4. Phase 12 webhook endpoint removed or consolidated
  5. Idempotency works across all event types
**Gap Closure**: Closes WEB-DUPLICATE critical integration gap

### Phase 18: Wire Missing UI & Cleanup
**Goal**: Complete subscription UI wiring, add invoice downloads, and clean up orphaned code
**Depends on**: Phase 11, Phase 12
**Requirements**: SUB-01, HIST-03
**Success Criteria** (what must be TRUE):
  1. SubscriptionCard 'Suscribirse' button has working click handler
  2. Invoice download button appears in payment history UI
  3. Subscription creation flow works end-to-end
  4. Subscription API routes use consistent path pattern
  5. Orphaned usePaymentAnalytics composable removed or integrated
**Gap Closure**: Closes SUB-01, HIST-03, FLOW-SUBSCRIBE, API-INCONSISTENT, ORPHANED-COMPOSABLE gaps

---

## Progress

**Execution Order:**
v1.0: Phase 00 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
v1.1 (COMPLETE): Phase 7 → 8 → 9 → 10 → 11 → 12 → 12.1 → 13 → 14 → 15 → 16 → 17 → 18

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 00. Verification System | 4/4 | Complete    | 2026-03-20 | - |
| 1. Database & Models | v1.0 | TBD | Not started | - |
| 2. User Profile Settings | v1.0 | 3/3 | Complete | 2026-02-11 |
| 3. Public QR Code Access | v1.0 | TBD | Not started | - |
| 4. Public Issue Reporting Form | v1.0 | TBD | Not started | - |
| 5. Coordinator Notification System | v1.0 | TBD | Not started | - |
| 6. Coordinator Dashboard Integration | v1.0 | TBD | Not started | - |
| 7. Database & API Foundation | v1.1 | 3/3 | Complete | 2026-01-25 |
| 8. Webhook Infrastructure | v1.1 | 3/3 | Complete | 2026-01-26 |
| 9. Access Control & Security | v1.1 | 3/3 | Gap Closure Needed | - |
| 10. Frontend Integration | v1.1 | 6/6 | Complete | 2026-01-27 |
| 11. Subscription Management | v1.1 | 8/8 | Gap Closure Needed | - |
| 12. Testing & Monitoring | v1.1 | 6/6 | Gap Closure Needed | - |
| 12.1. Render Deployment Fix | 1/1 | Complete   | 2026-03-02 | - |
| 13. Password Restoration | v1.1 | 2/2 | Complete | 2026-02-12 |
| 14. Deployment Optimization | v1.1 | 7/7 | Complete    | 2026-03-03 |
| 15. Detalles Gráficos Review | v1.1 | 0/1 | In Progress | - |
| 16. Implement Security Headers | 3/3 | Complete    | 2026-03-20 | - |
| 17. Consolidate Webhook Endpoints | v1.1 | 0/TBD | Pending | - |
| 18. Wire Missing UI & Cleanup | v1.1 | 0/TBD | Pending | - |

---

*Last updated: 2026-03-20*
*Current milestone: v1.1 — Phase 15 in progress, Gap closure phases 16-18 created*
