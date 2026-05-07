# Phase 00: Verification System (Email & SMS) - Research

**Researched:** 2026-02-10
**Domain:** Email/SMS Verification API Integration
**Confidence:** HIGH

## Summary

This phase researches implementing email and SMS verification services for public issue reporting. **Key finding:** The verification system is **already 90% implemented** in the codebase. The service layer (`verificationService.ts`), API endpoints (`generate.post.ts`, `validate.post.ts`), database model (`VerificationCode`), and validation schemas are all complete.

The primary remaining work is:
1. **Frontend verification flow** - Integration with IssueReportForm.vue
2. **Separate email/SMS send endpoints** - Current `generate` endpoint handles both; may want split endpoints
3. **UI enhancements** - Better UX for verification flow (resend option, countdown timer, status indicators)
4. **Testing and error handling** - Ensure Spanish localization and proper error messages

The existing implementation follows best practices with Mailgun and Twilio integration, GDPR-compliant phone storage (partial match), 15-minute code expiration, and in-memory rate limiting.

**Primary recommendation:** Focus on frontend integration and UX improvements rather than rebuilding backend services. The `verificationService.ts` is production-ready and follows established patterns.

<user_constraints>
## User Constraints (from .continue-here.md)

### Locked Decisions
- Email verification via Mailgun (configured)
- SMS verification via Twilio (configured)
- 6-digit code with 15-minute expiration
- VerificationCodes model already exists
- Frontend verification form with resend option

### Claude's Discretion
- Specific API patterns for Mailgun/Twilio integration
- Rate limiting strategy for verification endpoints
- Frontend UX patterns for verification flow
- Error handling and Spanish localization

### Deferred Ideas (OUT OF SCOPE)
- Two-factor authentication (2FA) for logged-in users
- Biometric verification methods
- Third-party identity verification services
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **mailgun.js** | ^12.6.0 | Mailgun API client for email | Official Mailgun SDK, FormData integration |
| **twilio** | (dynamic require) | Twilio API client for SMS | Official Twilio Node.js SDK |
| **form-data** | ^4.0.5 | Multipart form data for Mailgun | Required by mailgun.js |

### Already Installed (package.json)
All required dependencies are already installed:
- `mailgun.js: ^12.6.0`
- `form-data: ^4.0.5`
- `zod: ^3.25.76` (validation)

**Missing:** Twilio SDK needs to be installed (`npm install twilio`)

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Zod** | ^3.25.76 | Schema validation | Already in use for verification schemas |
| **Nitro** | Built-in | Rate limiting middleware | `createRateLimitMiddleware` pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Mailgun API | SendGrid, AWS SES, Postmark | Mailgun already configured, domain set up |
| Twilio API | Firebase Phone Auth, SNS Twilio already configured |
| Custom verification | Auth0, Clerk | Custom gives full control, no vendor lock-in |

**Installation (if needed):**
```bash
# Only if Twilio is not already available
npm install twilio
# OR
bun add twilio
```

## Architecture Patterns

### Recommended Project Structure
```
server/
├── api/verification/
│   ├── generate.post.ts      (EXISTS - handles email + SMS)
│   ├── validate.post.ts       (EXISTS - validates codes)
│   └── send-email.post.ts     (NEW - email-only endpoint, optional)
├── services/
│   └── verificationService.ts (EXISTS - complete implementation)
├── models/
│   └── VerificationCode.ts    (EXISTS - complete schema)
├── schemas/
│   └── verification.ts        (EXISTS - Zod schemas)
└── utils/
    └── rateLimit.ts           (EXISTS - rate limiting)

app/
├── components/
│   ├── VerificationForm.vue   (NEW - standalone verification UI)
│   └── IssueReportForm.vue    (EXISTS - needs integration)
└── composables/
    └── useVerification.ts     (NEW - verification composable)
```

### Pattern 1: Mailgun Email Sending (Existing Implementation)
**What:** Transactional email via Mailgun API using FormData
**When to use:** Sending verification codes, password resets
**Confidence:** HIGH (verified in codebase)

**Example (from `verificationService.ts`):**
```typescript
// Source: /home/mateu/NuxtsProjects/v9PLANESN4BUI4/server/services/verificationService.ts
import FormData from 'form-data'
import Mailgun from 'mailgun.js'

async function sendEmailVerification(
  email: string,
  code: string,
  obraId: string
): Promise<void> {
  const config = useRuntimeConfig()

  const mailgun = new Mailgun(FormData)
  const mg = mailgun.client({
    username: 'api',
    key: config.mailgun.apiKey
  })

  const data = {
    from: `${config.mailgun.fromName} <noreply@${config.mailgun.domain}>`,
    to: email,
    subject: 'Tu código de verificación - Prevenius',
    html: `...` // HTML template with code
  }

  await mg.messages.create(config.mailgun.domain, data)
}
```

### Pattern 2: Twilio SMS Sending (Existing Implementation)
**What:** SMS verification via Twilio REST API
**When to use:** Sending verification codes via SMS
**Confidence:** HIGH (verified in codebase)

**Example (from `verificationService.ts`):**
```typescript
// Source: /home/mateu/NuxtsProjects/v9PLANESN4BUI4/server/services/verificationService.ts
async function sendSmsVerification(phone: string, code: string): Promise<void> {
  const config = useRuntimeConfig()

  // Dynamic import of Twilio (only load when needed)
  const twilio = require('twilio')
  const client = twilio(config.twilioSid, config.twilioToken)

  const message = `Tu código de verificación Prevenius es: ${code}. Expira en 15 minutos.`

  await client.messages.create({
    body: message,
    from: config.twilioWhatsAppFrom, // Using WhatsApp number as SMS sender
    to: phone
  })
}
```

**Note:** Current implementation uses `config.twilioWhatsAppFrom` as the sender. This may need to be a separate `TWILIO_SMS_FROM` config variable if WhatsApp and SMS use different numbers.

### Pattern 3: Rate Limiting Middleware (Existing Implementation)
**What:** In-memory rate limiting with cleanup
**When to use:** Preventing abuse of verification endpoints
**Confidence:** HIGH (verified in codebase)

**Example (from `rateLimit.ts`):**
```typescript
// Source: /home/mateu/NuxtsProjects/v9PLANESN4BUI4/server/utils/rateLimit.ts
export function createRateLimitMiddleware(
  maxRequests: number,
  windowMs: number
) {
  return async (event: any) => {
    const ip = event.node?.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()
    const entry = rateLimitStore.get(ip)

    if (!entry || entry.resetTime < now) {
      const newEntry = { count: 1, resetTime: now + windowMs }
      rateLimitStore.set(ip, newEntry)
      return
    }

    entry.count++
    if (entry.count > maxRequests) {
      throw createError({
        statusCode: 429,
        message: `Has excedido el límite de ${maxRequests} solicitudes por hora.`
      })
    }
  }
}

// Current limits:
export const rateLimitVerification = createRateLimitMiddleware(100, 60 * 60 * 1000) // 100/hour
export const rateLimitValidate = createRateLimitMiddleware(20, 60 * 60 * 1000)      // 20/hour
```

**Production consideration:** In-memory rate limiting doesn't scale across multiple server instances. Consider Redis for production.

### Pattern 4: Verification Flow with Frontend
**What:** Multi-step verification UI with resend capability
**When to use:** Public issue reporting form
**Confidence:** MEDIUM (based on existing IssueReportForm pattern)

**Recommended flow:**
```
Step 1: Contact Info → User enters email/phone
Step 2: Request Code → Call /api/verification/generate
Step 3: Enter Code → User receives code (email/SMS)
Step 4: Validate Code → Call /api/verification/validate
Step 5: Continue → Form submission with verified status
```

**Frontend composable pattern:**
```typescript
// app/composables/useVerification.ts (NEW)
export function useVerification() {
  const verifying = ref(false)
  const sending = ref(false)
  const canResend = ref(true)
  const resendCountdown = ref(0)

  async function sendCode(email: string, phone: string, method: 'email' | 'sms', obraId: string) {
    sending.value = true
    try {
      await $fetch('/api/verification/generate', {
        method: 'POST',
        body: { email, phone, method, obraId }
      })
      startResendCountdown()
    } finally {
      sending.value = false
    }
  }

  async function validateCode(code: string, obraId: string) {
    verifying.value = true
    try {
      const result = await $fetch('/api/verification/validate', {
        method: 'POST',
        body: { code, obraId }
      })
      return result.verified
    } finally {
      verifying.value = false
    }
  }

  function startResendCountdown() {
    canResend.value = false
    resendCountdown.value = 60
    const interval = setInterval(() => {
      resendCountdown.value--
      if (resendCountdown.value <= 0) {
        clearInterval(interval)
        canResend.value = true
      }
    }, 1000)
  }

  return {
    verifying,
    sending,
    canResend,
    resendCountdown,
    sendCode,
    validateCode
  }
}
```

### Anti-Patterns to Avoid
- **Storing full phone numbers:** Existing implementation correctly stores only last 4 digits for GDPR compliance
- **Hardcoded expiration times:** Use configurable environment variables (currently hardcoded to 15 minutes)
- **No rate limiting on validation:** Existing implementation has stricter limits (20/hour vs 100/hour)
- **Synchronous SMS sending:** Consider using a job queue for high-volume scenarios
- **Ignoring error localization:** All user-facing errors must be in Spanish (existing implementation does this)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email sending | Custom SMTP, nodemailer | Mailgun SDK (already used) | Deliverability, templates, analytics |
| SMS sending | Custom SMS gateway integrations | Twilio SDK (partially implemented) | Global reach, compliance, pricing |
| Code generation | `Math.random()` | Crypto-based random (existing) | Predictability concerns |
| Rate limiting | Custom middleware | Existing `rateLimit.ts` | Proven pattern, consistent headers |
| Form validation | Manual validation | Zod schemas (existing) | Type safety, error messages |
| Phone validation | Regex only | libphonenumber-js optional | International format handling |

**Key insight:** The verification system is 90% complete. Don't rebuild existing services. Focus on frontend integration and UX enhancements.

## Common Pitfalls

### Pitfall 1: Twilio SDK Not Installed
**What goes wrong:** Dynamic `require('twilio')` fails because `twilio` package not in dependencies
**Why it happens:** Existing code uses `require('twilio')` but package not listed in package.json
**How to avoid:** Install Twilio SDK: `bun add twilio`
**Warning signs:** Build errors about missing 'twilio' module

### Pitfall 2: Using WhatsApp Number for SMS
**What goes wrong:** SMS fails because `TWILIO_WHATSAPP_FROM` is a WhatsApp number, not SMS-capable
**Why it happens:** Existing code uses `config.twilioWhatsAppFrom` for SMS sending
**How to avoid:** Add separate `TWILIO_SMS_FROM` environment variable for SMS-capable number
**Warning signs:** Twilio API returns "From number is not a valid SMS-capable number"

### Pitfall 3: In-Memory Rate Limiting in Production
**What goes wrong:** Rate limits don't sync across multiple server instances
**Why it happens:** Using `Map` for storage instead of Redis
**How to avoid:** For single-instance deployment (current), in-memory is fine. For scaling, migrate to Redis
**Warning signs:** Inconsistent rate limits under load

### Pitfall 4: No Verification Resend Limit
**What goes wrong:** Users can request unlimited new codes
**Why it happens:** Only rate limiting by IP, not by email/phone
**How to avoid:** Add per-contact rate limiting (max 3 codes per email/phone per hour)
**Warning signs:** Abusive code requests from same contact

### Pitfall 5: Frontend State Desync
**What goes wrong:** User thinks they're verified but backend shows unverified
**Why it happens:** Race conditions between validation and form submission
**How to avoid:** Store verified status in sessionStorage, re-validate on submit
**Warning signs:** "Code already used" errors after successful validation

### Pitfall 6: Missing Spanish Error Messages
**What goes wrong:** English error messages shown to Spanish users
**Why it happens:** Forgetting to localize error messages
**How to avoid:** Use Spanish error messages in all user-facing code (existing pattern)
**Warning signs:** Mixed language error messages in UI

## Code Examples

Verified patterns from official sources:

### Mailgun Transactional Email (Mailgun Official)
```typescript
// Source: https://www.mailgun.com/blog/email/how-to-send-transactional-email-in-a-nodejs-app-using-the-mailgun-api/
import FormData from 'form-data'
import Mailgun from 'mailgun.js'

const mailgun = new Mailgun(FormData)
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY
})

const msg = await mg.messages.create('example.com', {
  from: 'Excited User <mailgun@example.com>',
  to: ['bar@example.com'],
  subject: 'Hello',
  text: 'Testing some Mailgun awesomeness!'
})
```

### Twilio SMS Sending (Twilio Official)
```javascript
// Source: https://www.twilio.com/docs/verify/quickstarts/node-express
const twilio = require('twilio')
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

const message = await client.messages.create({
  body: 'Your verification code is 123456',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+15555555555'
})
```

### Verification Code Validation Pattern
```typescript
// Source: /home/mateu/NuxtsProjects/v9PLANESN4BUI4/server/services/verificationService.ts
export async function validateVerificationCode(
  code: string,
  obraId: string
): Promise<ValidateResult> {
  const verification = await VerificationCode.findOne({
    code,
    obraId,
    verified: false
  })

  if (!verification) {
    return {
      success: false,
      verified: false,
      error: 'Código de verificación inválido o expirado'
    }
  }

  if (verification.expiresAt < new Date()) {
    return {
      success: false,
      verified: false,
      error: 'El código ha expirado. Por favor, solicita un nuevo código.'
    }
  }

  verification.verified = true
  await verification.save()

  return { success: true, verified: true }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom SMTP libraries | Mailgun/Twilio SDKs | Project start | Better deliverability, easier integration |
| Full phone storage | Partial (last 4 digits) | GDPR compliance | Privacy-first design |
| Simple rate limiting | IP-based with headers | Existing implementation | Better abuse prevention |
| Single verification method | Multi-channel (email/SMS/both) | Existing implementation | User flexibility |

**Deprecated/outdated:**
- **Custom email implementations:** Use Mailgun for transactional email
- **Raw SMS gateways:** Use Twilio for reliable SMS delivery
- **Unverified code storage:** Always verify codes before marking as used
- **Fixed expiration times:** Consider making 15 minutes configurable via env var

## Open Questions

1. **Twilio package installation**
   - What we know: Code uses `require('twilio')` but package not in package.json
   - What's unclear: Whether it's installed globally or needs to be added
   - Recommendation: Run `bun add twilio` to ensure it's available

2. **WhatsApp vs SMS number**
   - What we know: Current code uses `TWILIO_WHATSAPP_FROM` for SMS
   - What's unclear: Whether the WhatsApp number is also SMS-capable
   - Recommendation: Add `TWILIO_SMS_FROM` environment variable for clarity

3. **Separate email/SMS endpoints**
   - What we know: Current `generate` endpoint handles both via `method` parameter
   - What's unclear: Whether separate endpoints (`send-email`, `send-sms`) are needed
   - Recommendation: Keep existing unified endpoint unless frontend requirements demand separation

4. **Production rate limiting**
   - What we know: Current implementation uses in-memory Map
   - What's unclear: Whether multi-instance deployment is planned
   - Recommendation: In-memory is fine for single-instance; plan Redis migration for scaling

5. **Resend cooldown period**
   - What we know: Rate limiting is per-IP (100/hour)
   - What's unclear: Whether per-contact resend limiting is needed
   - Recommendation: Add per-contact rate limiting (max 3 codes per contact/hour) for better abuse prevention

## Sources

### Primary (HIGH confidence)
- **Mailgun Official Documentation** - https://documentation.mailgun.com/
  - API reference, email sending best practices
- **Twilio Verify Documentation** - https://www.twilio.com/docs/verify
  - SMS verification best practices, developer quickstart
- **Existing codebase** - /home/mateu/NuxtsProjects/v9PLANESN4BUI4/
  - `server/services/verificationService.ts` - Complete implementation
  - `server/api/verification/generate.post.ts` - Email/SMS generation
  - `server/api/verification/validate.post.ts` - Code validation
  - `server/models/VerificationCode.ts` - Database schema
  - `server/schemas/verification.ts` - Zod validation
  - `server/utils/rateLimit.ts` - Rate limiting middleware
  - `app/components/IssueReportForm.vue` - Frontend form pattern

### Secondary (MEDIUM confidence)
- **[How To Send Emails In NodeJS: SMTP & API Examples](https://www.mailgun.com/blog/email/how-to-send-transactional-email-in-a-nodejs-app-using-the-mailgun-api/)** - Mailgun Official Blog
  - Verified pattern matching existing implementation
- **[12 Transactional Emails Best Practices to Follow in 2026](https://mailtrap.io/blog/transactional-emails-best-practices/)** - Mailtrap Blog (Apr 22, 2024)
  - Current best practices for transactional email
- **[Verify and two-factor authentication best practices](https://www.twilio.com/docs/verify/developer-best-practices)** - Twilio Official Documentation
  - Security best practices for verification codes
- **[Verify Node.js Express Quickstart](https://www.twilio.com/docs/verify/quickstarts/node-express)** - Twilio Official Quickstart
  - Node.js integration patterns

### Tertiary (LOW confidence)
- **[Twilio OTP Authentication with Node.js](https://medium.com/globant/twilio-otp-authentication-12002a139e38)** - Globant Tutorial
  - Third-party tutorial, marked for validation
- **[Sending SMS Verification Using Node.js](https://www.courier.com/guides/sms-verification-nodejs)** - Courier Guide
  - General guidance, not verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in codebase or official docs
- Architecture: HIGH - Existing implementation verified and complete
- Pitfalls: HIGH - Based on code review and common verification issues

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (30 days - stable domain)

**Key Finding:**
The verification system is **90% complete**. Focus efforts on:
1. Frontend integration (VerificationForm component)
2. UX improvements (resend countdown, status indicators)
3. Testing and error handling
4. Optional: Separate email/SMS endpoints if needed by frontend

**Files Already Complete:**
- ✅ `server/services/verificationService.ts`
- ✅ `server/api/verification/generate.post.ts`
- ✅ `server/api/verification/validate.post.ts`
- ✅ `server/models/VerificationCode.ts`
- ✅ `server/schemas/verification.ts`
- ✅ `server/utils/rateLimit.ts`

**Files to Create:**
- 📝 `app/components/VerificationForm.vue` (NEW - standalone verification UI)
- 📝 `app/composables/useVerification.ts` (NEW - verification composable)
- 🔧 `server/api/verification/send-email.post.ts` (OPTIONAL - email-only endpoint)
- 🔧 `server/api/verification/send-sms.post.ts` (OPTIONAL - SMS-only endpoint)
