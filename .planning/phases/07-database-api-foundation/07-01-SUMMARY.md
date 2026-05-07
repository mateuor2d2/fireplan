---
phase: 07-database-api-foundation
plan: 01
subsystem: payments, database
tags: stripe, mongoose, subscriptions, typescript, mongodb

# Dependency graph
requires: []
provides:
  - ISubscription TypeScript interface with all Stripe subscription statuses
  - Subscription Mongoose model with indexes for efficient queries
  - SubscriptionCreateInput and SubscriptionUpdateInput type definitions
  - Verification that Payment model covers STAT-01 and STAT-02 requirements
affects: [07-02-subscription-helpers, 07-03-subscription-api, 08-webhooks, 10-frontend-integration]

# Tech tracking
tech-stack:
  added: [Mongoose subscription model, TypeScript subscription types]
  patterns: [Mongoose schema pattern with indexes, TypeScript Document interface pattern]

key-files:
  created:
    - server/types/subscription.ts
    - server/models/Subscription.ts
  modified: []

key-decisions:
  - "Followed Payment.ts pattern exactly for schema structure (timestamps, indexes, interface)"
  - "Used Stripe subscription statuses enum: active, past_due, canceled, paused, expired"
  - "Annual prepayment discount stored as optional Number field with min/max validation (10-20%)"
  - "Payment model already covers STAT-01 (status persistence) and STAT-02 (timestamp + amount)"

patterns-established:
  - "Subscription schema follows Payment.ts pattern: timestamps via mongoose timestamps: true, indexes for query performance, TypeScript interface extending Document"
  - "All Stripe subscription statuses supported: active, past_due, canceled, paused, expired"
  - "Indexes on userId+planId (user's plan subscriptions), stripeSubscriptionId (webhook lookups), status (filtering), currentPeriodEnd (renewal queries), createdAt (history views)"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 07 Plan 01: Subscription Model and Types Summary

**Subscription Mongoose model with TypeScript types for per-plan QR issue reporting, supporting all Stripe subscription statuses and annual prepayment discounts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T22:12:15Z
- **Completed:** 2026-01-25T22:14:01Z
- **Tasks:** 3
- **Files created:** 2

## Accomplishments

- **Created TypeScript types** for subscriptions with ISubscription, SubscriptionCreateInput, and SubscriptionUpdateInput interfaces
- **Created Mongoose Subscription model** with all required fields, validation, and 5 indexes for query performance
- **Verified Payment model** covers STAT-01 (status persistence) and STAT-02 (timestamp + amount) requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Subscription TypeScript types** - `c41f128` (feat)
2. **Task 2: Create Subscription Mongoose model** - `888eec9` (feat)
3. **Task 3: Verify Payment model covers STAT-01 and STAT-02** - No commit (verification only, no changes)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

### Created

- `server/types/subscription.ts` - TypeScript interfaces for subscription operations
  - ISubscription interface extending Document with all required fields
  - SubscriptionCreateInput for creation operations
  - SubscriptionUpdateInput for update operations
  - Supports all Stripe subscription statuses: active, past_due, canceled, paused, expired

- `server/models/Subscription.ts` - Mongoose subscription model for QR issue reporting
  - Schema with all required fields (userId, planId, stripeSubscriptionId, stripeCustomerId, stripePriceId, status, billingInterval, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, annualPrepaymentDiscount, amount, currency, metadata)
  - 5 indexes for query performance:
    - `{ userId: 1, planId: 1 }` - User's plan subscriptions (most common query)
    - `{ stripeSubscriptionId: 1 }` - Webhook lookups (unique via schema)
    - `{ status: 1 }` - Filtering by subscription status
    - `{ currentPeriodEnd: 1 }` - Upcoming renewal queries (cron jobs, notifications)
    - `{ createdAt: -1 }` - History views (most recent first)
  - Annual prepayment discount validation (10-20% range)
  - Follows Payment.ts schema pattern exactly

## Model Schema Details

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | String (ref: User) | Yes | User who owns the subscription |
| planId | String (ref: Plan) | Yes | Plan this subscription provides QR access for |
| stripeSubscriptionId | String (unique) | Yes | Stripe subscription ID for webhook lookups |
| stripeCustomerId | String | Yes | Stripe customer ID for payment methods |
| stripePriceId | String | Yes | Stripe price ID for billing amount |
| status | Enum | Yes | Subscription status: active, past_due, canceled, paused, expired |
| billingInterval | Enum | Yes | Billing frequency: month or year |
| currentPeriodStart | Date | Yes | Start of current billing period |
| currentPeriodEnd | Date | Yes | End of current billing period (renewal date) |
| cancelAtPeriodEnd | Boolean | No | Whether subscription will cancel at period end (default: false) |
| annualPrepaymentDiscount | Number (10-20) | No | Annual prepayment discount percentage |
| amount | Number | Yes | Subscription amount in currency units |
| currency | String | Yes | Currency code (default: 'eur') |
| metadata | Mixed | No | Additional metadata from Stripe or application |
| createdAt | Date | Auto | Auto-managed by Mongoose timestamps |
| updatedAt | Date | Auto | Auto-managed by Mongoose timestamps |

### Indexes

1. **{ userId: 1, planId: 1 }** - Find user's subscriptions for a specific plan
2. **{ stripeSubscriptionId: 1 }** - Webhook event lookups (unique via schema)
3. **{ status: 1 }** - Filter subscriptions by status (active, past_due, etc.)
4. **{ currentPeriodEnd: 1 }** - Find upcoming renewals for notifications
5. **{ createdAt: -1 }** - Sort subscriptions by creation date (history views)

## Type Definitions Exported

- **ISubscription** - Main interface extending Mongoose Document
- **SubscriptionCreateInput** - Input interface for creating subscriptions
- **SubscriptionUpdateInput** - Input interface for updating subscriptions

## Decisions Made

- Followed Payment.ts schema pattern exactly for consistency across payment models
- Used Stripe subscription statuses enum to support all possible states from Stripe
- Made annualPrepaymentDiscount optional field with min/max validation (10-20%)
- Used sparse indexes pattern for efficient queries as data grows
- Stored subscription data locally (not just Stripe IDs) for app resilience and faster queries

## Deviations from Plan

None - plan executed exactly as written. All tasks completed as specified:
- Created server/types/subscription.ts with all required interfaces
- Created server/models/Subscription.ts following Payment.ts pattern
- Verified Payment.ts covers STAT-01 and STAT-02 requirements

## Issues Encountered

None - all tasks completed successfully without issues.

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

**Ready for next phase (07-02: Add Stripe subscription helper utilities)**

- Subscription model and types are in place and can be imported by helper utilities
- Indexes ensure efficient queries for common patterns (userId+planId lookups, status filtering)
- All Stripe subscription statuses supported for webhook handlers in Phase 8
- Annual prepayment discount field ready for Stripe coupon integration

**No blockers or concerns**

---

*Phase: 07-database-api-foundation*
*Plan: 01*
*Completed: 2026-01-25*
