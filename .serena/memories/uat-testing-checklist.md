# Manual UAT Checklist - Phases 10 & 11

**Date:** 2026-02-09
**Server:** http://localhost:3000
**Goal:** Test payment and subscription flows with Stripe test mode

## Prerequisites

- [ ] Dev server running on http://localhost:3000
- [ ] Stripe test mode keys configured (STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY)
- [ ] Test user account available (or create new one)
- [ ] At least one safety plan created for testing

## Phase 10: Payment Flow Testing

### Test 1: Print Button Payment Guard

1. Navigate to `/protected/planes/[id]/impresion`
2. **Expected:** See "Imprimir" button
3. **Expected:** See payment status badge (should show "Pendiente" for unpaid plan)
4. Click "Imprimir" button
5. **Expected:** Redirect to `/protected/payment?planId=[id]`

### Test 2: Stripe Checkout Flow

1. On payment page (`/protected/payment`)
2. **Expected:** See loading spinner briefly
3. **Expected:** Redirect to Stripe Checkout page
4. **Expected:** See plan price (€29.00) and payment form

**Stripe Test Card:** `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- Postal: Any 5 digits (e.g., 12345)

5. Fill in test card details and complete payment
6. **Expected:** Redirect back to `/protected/planes/[id]/impresion?payment=success`

### Test 3: Post-Payment Flow

1. After successful payment return
2. **Expected:** See green success toast ("¡Pago completado!")
3. **Expected:** Payment status badge changes to "Pagado" (green)
4. **Expected:** PDF generation button is now enabled
5. **Expected:** Can generate/download PDF

### Test 4: Error Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Already paid plan | Show "Pagado" badge, allow PDF generation |
| Invalid planId | Show error, redirect back to plans list |
| Payment canceled | Return to plan page, show "pending" status |
| Payment failed | Show "Fallido" badge, offer retry |

## Phase 11: Subscription Flow Testing

### Test 1: Subscription Card Display

1. Navigate to `/protected/planes/[id]` (dashboard)
2. Scroll to "Suscripción QR" section
3. **Expected:** See SubscriptionCard component
4. **Expected:** For plans without subscription: Show empty state with "Suscribirse" button

### Test 2: Subscribe Flow

1. Click "Suscribirse" button
2. **Expected:** Redirect to Stripe Checkout for subscription
3. **Expected:** See monthly subscription amount
4. Complete with test card (`4242 4242 4242 4242`)
5. **Expected:** Redirect with `?subscription=new` query param
6. **Expected:** SubscriptionCard now shows "Activa" badge (green)
7. **Expected:** Shows next billing date and amount

### Test 3: Pause Subscription

1. On active subscription, click "Pausar" button
2. **Expected:** PauseDialog modal appears
3. **Expected:** "Indefinida" toggle is checked by default
4. Click "Confirmar pausa"
5. **Expected:** Success toast
6. **Expected:** Badge changes to "Pausada" (yellow)

### Test 4: Resume Subscription

1. On paused subscription, click "Reanudar" button
2. **Expected:** One-click resume (no confirmation needed)
3. **Expected:** Success toast
4. **Expected:** Badge changes back to "Activa" (green)

### Test 5: Cancel Subscription

1. On active subscription, click "Cancelar" button
2. **Expected:** CancelConfirmDialog modal appears
3. **Expected:** Shows expiry date (end of current period)
4. Click "Confirmar cancelación"
5. **Expected:** Success toast
6. **Expected:** Badge changes to "Cancelada" (red)
7. **Expected:** Shows "Expira el [date]" message

### Test 6: Customer Portal

1. On active subscription, click "Gestionar pago" button
2. **Expected:** Redirect to Stripe Customer Portal
3. **Expected:** Can update payment method
4. **Expected:** Can view invoice history
5. Close portal or click "Return to site"
6. **Expected:** Redirect back with `?portal_return=true`
7. **Expected:** Green success toast ("Cambios guardados")

## Stripe Test Cards Reference

| Card Number | Result | Use For |
|-------------|--------|---------|
| `4242 4242 4242 4242` | Success | Standard successful payment |
| `4000 0000 0000 0002` | Card declined | Test decline handling |
| `4000 0000 0000 9995` | Insufficient funds | Test dunning flow |
| `4000 0025 0000 3155` | Requires authentication | Test 3D Secure |

## Test Results

### Phase 10: Payment Flow
- [ ] Test 1: Print Button Payment Guard - PASS/FAIL
- [ ] Test 2: Stripe Checkout Flow - PASS/FAIL
- [ ] Test 3: Post-Payment Flow - PASS/FAIL
- [ ] Test 4: Error Cases - PASS/FAIL

### Phase 11: Subscription Flow
- [ ] Test 1: Subscription Card Display - PASS/FAIL
- [ ] Test 2: Subscribe Flow - PASS/FAIL
- [ ] Test 3: Pause Subscription - PASS/FAIL
- [ ] Test 4: Resume Subscription - PASS/FAIL
- [ ] Test 5: Cancel Subscription - PASS/FAIL
- [ ] Test 6: Customer Portal - PASS/FAIL

## Notes

Record any issues, errors, or unexpected behavior during testing:

---

**UAT Completion:** Once all tests pass, update STATE.md and proceed to Phase 12.
