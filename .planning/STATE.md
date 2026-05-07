---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Stripe Payments
status: planning
stopped_at: Completed 16-03-PLAN.md (Security Verification and PCI Documentation)
last_updated: "2026-03-20T21:55:35.346Z"
last_activity: 2026-03-20 — Completed Phase 16 Plan 03 (Security Verification and PCI Documentation)
progress:
  total_phases: 20
  completed_phases: 18
  total_plans: 61
  completed_plans: 61
  percent: 100
---

# Project State - v9planesN3Bui3

**Last updated:** 2026-02-19 (Milestone v1.1 COMPLETE)

## Current Position

**Milestone:** v1.1 Stripe Payments — COMPLETE ✅
**Phase:** 16-implement-security-headers (complete)
**Plan:** 03 (complete) - all 3 plans complete
**Status:** Ready to plan
**Last activity:** 2026-03-20 — Completed Phase 16 Plan 03 (Security Verification and PCI Documentation)

**Progress:** [██████████] 100%

**Milestone v1.1 (100% complete):** Stripe Payments - ALL phases (7-13) complete and verified

**Current Git State:**
- Commits: `81392f0` (perfil.vue), `96cfac0` (index.vue with perfil tab)
- 02-02 commits: `386dbc3` (contrasena.vue), `0cb039b` (index.vue with contrasef1a tab), `8d42198` (OAuth detection fix)
- 02-03 commits: `c8e8adc` (useQRList), `2050d10` (codigos-qr.vue), `f6ab9cb` (settings index update)
- Working tree: Modified (SUMMARY.md created, STATE.md updated)
- Dev server: Not running

## Milestone v1.1: Stripe Payments

**Goal:** Monetize safety plan creation with one-time payments and optional recurring subscriptions for QR issue reporting.

### Active Requirements

- [x] **Payment tracking model (STAT-01)** - Payment status persists in database (verified existing Payment model)
- [x] **Payment tracking model (STAT-02)** - Payment timestamp and amount stored (verified existing Payment model)
- [x] **Per-Plan Subscription (SUB-01)** - Per-plan subscription model created
- [x] **Per-Plan Subscription (SUB-02)** - Subscription status tracked (active, past_due, canceled, paused, expired)
- [x] **Per-Plan Subscription (SUB-03)** - Annual pre-payment discount supported (10-20% range)
- [x] **Stripe Checkout integration** - Embedded checkout for one-time plan payments (checkout session endpoint created)
- [x] **Pay-to-Print flow** - User creates plan free, pays to generate PDF (implemented 2026-01-27)
- [x] **Plan pricing configuration** - Flat €29 price per plan (admin-configurable TODO for future)
- [x] **Optional QR subscription** - Monthly subscription per plan for issue reporting
- [x] **Subscription management** - Pause/resume/cancel and Customer Portal implemented
- [x] **Payment history** - User-facing payment and subscription history with filters
- [x] **Webhook handling** - Stripe webhook for payment/subscription events
- [x] **Dunning management** - Stripe Smart Retries with email notifications and grace period

## Previous Milestone v1.0: QR Issue Reporting

**Status:** Mostly complete (Phase 4, 4.1, 4.3 done; Phases 00 complete; Phase 02 planned)

### Completed

| Phase | Name | Status | Summary |
|-------|------|--------|---------|
| 00 | Verification System | ✅ Complete | Email/SMS verification with Twilio |
| 4 | Public Form | ✅ Complete | Public API endpoint, multi-step form, S3 upload |
| 4.1 | Issues Dashboard Routing | ✅ Complete | Dedicated issues page with proper routing |
| 4.3 | Public QR Issue Submission | ✅ Complete | QR access without token validation |
| 6 | Coordinator Dashboard | ✅ Complete | Coordinator issue management |

### Planned (v1.0 carry-over)

| Phase | Name | Status |
|-------|------|--------|
| 1 | Database & Models | Not started |
| 02 | User Profile Settings | ✅ Complete (02-01 ✅, 02-02 ✅, 02-03 ✅) |
| 3 | Public QR Code Access | Not started |
| 5 | Coordinator Notifications | Not started |
| 7 | Status Tracking | Not started |
| 8 | Testing & Security | Not started |
| 9 | Dashboard Integration | Not started |
| 10 | Rollout & Monitoring | Not started |

## Accumulated Decisions

### Phase 13 - Password Restoration (2026-02-12)

**Plan 13-01 Complete (Forgot Password Page):**
- Created dedicated `/forgot-password` page with email form and success state (178 lines)
- Spanish localization throughout: "Restablecer Contraseña", "¿Olvidaste tu contraseña?"
- Updated login.vue to use ULink navigation instead of inline handleForgotPassword()
- Email validation with regex pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Integrated with existing userStore.forgotPassword() API (already implemented)
- Pattern: Auth layout → UCard → UForm → UButton with loading state
- Success state shows "Correo enviado" with spam folder reminder

**Plan 13-02 Complete (Forgot Password Link in Perfil Settings):**
- Added "¿Olvidaste tu contraseña?" link to Perfil settings tab after email field
- ULink navigates to /forgot-password with subtle styling (text-primary, text-sm)
- Icon: i-heroicons-question-mark-circle for visual clarity
- Positioned after email helper text for logical flow
- Provides alternative password reset entry point for logged-in users

**Phase 13 Complete:** Password restoration now fully accessible from login page and Perfil settings tab.

**Note:** Phase 13 adds UX improvements only. Backend infrastructure was already complete:
- `server/api/auth/forgot-password.post.ts` - POST endpoint for reset requests
- `server/api/auth/reset-password.post.ts` - POST endpoint for password reset
- `server/models/PasswordResetToken.ts` - Reset token model with 1h TTL
- `app/pages/reset-password.vue` - Password reset form with strength indicator
- `app/stores/user.ts` - forgotPassword() method at lines 283-300
- [Phase 12.1]: Used Vercel preset (not node-server) for Render deployment - consistent with startCommand using .vercel/output path — The vercel preset is correct and matches the startCommand that uses .vercel/output/functions/__fallback.func/index.mjs
- [Phase 12.1]: Added runtime NODE_OPTIONS with 1.5GB limit for large operations during runtime — Provides 1.5GB memory limit (half of 2GB standard plan) for runtime operations
- [Phase 14-04]: Modularized AWS SDK imports using function-based utilities for better tree-shaking — Function-based approach provides better tree-shaking than class-based, while maintaining backward compatibility with existing S3Service API
- [Phase 14]: Made sharp optional via optionalDependencies with dynamic import and graceful fallback for image compression
- [Phase 14-05]: Used esbuild minification instead of terser (faster, already installed) — Terser not installed and esbuild is significantly faster
- [Phase 16-implement-security-headers]: Restored Phase 9.3 CSP implementation with environment-based security headers — CSP headers were lost during refactoring; restored with all Stripe domains whitelisted for PCI compliance. Production-only HSTS and upgrade-insecure-requests for development flexibility.
- [Phase 16-02]: Improved HSTS header pattern using spread operator — Changed from ternary with empty string to `...(condition && { header: value })` pattern to completely omit HSTS in non-production environments rather than sending empty string. Complete security headers suite now includes CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, and Permissions-Policy.
- [Phase 16-implement-security-headers]: All 5 security requirements (SEC-01 through SEC-05) verified complete. PCI DSS SAQ A compliance achieved through Stripe-hosted checkout with no card data storage.

### Phase 12 - Testing & Monitoring (2026-02-14)

**Plan 12-01 Complete (Invoice PDF Download Endpoint):**
- Created GET endpoint at `/api/invoices/[id]/download` that redirects to Stripe-hosted invoice PDF URLs
- Authorization via database query filter (userId + _id) ensures users can only download their own invoices
- Stripe invoice retrieval with expand option: `stripe.invoices.retrieve(id, { expand: ['hosted_invoice_url'] })`
- Created IInvoice TypeScript interface with optional `hosted_invoice_url?: string` field
- Spanish error messages for consistency with existing codebase
- Redirect pattern using `sendRedirect(event, url)` for 302 responses
- Decision: Use Stripe-hosted PDF URLs instead of generating custom PDFs (simpler, more reliable)

**Plan 12-02 Complete (Payment Failure Email Notification):**
- Added `sendPaymentFailureEmail` function to `server/utils/email.ts`
- Spanish email template with invoice URL button for easy payment method updates
- Grace period notice (7 days) informs users access continues during Stripe Smart Retries
- Retry count display and support contact information
- Comprehensive error handling with detailed Mailgun error logging

**Plan 12-04 Complete (Subscription Access Helper with Grace Period):**
- Added subscription access helper functions to `server/utils/stripe.ts`
- `hasSubscriptionAccess()` returns true for active and past_due (grace period during Smart Retries)
- `isSubscriptionExpired()` returns true only for canceled and incomplete_expired (truly expired)
- JSDoc comments document Stripe Smart Retry behavior (~3 week retry period for failed payments)
- Helper functions reusable across all subscription access checks

**Plan 12-05 Complete (Invoice Payment Failure Webhook Handler):**
- Added `invoice.payment_failed` webhook event handler in `server/api/payments/webhook.post.ts`
- Imported `sendPaymentFailureEmail` from `server/utils/email`
- Created `handleInvoicePaymentFailure` function that finds invoice, user, and plan from database
- Uses Stripe-hosted invoice URL for payment updates (hosted_invoice_url)
- Includes retry count (retries_remaining) in email notification
- Updated `handleInvoicePaymentSuccess` to update database Invoice status (status to 'paid', sets paidAt)
- Graceful error handling for missing records with console.error logging
- Decision: Graceful degradation - missing records return early with log, not exception

**Plan 12-06 Complete (Invoice History Hosted Invoice URL):**
- Added Stripe invoice URL retrieval to payment history API (`server/api/payments/history.get.ts`)
- Import stripe utility and call `stripe.invoices.retrieve(id, { expand: ['hosted_invoice_url'] })`
- Added `invoiceUrl` field to invoice response objects for download button functionality
- Graceful error handling with try/catch - continues without invoiceUrl if Stripe API fails
- Decision: Modified correct endpoint (/api/payments/history) instead of planned endpoint (/api/invoices/history) because frontend uses /api/payments/history

### Phase 02 - User Profile Settings (2026-02-11)

**Plan 02-01 Complete (Perfil Tab):**
1. Created perfil.vue page with 9-field profile form (name, email, phone, company details)
2. Updated settings index.vue navigation with Perfil tab
3. Implemented change tracking with hasChanges computed property
4. Added email validation with regex pattern and inline error messages
5. Integrated userStore.updateUser() for profile updates via PUT /api/auth/me
6. Profile form pattern established: loading/error/saving states, Spanish labels, toast notifications

**Plan 02-02 Complete (Contraseña Tab):**
- Password change form with current/new/confirm fields
- OAuth user detection and informational messaging (not blocking)
- Show/hide toggle for all three password fields
- Client-side password match validation
- Security tips card with best practices
- Form clears completely after successful password change

**Plan 02-03 Complete (Mis Códigos QR Tab):**
- QR list management with useQRList composable
- Statistics cards showing total, active, expired, disabled counts
- QR codes list with status badges and expiration dates
- Regenerate QR action with new access token
- Enable/disable QR toggle action
- Empty state with link to plans page
- Settings navigation updated with Mis Códigos QR tab

**Research Complete (HIGH confidence):**
1. Backend APIs already exist (me.put, change-password, QR management endpoints)
2. Settings navigation structure exists at /protected/settings/index.vue
3. QR settings page exists as pattern reference (qr.vue)
4. Nuxt UI v4 components available (UCard, UInput, UButton, UTabs)
5. useUserStore has updateUser(), changePassword(), updateQRSettings() methods

**Three Main Tabs:**
1. Perfil (profile): View/edit user information (name, email, phone, company details) ✅
2. Contraseña (password): Change password with current password verification ✅
3. Mis Códigos QR (QR codes): List, regenerate, enable/disable all user's QR codes ✅

**Phase 02-01 Profile Form Pattern:**
1. Change detection via originalData ref comparison with hasChanges computed
2. Email validation with regex pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
3. Partial update payload building - only send changed fields to API
4. Disabled save button when no changes or form is invalid
5. Spanish toast notifications for success/error feedback
6. Reset functionality to restore saved values from originalData

### v1.1 - Stripe Payments

**Business Model Decision (2026-01-26):**
1. Pay-to-Print model chosen over Pay-to-Create
2. Users can create and fill plans for free (lower barrier to entry)
3. Payment required only at PDF generation/printing
4. Better conversion - users invest time before paying
5. Enforcement moved from plan creation to PDF endpoint

**Phase 7.1 - Subscription Model and Types:**
1. Subscription model follows Payment.ts schema pattern - timestamps, indexes, TypeScript interface
2. All Stripe subscription statuses supported - active, past_due, canceled, paused, expired
3. Annual prepayment discount field with validation (10-20% range)
4. Five indexes for query performance - userId+planId, stripeSubscriptionId, status, currentPeriodEnd, createdAt
5. Subscription types exported - ISubscription, SubscriptionCreateInput, SubscriptionUpdateInput

**Phase 7.2 - Subscription API Endpoints:**
6. RESTful API endpoints for subscription management - GET list, POST create, GET by ID
7. Zod validation schemas for subscription queries and creation
8. Stripe customer creation/retrieval pattern from existing payments
9. Plan enrichment with subscription data (nom_obra, desc_obra)
10. Ownership-based access control (userId + planId check)
11. Duplicate active subscription prevention before creating new
12. Pagination with page/limit and total count for subscription lists

**Phase 7.3 - Stripe Subscription Helper Utilities:**
13. Helper function pattern for encapsulating Stripe API calls in reusable utilities
14. Payment method attachment and default setting on subscription creation
15. Annual discount coupon applied via discounts array for yearly billing
16. Three subscription helpers: createQrSubscription, updateQrSubscription, cancelQrSubscription
17. Stripe API version 2025-08-27.basil for TypeScript compatibility
18. Comprehensive JSDoc documentation with usage examples for all helpers
19. Default graceful cancellation (cancelAtPeriodEnd = true) for user-friendly termination

**Phase 8.1 - Webhook Event Logging:**
20. WebhookEvent model with unique eventId constraint for idempotency - prevents duplicate processing
21. Event status lifecycle tracking (pending, processing, completed, failed) for monitoring and retry logic
22. Full payload storage via Schema.Types.Mixed for debugging failed webhooks
23. Six indexes for optimal query performance - eventId (unique), type, status, receivedAt, compound { type, receivedAt }, TTL (30 days)
24. 30-day TTL index balances debugging retention with storage management
25. WebhookEventStatus enum and IWebhookEvent interface exported for type-safe webhook handlers
26. Error tracking field for failed webhooks with diagnostic information

**Phase 8.2 - Stripe Webhook Endpoint:**
27. Webhook endpoint at POST /api/webhooks/stripe with signature verification using stripe.webhooks.constructEvent()
28. Raw body reading via readRawBody() to preserve exact request body for signature validation
29. Database-backed idempotency via WebhookEvent.findOne({ eventId }) lookup prevents duplicate processing
30. Duplicate events return 200 OK immediately to prevent Stripe retry loops
31. Event status lifecycle tracking: create with 'pending' → update to 'processing' → update to 'completed' or 'failed'
32. Event router with stubs for 13 required Stripe event types (checkout.session.*, payment_intent.*, customer.subscription.*, invoice.*)
33. Comprehensive error handling updates WebhookEvent status to 'failed' with error message on handler errors
34. Signature verification failures return 400, processing errors return 500, all errors logged for debugging

**Phase 8.3 - Webhook Event Handlers:**
35. Handler-per-event pattern for clean separation of concerns - each Stripe event type has dedicated handler function
36. handleCheckoutSessionCompleted updates Payment status to 'succeeded' and enables Plan.canPrint for paid plans
37. handlePaymentIntentFailed marks payments as 'failed' with error message from Stripe
38. handleSubscriptionCreated creates Subscription record and enables Plan.qrEnabled for QR issue access
39. handleSubscriptionUpdated syncs subscription status (active, past_due, canceled, paused) with Stripe
40. handleSubscriptionDeleted marks subscription as 'canceled' and disables Plan.qrEnabled
41. handleInvoicePaymentSucceeded extends subscription access period and reactivates past_due subscriptions
42. handleInvoicePaymentFailed marks subscription as 'past_due' for dunning management
43. All handlers validate required metadata (userId, planId) before database operations
44. Idempotency via database lookups - handleSubscriptionCreated checks for existing subscriptions
45. QR access control synchronized with subscription lifecycle in handlers for immediate effect
46. Error propagation pattern - handlers throw errors, webhook endpoint catches and updates WebhookEvent status to 'failed'
47. All handlers wired to event router in server/api/webhooks/stripe.post.ts

**Phase 9.1 - PDF Generation Payment Enforcement:**
48. Payment enforcement pattern in PDF endpoint - Payment.findOne() checks for status='succeeded' before generating PDF
49. Pay-to-print model implemented - users can create plans for free, must pay to generate PDF
50. Graceful error responses with helpful data - 403 includes paymentUrl, reason, and Spanish error message
51. Payment check placement - after authentication and plan retrieval, before template processing
52. Only 'succeeded' payments allow PDF generation - pending/failed/canceled payments return 403
53. Plan creation verified to work without payment - POST /api/planes has no payment check, canPrint defaults to false

**Phase 9.2 - Print Button Payment Guard + Subscription Enforcement:**
54. Client-side payment guard composable created - usePaymentGuard() for print button payment flow
55. Reactive payment status tracking - hasPayment and paymentStatus refs for UI state management
56. Payment flow trigger with return URL - requirePaymentOrTrigger() navigates to /payment with planId and returnUrl
57. Subscription enforcement in public issue submission - Subscription.findOne() checks for active/past_due status
58. Grace period for past_due subscriptions - allow issue reporting during dunning before access is revoked
59. Spanish error messages for subscription enforcement - 403 includes subscriptionUrl and reason
60. Pay-to-print model fully implemented - free plan creation, payment required for PDF generation and QR issue reporting

**Phase 9.3 - CSP Headers for Stripe Domains:**
61. Content Security Policy configured with all Stripe domains whitelisted for secure payment integration
62. scriptSrc includes js.stripe.com for Stripe.js library loading
63. frameSrc includes js.stripe.com and checkout.stripe.com for Stripe Checkout iframe
64. formSrc includes checkout.stripe.com for payment form submission
65. connectSrc includes api.stripe.com for Stripe API calls
66. imgSrc includes *.stripe.com and *.stripe.network for payment icons and graphics
67. Strict-Transport-Security header for HTTPS enforcement in production only (max-age=31536000; includeSubDomains; preload)
68. X-Frame-Options: SAMEORIGIN to prevent clickjacking attacks
69. X-Content-Type-Options: nosniff to prevent MIME type sniffing
70. Additional security headers: X-XSS-Protection, Referrer-Policy, Permissions-Policy
71. Environment-based CSP configuration with separate policies for development and production
72. Production CSP includes upgrade-insecure-requests for automatic HTTPS upgrades

**Phase 10.01 - Payment Status Endpoint:**
73. Payment status endpoint at GET /api/payments/status/:planId for checking plan payment status
74. Returns payment status, amount, currency, and timestamps for paid plans
75. Returns null status for unpaid plans with canPrint flag for frontend enforcement
76. Efficient query using Payment.findOne with userId+planId compound index
77. Spanish error messages for authentication and not found cases
78. Metadata tracking for planName in payment records
79. Pattern for frontend payment status checking before allowing print/PDF access

**Phase 10.02 - Stripe Checkout Session Creation:**
80. Stripe Checkout session creation endpoint at POST /api/payments/create-checkout for hosted checkout flow
81. Creates or retrieves Stripe customer for user via email lookup
82. Creates Checkout Session with line items for €29.00 one-time plan payment
83. Creates pending Payment record with checkout session metadata
84. Returns checkout URL, sessionId, and paymentId for client-side redirection
85. Double payment prevention via check for existing succeeded payments
86. Success URL redirects to print page with ?payment=success query parameter
87. Cancel URL supports custom returnUrl or defaults to plan page
88. Fixed price €29.00 per plan (documented TODO for future admin-configurable pricing)
89. Spanish error messages for consistency with existing codebase
90. Updates plan.paymentStatus to 'processing' and plan.paymentId reference
91. Pattern: Customer reuse via email search for returning users
92. Pattern: Pending payment record creation before payment completion
93. Pattern: Checkout session metadata tracking (userId, planId, planName)

**Phase 10.03 - Payment Status Badge Component:**
94. PaymentStatusBadge component with Spanish labels (Pagado, Pendiente, Fallido)
95. Props-based API: state (required), size (optional), variant (optional)
96. Computed styling with Nuxt UI v4 colors (success, neutral, error)
97. Icon mapping for each payment state (check, clock, x-mark)
98. Label mapping with Spanish text for user-friendly display
99. Reusable badge pattern for consistent payment status display across UI

**Phase 10.04 - Payment Page with Stripe Checkout:**
100. Payment page at /protected/payment that initiates Stripe Checkout flow
101. Query parameter validation (planId required, returnUrl optional)
102. Loading state with spinner during checkout session creation
103. Full-page redirect to Stripe Checkout URL using window.location.href
104. Error handling with user-friendly Spanish messages
105. Back button navigation to plan page on errors
106. Nuxt UI v4 components (UCard, UIcon, UButton) for consistent styling
107. Toast notification for errors in addition to inline error display
108. Payment page redirect pattern using window.location.href for external checkout

**Phase 10.05 - Enhanced usePaymentGuard with Real API Integration:**
109. Real API integration in usePaymentGuard composable - replaced placeholder with actual $fetch() call
110. Loading state management with isLoading ref for UI feedback during payment checks
111. Error state handling with error ref and Spanish error messages for consistency
112. Manual refresh function refreshPaymentStatus() for polling and manual status updates
113. TypeScript type safety for payment status API response with proper interface
114. Reactive state updates from API response - hasPayment and paymentStatus refs updated
115. Backward compatibility maintained - no breaking changes to composable API
116. Composable pattern for loading/error states in async operations
117. API error handling pattern with fallback Spanish messages

**Phase 10.06 - Return URL Handling and Post-Payment Flow:**
118. Query parameter-based payment return detection - check route.query.payment === 'success' on mount
119. Automatic payment status refresh via refreshPaymentStatus() when user returns from Stripe Checkout
120. Success toast notification with green color and check icon for completed payments
121. Polling mechanism for pending/processing payments - 3-second intervals with 30-second timeout
122. Separate toast notifications for processing (orange/clock) and failed (red/x) states
123. PaymentStatusBadge component integration in print page header with loading spinner
124. Success alert message display when payment completed successfully
125. Automatic plan reload after successful payment to update UI state
126. Edge case handling for pending, processing, and failed payment states
127. Polling cleanup with clearInterval to prevent memory leaks
128. Graceful degradation for payment state edge cases and webhook delays

**Phase 11.01 - Pause and Resume Subscription:**
129. Pause subscription endpoint at POST /api/planes/[id]/subscription/pause with indefinite or dated pause options
130. Resume subscription endpoint at POST /api/planes/[id]/subscription/resume for one-click reactivation
131. Pause collection behavior set to 'keep_as_draft' for billing freeze during pause
132. Database sync with pauseCollection field tracking behavior and resumesAt date
133. Status updates from 'active' to 'paused' and back to 'active' on resume
134. Zod validation for pause parameters (resumeDate, indefinite boolean)
135. pauseCollection field added to Subscription model schema and ISubscription interface

**Phase 11.02 - Cancellation and Re-subscription Flows:**
136. Cancel subscription endpoint at POST /api/planes/[id]/subscription/cancel with period-end behavior
137. Re-subscription endpoint at POST /api/planes/[id]/subscription/resubscribe for Stripe Checkout session creation
138. Period-end cancellation preserves access until currentPeriodEnd via expiresAt field
139. canceledAt and expiresAt fields added to Subscription model and types for cancellation tracking
140. Eligibility validation prevents re-subscribing to active or paused subscriptions
141. Re-subscription uses Stripe Checkout (mode: subscription) with monthly price default
142. Success URL includes ?subscription=new query parameter for post-payment flow
143. Metadata tracking with resubscription flag for webhook handler detection

**Phase 11.03 - Customer Portal Access:**
144. Customer Portal endpoint at POST /api/planes/[id]/subscription/portal for Stripe Billing Portal session creation
145. Validates plan ownership and subscription existence before portal access
146. Creates Stripe-hosted portal session with return URL to plan details page
147. Limits portal to specific subscription via subscription parameter for focused management
148. Returns portal URL for frontend redirect to payment method management
149. Return URL includes ?portal_return=true query param for success toast detection
150. Follows existing authentication/ownership/validation pattern from pause/resume/cancel endpoints
151. Stripe Billing Portal API integration using stripe.billingPortal.sessions.create()
152. Self-service payment method updates without custom UI development

**Phase 11.04 - SubscriptionCard Component and useSubscription Composable:**
153. GET subscription endpoint at /api/planes/[id]/subscription for fetching subscription data
154. useSubscription composable with reactive state (subscription, loading, error)
155. Composable methods: fetchSubscription, pauseSubscription, resumeSubscription, cancelSubscription
156. Handles 404 as expected state (null subscription) for empty state UI rendering
157. SubscriptionCard component displaying all subscription states (empty, active, paused, canceled, past_due)
158. Visual badges with consistent color scheme (green=active, yellow=paused, red=canceled, orange=past_due)
159. Shows next billing date, amount, currency, and annual prepayment discount when applicable
160. Action buttons based on state: Pause, Cancel, Resume, Manage Payment, Subscribe
161. Pause/cancel confirmation dialogs with date picker for pause duration
162. Nuxt UI components: UCard, UBadge, UButton, UAlert, UModal, UIcon
163. formatDate utility for Spanish locale date formatting
164. formatAmount utility for currency display with Intl.NumberFormat

**Phase 11.05 - Pause and Cancel Confirmation Dialogs:**
165. PauseDialog component with indefinite toggle (default checked) and date picker options
166. CancelConfirmDialog component with period end explanation and formatted expiry date
167. Both dialogs use Nuxt UI modal components (UModal with UCard, UButton, UAlert)
168. Emit-based communication pattern for parent component handling
169. Form validation for date selection (must be future date, min: tomorrow)
170. State reset on dialog close to prevent stale data
171. Spanish UI text for consistency with existing codebase
172. Modal dialog pattern with UModal v-model.bind for open/close
173. Dialogs emit confirm/cancel events for parent handling with pause options data

**Phase 11.06 - Subscription UI Integration (CHECKPOINT):**
174. SubscriptionCard component integrated into dashboard.vue (not index.vue which doesn't exist)
175. Portal return handling with onMounted query param check (?portal_return=true)
176. Green success toast with "Cambios guardados" message for portal return
177. URL cleanup using navigateTo(route.path, { replace: true }) to remove query params
178. Component placement after QR Code section for logical feature grouping
179. Self-contained SubscriptionCard with embedded pause/cancel dialogs
180. Handler functions (handlePause, handleResume, handleCancel) in component

**Phase 11.08 - Resume Subscription Verification (VERIFICATION COMPLETE):**
181. Resume button wiring verified - @click="handleResume" calls resumeSubscription() correctly
182. resumeSubscription method verified in useSubscription composable - calls POST /api/planes/[id]/subscription/resume
183. Resume endpoint verified - removes pause_collection in Stripe and clears database pauseCollection field
184. Complete data flow verified: Button → Handler → Composable → API → Stripe → Database
185. GAP 2 from subscription management verification CLOSED - resume functionality is correctly wired
186. No code changes required - verification confirmed existing implementation is correct

**Phase 11.07 - Customer Portal Integration (COMPLETE):**
187. openPortal method added to useSubscription composable for Customer Portal access
188. Calls POST /api/planes/[id]/subscription/portal endpoint from Plan 11-03
189. Redirects user to Stripe Customer Portal URL using navigateTo with external: true
190. Gestionar Pago button wired to handlePortal instead of to="/protected/settings?tab=payment"
191. Actualizar Método de Pago button also wired to handlePortal for past_due subscriptions
192. Merged duplicate onMounted hooks in dashboard.vue into single hook handling portal return and plan loading
193. Portal return check happens before loadPlan to ensure toast shows and URL is cleaned
194. Direct portal access pattern: button click → handlePortal → openPortal → portal API → Stripe redirect
195. Single onMounted hook pattern prevents race conditions and improves code clarity

**Phase 11 Complete (2026-02-12):** Subscription Management with Customer Portal
- 8 plans executed in 3 waves (pause/resume/cancel APIs, portal session, components, integration, gap closure)
- Users can pause, resume, and cancel subscriptions with proper Stripe sync
- Customer Portal integration working via openPortal method
- All subscription lifecycle operations verified: 5/5 must-haves passed
- v1.1 Stripe Payments at 83% complete - only Phase 12 (Testing & Monitoring) remains

**Phase 12-04 Complete (2026-02-14): Subscription Access Helper with Grace Period**
- 1 plan executed - added subscription access helper functions to server/utils/stripe.ts
- hasSubscriptionAccess() returns true for active and past_due (grace period during Smart Retries)
- isSubscriptionExpired() returns true only for canceled and incomplete_expired (truly expired)
- JSDoc comments document Stripe Smart Retry behavior (~3 week retry period for failed payments)
- Helper functions reusable across all subscription access checks (API endpoints, middleware, components)
- Grace period prevents premature access revocation during Stripe dunning

### v1.0 - QR Issue Reporting

**Public Form (Phase 4):**
1. Photo upload via pre-uploaded URLs - Client uploads to public S3 endpoint first
2. Reference number format - INC-{YEAR}-{MONTH}-{RANDOM 6-CHAR}
3. Sparse unique index on referenceNumber - Allows null, enforces uniqueness when present
4. TTL index for verification code cleanup - Auto-delete after 15 minutes
5. Zod validation with Spanish error messages
6. POST validation endpoint for QR access - `/api/public/issue-report/validate-by-slug`
7. Nuxt UI v4 color compatibility - Updated to error/success/info
8. Public S3 upload endpoint - `/api/public/s3/upload` with 20/hour rate limit
9. IP-based rate limiting for file uploads
10. useS3 composable enhancement - Optional `public` parameter

**Issues Dashboard (Phase 4.1):**
11. Dedicated issues page routing - `/protected/planes/[id]/issues`
12. Page component pattern for major sections
13. Removed inline component rendering

**Public QR Access (Phase 4.3):**
14. Public QR access without token validation - QR slug-only identification
15. Optional verification flow - Users can submit without verification
16. Zod passthrough mode - `.passthrough()` instead of `.strict()`
17. Real-time validation feedback - Visual indicators (green checkmarks, red X)
18. Nuxt UI v4 color mapping - neutral/primary/secondary/...

**Phase 00-03 - Verification Form Component:**
19. VerificationForm.vue standalone component with email/SMS method selection
20. Masked contact info display for privacy (show only partial email/phone)
21. Send code button with 60-second resend countdown timer
22. 6-digit code input with enter key support and validate button
23. Visual verification status with success/error alerts in Spanish
24. Emit-based communication pattern between parent and child components
25. Form submission ALWAYS allowed (verification is OPTIONAL)
26. Integration with useVerification composable for state management

### Technical Patterns Established

**API Patterns:**
- Zod Schema Validation with Spanish errors
- Collision Retry Logic for unique ID generation
- Public API Error Handling with createError
- Sparse Unique Indexes for optional fields
- TTL Auto-Cleanup for time-based expiration

**Frontend Patterns:**
- Public Page QR Validation on mount
- Multi-Step Form Pattern with visual progress
- S3 Photo Upload Integration
- Client-Side Zod Validation
- Confirmation Page Pattern with reference numbers

**Rate Limiting:**
- IP-based using createRateLimitMiddleware
- Configurable limits per endpoint type
- Stricter limits for file uploads (20/hour)

## Technical Environment

**Stack:**
- Framework: Nuxt 3 → Nuxt 4 migration in progress
- UI: Nuxt UI Pro v4, Vue 3 Composition API
- Database: MongoDB with Mongoose ODM
- State: Pinia stores
- Auth: JWT with OAuth (Google, GitHub)
- Storage: AWS S3 for files
- Payment: Stripe (new for v1.1)
- SMS: Twilio
- Email: Mailgun/cima20.io

**Key Files:**
- `/app/stores/planes.ts` - Safety plan store
- `/app/stores/issues.ts` - Issue store
- `/app/stores/user.ts` - User store with updateUser(), changePassword(), updateQRSettings()
- `/server/models/Issue.ts` - Issue model
- `/server/models/Subscription.ts` - Subscription model for QR issue reporting (new)
- `/server/types/subscription.ts` - Subscription TypeScript types (new)
- `/server/models/WebhookEvent.ts` - Webhook event logging model with idempotency (new)
- `/server/types/webhook.ts` - Webhook event TypeScript types (new)
- `/server/api/webhooks/stripe.post.ts` - Stripe webhook endpoint with signature verification, idempotency, and event router (updated)
- `/server/utils/webhookHandlers.ts` - Stripe webhook event handlers for checkout, payments, subscriptions, and invoices (new)
- `/server/utils/stripe.ts` - Stripe helper utilities (create/update/cancel subscriptions)
- `/server/models/Payment.ts` - One-time payment model (verified STAT-01, STAT-02)
- `/server/api/payments/create-checkout.post.ts` - Stripe Checkout session creation endpoint (new)
- `/server/api/payments/status/[planId].get.ts` - Payment status endpoint for checking plan payment status (new)
- `/app/components/payment/PaymentStatusBadge.vue` - Payment status badge component with Spanish labels (new)
- `/app/pages/protected/payment/index.vue` - Payment page with Stripe Checkout redirection (new)
- `/app/pages/protected/planes/[[id]]/impresion.vue` - Print page with payment return handling and polling (modified)
- `/server/api/issues/` - Issues CRUD endpoints
- `/server/api/planes/` - Plans CRUD endpoints
- `/server/api/planes/[id]/subscription/pause.post.ts` - Pause subscription endpoint (new)
- `/server/api/planes/[id]/subscription/resume.post.ts` - Resume subscription endpoint (new)
- `/server/api/planes/[id]/subscription/cancel.post.ts` - Cancel subscription endpoint (new)
- `/server/api/planes/[id]/subscription/resubscribe.post.ts` - Re-subscription checkout endpoint (new)
- `/server/api/planes/[id]/subscription/portal.post.ts` - Customer Portal session creation endpoint (new)
- `/server/api/planes/[id]/subscription.get.ts` - GET subscription by plan ID endpoint (new)
- `/app/composables/useSubscription.ts` - Subscription data fetching and management composable (new)
- `/app/components/subscription/SubscriptionCard.vue` - Subscription status and management UI component (new)
- `/app/components/subscription/PauseDialog.vue` - Pause confirmation dialog with date picker (new)
- `/app/components/subscription/CancelConfirmDialog.vue` - Cancel confirmation dialog (new)
- `/app/pages/protected/planes/[[id]]/dashboard.vue` - Plan details dashboard with SubscriptionCard integration (modified)
- `/app/pages/protected/planes/[id]/issues` - Issues dashboard
- `/app/pages/protected/settings/index.vue` - Settings navigation with UTabs
- `/app/pages/protected/settings/perfil.vue` - User profile form with forgot password link (modified)
- `/app/pages/forgot-password.vue` - Dedicated forgot password page with email form (new)
- `/app/pages/login.vue` - Login page with updated forgot password link (modified)
- `/app/pages/protected/settings/qr.vue` - QR settings configuration page (pattern reference)
- `/server/api/auth/me.put.ts` - Profile update endpoint
- `/server/api/auth/change-password.post.ts` - Password change endpoint
- `/server/api/invoices/[id]/download.get.ts` - Invoice PDF download endpoint with Stripe-hosted URLs (new)
- `/server/types/invoice.ts` - Invoice TypeScript interface with hosted_invoice_url field (new)
- `/app/composables/useVerification.ts` - Verification composable with reactive state and API integration (new)
- `/app/components/VerificationForm.vue` - Standalone verification UI component with email/SMS method selection (new)

## Dependencies

### External Services

- **MongoDB**: Data persistence (configured)
- **S3**: Photo storage (configured)
- **Stripe**: Payments (configured, not yet integrated)
- **Twilio**: SMS verification (twilio@5.12.1 installed, backend ready, credentials pending)
- **Mailgun/cima20.io**: Email verification (mailgun.js installed, backend ready)

### Internal Dependencies

- Issue model (enhanced with referenceNumber)
- VerificationCode model (new)
- Subscription model (new - for QR issue reporting subscriptions)
- issueQRService (QR validation)
- Reference number utility (unique ID generation)
- useS3 composable (enhanced with public endpoint)
- useQRList composable (new - for QR list management)

## Session Continuity

**Last session:** 2026-03-20T21:52:51.490Z
**Stopped at:** Completed 16-03-PLAN.md (Security Verification and PCI Documentation)
**Resume file:** None

## Roadmap Evolution

- **Phase 12.1 inserted** (2026-02-25): Fix Render deployment issues - deep analysis and refactor (URGENT) — App fails to deploy on Render, needs analysis and fix

- **Phase 11 complete** (2026-02-12): Subscription Management — All 8 plans executed and verified, including gap closure plans 11-07 and 11-08
**Stopped at:** Phase 11 complete, ready for Phase 12 (Testing & Monitoring)
**Resume file:** None (phase complete)

- **Phase 02 planned** (2026-02-11): User Profile Settings — 3 plans in 2 waves for perfil, contraseña, codigos-qr tabs
**Stopped at:** Phase 02 plans created, ready for execution
**Resume file:** None (planning complete)

- **Phase 13 added** (2026-02-12): Password Restoration (URGENT) — User lost password during change, needs restore flow
**Stopped at:** Phase 13 planned (2 plans in 2 waves), ready for execution
**Resume file:** None (planning complete)

**Completed (2026-02-11):**
- ✅ Phase 00-01: Installed Twilio package (twilio@5.12.1), verified complete backend verification infrastructure
- ✅ Phase 00-02: Created useVerification composable with reactive state and API integration
- ✅ Phase 00-03: Created VerificationForm component and integrated into IssueReportForm
- ✅ Phase 02: User Profile Settings - 3 plans created (02-01, 02-02, 02-03)

**Completed (2026-02-12):**
- ✅ Phase 13-01: Forgot Password Page - Created /forgot-password page with Spanish localization
- ✅ Phase 13-02: Forgot Password Link in Perfil Settings - Added link to perfil.vue after email field
- ✅ Phase 13: Password Restoration - Both plans executed and verified, phase complete
**What's next:**
**Phase 13 Execution** (execute-phase)
- Wave 1: ✅ Plan 13-01 executed (Forgot Password Page)
- Wave 2: Plan 13-02 pending (optional polish improvements)

**Current state:**
- Dev server: Not started
- v1.1 status: ⏸️ 87% complete (phases 7-11 done, 12-04 complete)
- v1.0 status: ✅ Phase 00 complete, Phase 02 complete, Phase 13 complete
- Git: 1 commit (3bbd156 - subscription access helper)

## Context Files

### Planning Documents

- [PROJECT.md](PROJECT.md) - Project overview and v1.1 requirements
- Phase plans: `.planning/phases/XX-name/XX-YY-PLAN.md`
- Phase summaries: `.planning/phases/XX-name/XX-YY-SUMMARY.md`

### Technical Documentation

- [CLAUDE.md](../CLAUDE.md) - Architecture and development guidelines
- [CLAUDE.local.md](../CLAUDE.local.md) - User-specific context

---

*State file automatically updated by GSD plan executor*
*Last updated: 2026-02-19T05:56:30Z - Plan 12-06 (Invoice History Hosted Invoice URL) complete, SUMMARY.md created*
