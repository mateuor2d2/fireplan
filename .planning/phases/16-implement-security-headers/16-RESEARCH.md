# Phase 16 Research: Implement Security Headers

**Research Date:** 2026-03-20  
**Phase:** 16-implement-security-headers  
**Objective:** Close 5 security gaps from Phase 09 audit for PCI DSS SAQ A compliance

## Executive Summary

This phase addresses requirements **SEC-01 through SEC-05** from the security audit. Research reveals:

1. **Webhook signature verification (SEC-05)** - ✅ Already fully implemented in Phase 8.2
2. **Stripe Checkout PCI compliance (SEC-01)** - ✅ Already implemented via Stripe Checkout
3. **No card data storage (SEC-02)** - ✅ Already implemented (Stripe handles all card data)
4. **CSP headers (SEC-03)** - ⚠️ Partially implemented in Phase 9.3 but needs verification/reenhancement
5. **HTTPS enforcement (SEC-04)** - ⚠️ Needs implementation in current nuxt.config.ts

## Requirement Analysis

### SEC-01: Stripe Checkout for PCI DSS SAQ A compliance
**Status:** ✅ COMPLETE

Stripe Checkout is already implemented and provides PCI DSS SAQ A compliance:
- Hosted checkout at `checkout.stripe.com` handles all card data
- No card data ever touches our servers
- Implementation in `server/api/payments/create-checkout.post.ts`

**PCI Compliance Level:** SAQ A (Self-Assessment Questionnaire A) - simplest compliance level

### SEC-02: No raw card data storage
**Status:** ✅ COMPLETE

Verified through codebase review:
- No card number, CVV, or expiration date fields in any models
- Payment model only stores: `stripePaymentIntentId`, `stripeCustomerId`, `amount`, `currency`, `status`
- Subscription model only stores: `stripeSubscriptionId`, `stripeCustomerId`, `status`
- Stripe Elements hosted on Stripe's domain handle all sensitive input

### SEC-03: CSP headers whitelist Stripe domains
**Status:** ⚠️ NEEDS VERIFICATION/REENHANCEMENT

Phase 9.3 implemented CSP headers in nuxt.config.ts (per 09-03-SUMMARY.md), but the **current nuxt.config.ts does NOT contain security headers configuration**. The CSP configuration from Phase 9.3 appears to have been lost or removed during subsequent refactoring.

**Required CSP Directives for Stripe:**
```
script-src: js.stripe.com (Stripe.js library)
frame-src: js.stripe.com, checkout.stripe.com (Checkout iframe)
form-src: checkout.stripe.com (Payment form submission)
connect-src: api.stripe.com (Stripe API calls)
img-src: *.stripe.com, *.stripe.network (Payment icons)
```

**Implementation Location:** `nuxt.config.ts` using Nuxt's `routeRules` or `nitro.headers`

### SEC-04: HTTPS only in production
**Status:** ⚠️ NEEDS IMPLEMENTATION

**Current State:** No HSTS header configured in nuxt.config.ts

**Required Headers:**
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (production only)
- Should be production-only to avoid development issues

**Implementation Options:**
1. Nuxt routeRules with environment-based conditions
2. Nitro server middleware for dynamic header injection
3. Vercel/Render platform-level HTTPS enforcement (already active)

### SEC-05: Webhook signature verification mandatory on all events
**Status:** ✅ COMPLETE

Fully implemented in `server/api/webhooks/stripe.post.ts`:
```typescript
// Lines 76-90: Signature verification
stripeEvent = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  stripeWebhookSecret
)
```

Features:
- Raw body reading preserved for signature validation
- Returns 400 for invalid signatures
- All events verified before processing

## Implementation Plan

### Task 1: Restore/Enhance CSP Headers (SEC-03)
**Priority:** HIGH
**Effort:** 30 minutes

Add to `nuxt.config.ts`:
```typescript
nitro: {
  // ... existing config
  routeRules: {
    '/**': {
      headers: {
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' js.stripe.com",
          "style-src 'self' 'unsafe-inline'",
          "frame-src 'self' js.stripe.com checkout.stripe.com",
          "form-src 'self' checkout.stripe.com",
          "connect-src 'self' api.stripe.com",
          "img-src 'self' data: *.stripe.com *.stripe.network",
          "font-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "frame-ancestors 'self'",
          process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : ""
        ].filter(Boolean).join('; '),
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self)'
      }
    }
  }
}
```

### Task 2: Add HSTS Header for HTTPS Enforcement (SEC-04)
**Priority:** HIGH
**Effort:** 15 minutes

Add production-only HSTS header:
```typescript
// In routeRules, conditionally add HSTS
...(process.env.NODE_ENV === 'production' && {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
})
```

### Task 3: Verify All Security Requirements
**Priority:** MEDIUM
**Effort:** 20 minutes

Create verification checklist:
- [ ] CSP headers present in production build
- [ ] Stripe domains whitelisted in CSP
- [ ] HSTS header present in production
- [ ] X-Frame-Options prevents clickjacking
- [ ] Webhook signature verification active
- [ ] No card data in database schemas
- [ ] Stripe Checkout flow working

### Task 4: PCI Compliance Documentation
**Priority:** MEDIUM
**Effort:** 15 minutes

Document compliance status for audit trail:
- PCI SAQ A compliance confirmation
- Security headers configuration
- Data handling practices

## Technical Considerations

### SSR Disabled Impact
The project has `ssr: false` in nuxt.config.ts. This means:
- CSP headers are still effective (applied at server level via Nitro)
- Security headers work for initial HTML document load
- Client-side navigation maintains security context

### Environment Variables Needed
Ensure these are set in production:
```
NODE_ENV=production
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Testing Strategy
1. **CSP Testing:** Use browser DevTools → Network → Response headers
2. **HSTS Testing:** `curl -I https://your-domain.com` check for Strict-Transport-Security
3. **PCI Compliance:** Review Stripe Dashboard → Developers → Webhooks for signature verification status

## Success Criteria Verification

| Criteria | Current Status | Action Needed |
|----------|---------------|---------------|
| CSP headers whitelist Stripe domains | ⚠️ Missing | Add to nuxt.config.ts |
| HSTS header enforces HTTPS | ⚠️ Missing | Add to nuxt.config.ts |
| X-Frame-Options prevents clickjacking | ⚠️ Missing | Add to nuxt.config.ts |
| Webhook signature verification mandatory | ✅ Complete | Verify existing |
| Security headers pass PCI compliance | ⚠️ Partial | Complete SEC-03, SEC-04 |

## Dependencies & Prerequisites

No additional dependencies required. Uses:
- Nuxt's built-in Nitro server for header configuration
- Existing Stripe integration
- Existing webhook infrastructure

## Risk Assessment

**LOW RISK** - This phase is primarily verification and restoration of existing security configurations:
- No breaking changes to existing functionality
- Headers are additive security measures
- Can be rolled back by removing routeRules
- Well-tested patterns from Phase 9.3

## Recommended Plan Structure

**Plan 16-01:** Restore CSP Headers with Stripe Domain Whitelisting
- Add CSP configuration to nuxt.config.ts
- Include all Stripe-required directives
- Environment-based policy (dev vs production)

**Plan 16-02:** Implement HSTS and Additional Security Headers
- Add Strict-Transport-Security (production only)
- Add X-Frame-Options, X-Content-Type-Options
- Add Referrer-Policy and Permissions-Policy

**Plan 16-03:** Security Verification and PCI Documentation
- Verify all headers present in production build
- Test Stripe integration with CSP enabled
- Document PCI SAQ A compliance status

## Related Files

| File | Purpose | Status |
|------|---------|--------|
| `nuxt.config.ts` | Security headers configuration | ⚠️ Needs update |
| `server/api/webhooks/stripe.post.ts` | Webhook signature verification | ✅ Complete |
| `server/models/Payment.ts` | Payment data (no card data) | ✅ Complete |
| `server/models/Subscription.ts` | Subscription data (no card data) | ✅ Complete |
| `.planning/phases/09-access-control-security/09-03-SUMMARY.md` | Previous CSP implementation | 📋 Reference |

## References

1. [PCI DSS SAQ A Requirements](https://www.pcisecuritystandards.org/)
2. [Stripe Security Best Practices](https://stripe.com/docs/security)
3. [Nuxt Security Headers](https://nuxt.com/docs/guide/concepts/security)
4. [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
5. [HSTS Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)

---

**Research Complete** - Ready for planning phase execution
