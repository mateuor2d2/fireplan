# Phase 11: Subscription Management - CONTEXT

**Status:** DISCUSSION COMPLETE
**Last Updated:** 2026-01-27

---

## Overview

Phase 11 implements subscription lifecycle management and Stripe Customer Portal integration for the v9planes application. This phase enables users to manage their subscriptions (pause, resume, cancel, re-subscribe) and update payment methods through Stripe's hosted Customer Portal.

---

## User Decisions

### 1. Management Interface

**Location:** Plan details page (`/protected/planes/[id]`)
- Subscription management lives on the plan details page where printing/payment currently exist
- Not a dedicated subscription page, not a modal

**UI Style:** Expandable card with details
- Card-based UI showing current subscription status
- Displays: status badge, next billing date, amount, annual discount (if applicable)
- Actions appear below the details (Pause, Cancel, Manage Payment)

**Empty State:** Call-to-action
- "Subscribe" button creates subscription through Stripe Checkout
- No subscription = visible CTA to start subscription

### 2. Pause Behavior

**Duration Options:** Both fixed date AND indefinite
- Users choose between:
  - Pause until specific date (e.g., "Pause until Jan 31")
  - Pause indefinitely (until manually resumed)

**QR Access During Pause:** Keep access
- Users retain QR access while subscription is paused
- They paid for the period, so they keep access

**Billing During Pause:** Claude's discretion
- DECISION: Use `pause_collection` with behavior `as_invoiced` (small fee) or `keep_as_draft` (no billing)
- RECOMMENDATION: `keep_as_draft` - freeze billing during pause, resume collects accumulated amount

**Resume Flow:** One-click
- No confirmation dialog
- Immediately reactivates subscription
- Prorates billing from resume date

### 3. Cancellation Flow

**Cancel Timing:** Period end
- Subscription cancels at the end of the current billing period
- Users keep access until their paid period expires

**Confirmation Dialog:** Basic confirm
- Simple "Are you sure?" dialog with Confirm/Cancel buttons
- No detailed explanation required

**Post-Cancel State:** Show canceled card
- Subscription card remains visible
- Shows "Canceled" badge and expiry date
- Displays when access will end

**Re-subscription:** Allow
- Users can create a new subscription after canceling
- "Re-subscribe" button creates new subscription through Stripe Checkout
- No support intervention required

### 4. Customer Portal

**Portal Access:** Settings page
- Link to Customer Portal in settings/navigation area
- Not directly in subscription card
- Keeps card UI focused on subscription actions

**Portal Scope:** Full management
- Users can manage payment methods
- Users can also manage subscription (pause/cancel/upgrade) through portal
- Full Stripe Customer Portal capabilities

**Portal Type:** Stripe hosted
- Use Stripe's pre-built hosted Customer Portal
- No custom UI needed
- Reduces development effort, keeps UX consistent with Stripe

**Return Flow:** Toast + refresh
- When users return from Customer Portal, show success toast
- Refresh subscription data to reflect any changes
- No dedicated success page needed

---

## Technical Implications

### Stripe API Features Used

1. **Subscription Modification**
   - `pause_collection` for pause/resume
   - `cancel_at_period_end` for cancellation
   - Update subscription API for changes

2. **Stripe Checkout**
   - New subscription creation (empty state CTA)
   - Re-subscription after cancellation
   - Redirect-based checkout flow

3. **Customer Portal**
   - `stripe.billingPortal.sessions.create()` for portal access
   - `return_url` configuration for redirect back to app
   - Portal configuration in Stripe Dashboard

### Data Model Changes

**Subscription State in Plan Document:**
```typescript
subscription: {
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  stripePriceId: string,
  status: 'active' | 'paused' | 'canceled' | 'past_due',
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean,
  pauseCollection?: {
    behavior: 'keep_as_draft' | 'as_invoiced' | 'void',
    resumesAt?: Date
  },
  canceledAt?: Date,
  expiresAt?: Date
}
```

### UI Components

1. **SubscriptionCard Component** (new)
   - Display current subscription status
   - Show next billing, amount, discount
   - Action buttons: Pause, Cancel, Manage Payment
   - Empty state: Subscribe CTA

2. **PauseDialog Component** (new)
   - Date picker or "indefinite" toggle
   - Confirm/Cancel buttons

3. **CancelConfirmDialog Component** (new)
   - Basic "Are you sure?" message
   - Explain period end behavior
   - Confirm/Cancel buttons

### API Endpoints

1. **POST /api/planes/[id]/subscription/pause** - Pause subscription
2. **POST /api/planes/[id]/subscription/resume** - Resume subscription
3. **POST /api/planes/[id]/subscription/cancel** - Cancel subscription
4. **POST /api/planes/[id]/subscription/resubscribe** - Create re-subscription session
5. **POST /api/planes/[id]/subscription/portal** - Create Customer Portal session

---

## Stripe Pause Behavior Decision

**Recommended:** `keep_as_draft`

**Rationale:**
- No invoices generated during pause (no small fees)
- Accumulates billing amount that's collected when resumed
- Simple for users to understand: "freeze billing, pay when resume"
- Better UX than `as_invoiced` (small fee) or `void` (lose accumulated time)

**Implementation:**
```typescript
await stripe.subscriptions.update(subscriptionId, {
  pause_collection: {
    behavior: 'keep_as_draft',
    resumes_at: indefinite ? undefined : resumeDate
  }
})
```

---

## Success Criteria

From ROADMAP.md, Phase 11 success criteria:

1. ✅ Users can pause subscriptions with `pause_collection` behavior
2. ✅ Users can resume paused subscriptions
3. ✅ Users can cancel subscriptions (immediate or period end)
4. ✅ Cancellation date and access period are clearly shown
5. ✅ Users can update payment methods via Stripe Customer Portal

All criteria are addressed by the decisions in this context.

---

## Dependencies

- **Phase 7 (Stripe Integration):** Stripe Checkout, webhook handlers
- **Phase 8 (Payment Flow):** Pay-to-Print model, subscription creation
- **Phase 10 (Frontend Integration):** Plan details page, printing UI

---

## User Experience Flow

### New User (No Subscription)
1. User views plan details page
2. Sees "Subscribe" CTA in subscription card empty state
3. Clicks → redirected to Stripe Checkout
4. Completes payment → redirected back with active subscription

### Active Subscription
1. User views plan details page
2. Sees subscription card with status, next billing, amount
3. Actions available: Pause, Cancel, Manage Payment (via portal)

### Pause Flow
1. User clicks "Pause" button
2. Dialog appears: choose date or indefinite
3. User confirms → subscription paused via API
4. Card updates to show "Paused" status
5. QR access continues (user keeps access)
6. One-click "Resume" button appears

### Cancel Flow
1. User clicks "Cancel" button
2. Basic confirmation dialog: "Are you sure? Access continues until [date]"
3. User confirms → subscription set to cancel at period end
4. Card updates to show "Canceled" badge with expiry date
5. "Re-subscribe" button appears

### Customer Portal Flow
1. User goes to Settings page
2. Clicks "Manage Payment Methods" link
3. Redirected to Stripe Customer Portal (hosted by Stripe)
4. Updates payment methods or manages subscription
5. Clicks "Return" in portal
6. Redirected back to app, success toast shown
7. Subscription data refreshed automatically

---

## Implementation Notes

### Security
- All API endpoints require authentication
- Validate user owns the plan before modifying subscription
- Validate plan has subscription before pause/resume/cancel
- Stripe webhook signatures for subscription updates

### Error Handling
- Handle Stripe API errors gracefully
- Show user-friendly messages for common errors:
  - "Subscription already paused"
  - "Cannot resume active subscription"
  - "Subscription already canceled"
  - "Payment method update failed"

### Edge Cases
- **Pause during pause:** Prevent pause if already paused
- **Resume active subscription:** Prevent resume if not paused
- **Cancel canceled subscription:** Prevent cancel if already canceled
- **Re-subscribe active subscription:** Prevent re-subscribe if still active
- **Portal without subscription:** Show error if no subscription exists

---

## Open Questions

None - all discussion areas complete.

---

**Next Steps:**
1. Create Phase 11 plans (PLAN.md)
2. Implement pause/resume/cancel endpoints
3. Implement Customer Portal session creation
4. Create SubscriptionCard component
5. Integrate into plan details page

---

_Context captured: 2026-01-27_
_Discussion facilitator: Claude (gsd-discuss-phase)_
