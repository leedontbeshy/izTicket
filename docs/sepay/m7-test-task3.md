# M7 Task 3 — API Test Guide (Webhook Handler)

Purpose:
- Test `POST /payments/sepay/webhook`: auth verification, payload validation, idempotency, WEBHOOK_UNKNOWN, WEBHOOK_IGNORED, on-time PAID, late PAYMENT_REVIEW.

---

## 1. Environment Setup

Add to `apps/api/.env` (or create if missing entries):

```
SEPAY_WEBHOOK_AUTH_MODE=apikey
SEPAY_WEBHOOK_API_KEY=test-secret-key
SEPAY_BANK_CODE=VCB
SEPAY_BANK_ACCOUNT_NUMBER=1234567890
```

Restart server after editing `.env`:
```
pnpm --filter api dev
```

---

## 2. Setup — Create payments for testing

Need two separate orders with INITIATED payments.

### Setup A — Order for TC-05 (ignored) and TC-06 (on-time success)

Follow steps 1–9 from `m7-test-task2.md` to create a fresh `PENDING_PAYMENT` order.
Save `id` → `orderId_A`.

Then initiate payment:
```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{customer_token}}
```
```json
{ "orderId": "{{orderId_A}}" }
```
Save `providerReference` (e.g. `IZT0TFVZAZ1`) → `ref_A`.
Save `amountVnd` (e.g. `300000`) → `amount_A`.

### Setup B — Order for TC-07 (late payment)

Repeat steps 1–9 from `m7-test-task2.md` (same event is fine, create new reservation + order).
Save `id` → `orderId_B`.

Initiate payment for Order B:
```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{customer_token}}
```
```json
{ "orderId": "{{orderId_B}}" }
```
Save `providerReference` → `ref_B`.

Force-expire Order B via DB:
```sql
UPDATE orders
SET status = 'EXPIRED', expires_at = NOW() - INTERVAL '1 minute'
WHERE id = '<orderId_B>';
```

---

## 3. Test Cases — POST /payments/sepay/webhook

All commands use PowerShell. Replace placeholders with real values.

---

### TC-01: Missing auth header → 401

```powershell
$body = '{"id":101,"accountNumber":"1234567890","transferType":"in","transferAmount":300000}'
curl.exe -s -X POST http://localhost:3000/api/v1/payments/sepay/webhook `
  -H "Content-Type: application/json" `
  -d $body
```

Expected: `401 Unauthorized`, message `"Webhook signature invalid."`
Proves: verifier rejects missing Authorization header.

---

### TC-02: Wrong API key → 401

```powershell
$body = '{"id":102,"accountNumber":"1234567890","transferType":"in","transferAmount":300000}'
curl.exe -s -X POST http://localhost:3000/api/v1/payments/sepay/webhook `
  -H "Content-Type: application/json" `
  -H "Authorization: Apikey wrong-key" `
  -d $body
```

Expected: `401 Unauthorized`
Proves: timing-safe API key comparison rejects bad key.

---

### TC-03: Bad payload (missing required fields) → 200 silent

```powershell
$body = '{"id":103,"transferType":"in"}'
curl.exe -s -X POST http://localhost:3000/api/v1/payments/sepay/webhook `
  -H "Content-Type: application/json" `
  -H "Authorization: Apikey test-secret-key" `
  -d $body
```

Expected: `200 OK`, `{ "success": true }`
Proves: Zod parse failure silently returns 200 (no DB writes, no error returned to SePay).

---

### TC-04: No `code` field (unknown transfer, no matching payment) → 200, WEBHOOK_UNKNOWN logged

```powershell
$body = '{"id":104,"accountNumber":"1234567890","transferType":"in","transferAmount":300000}'
curl.exe -s -X POST http://localhost:3000/api/v1/payments/sepay/webhook `
  -H "Content-Type: application/json" `
  -H "Authorization: Apikey test-secret-key" `
  -d $body
```

Expected: `200 OK`, `{ "success": true }`

DB verify:
```sql
SELECT event_type, processed_at FROM payment_events WHERE provider_event_id = '104';
```
Expected: one row, `event_type = 'WEBHOOK_UNKNOWN'`, `processed_at` set.

---

### TC-05: Duplicate of TC-04 (same `id: 104`) → 200 no-op, idempotency

```powershell
$body = '{"id":104,"accountNumber":"1234567890","transferType":"in","transferAmount":300000}'
curl.exe -s -X POST http://localhost:3000/api/v1/payments/sepay/webhook `
  -H "Content-Type: application/json" `
  -H "Authorization: Apikey test-secret-key" `
  -d $body
```

Expected: `200 OK`

DB verify:
```sql
SELECT COUNT(*) FROM payment_events WHERE provider_event_id = '104';
```
Expected: still `1` row (no duplicate inserted).
Proves: idempotency guard blocks re-processing of already-processed event.

---

### TC-06: Valid `code` but wrong amount → 200, WEBHOOK_IGNORED

Replace `<ref_A>` with `providerReference` from Setup A.
Replace `<amount_A>` with `amountVnd - 1` (one VND short).

```powershell
$body = '{"id":105,"accountNumber":"1234567890","transferType":"in","transferAmount":1,"code":"<ref_A>"}'
curl.exe -s -X POST http://localhost:3000/api/v1/payments/sepay/webhook `
  -H "Content-Type: application/json" `
  -H "Authorization: Apikey test-secret-key" `
  -d $body
```

Expected: `200 OK`

DB verify:
```sql
SELECT event_type FROM payment_events WHERE provider_event_id = '105';
```
Expected: `event_type = 'WEBHOOK_IGNORED'`
Proves: underpayment guard fires.

---

### TC-07: Valid on-time payment → 200, order PAID

Replace `<ref_A>` and `<amount_A>` with values from Setup A.

```powershell
$body = '{"id":200,"accountNumber":"1234567890","transferType":"in","transferAmount":<amount_A>,"code":"<ref_A>","referenceCode":"SEPAY-TXN-200"}'
curl.exe -s -X POST http://localhost:3000/api/v1/payments/sepay/webhook `
  -H "Content-Type: application/json" `
  -H "Authorization: Apikey test-secret-key" `
  -d $body
```

Expected: `200 OK`, `{ "success": true }`

DB verify:
```sql
SELECT status, paid_at FROM orders WHERE id = '<orderId_A>';
SELECT status, succeeded_at FROM payments WHERE order_id = '<orderId_A>';
SELECT event_type, processed_at FROM payment_events WHERE provider_event_id = '200';
```
Expected:
- `orders.status = 'PAID'`, `paid_at` set
- `payments.status = 'SUCCEEDED'`, `succeeded_at` set
- `payment_events.event_type = 'PAYMENT_SUCCESS'`, `processed_at` set

Also verify domain event was published (check server logs for `payment.succeeded` event or M8 handler fires when implemented).

---

### TC-08: Duplicate of TC-07 (same `id: 200`) → 200 no-op

```powershell
$body = '{"id":200,"accountNumber":"1234567890","transferType":"in","transferAmount":<amount_A>,"code":"<ref_A>","referenceCode":"SEPAY-TXN-200"}'
curl.exe -s -X POST http://localhost:3000/api/v1/payments/sepay/webhook `
  -H "Content-Type: application/json" `
  -H "Authorization: Apikey test-secret-key" `
  -d $body
```

Expected: `200 OK`

DB verify:
```sql
SELECT COUNT(*) FROM payment_events WHERE provider_event_id = '200';
```
Expected: still `1` row.
Proves: success webhook not re-processed; no duplicate domain event emitted.

---

### TC-09: Late payment (expired order) → 200, PAYMENT_REVIEW

Order B was force-expired in Setup B. Replace `<ref_B>` with `providerReference` from Setup B.

```powershell
$body = '{"id":300,"accountNumber":"1234567890","transferType":"in","transferAmount":300000,"code":"<ref_B>","referenceCode":"SEPAY-TXN-300"}'
curl.exe -s -X POST http://localhost:3000/api/v1/payments/sepay/webhook `
  -H "Content-Type: application/json" `
  -H "Authorization: Apikey test-secret-key" `
  -d $body
```

Expected: `200 OK`

DB verify:
```sql
SELECT status FROM orders WHERE id = '<orderId_B>';
SELECT status FROM payments WHERE order_id = '<orderId_B>';
SELECT event_type FROM payment_events WHERE provider_event_id = '300';
```
Expected:
- `orders.status = 'PAYMENT_REVIEW'`
- `payments.status = 'REQUIRES_REVIEW'`
- `payment_events.event_type = 'LATE_PAYMENT'`

---

## 4. Pass Criteria Summary

| TC | Auth | Payload | Expected | Proves |
|----|------|---------|----------|--------|
| TC-01 | None | Any | 401 | Auth required |
| TC-02 | Wrong key | Any | 401 | Timing-safe key check |
| TC-03 | OK | Missing fields | 200, silent | Zod parse fail → 200 no-op |
| TC-04 | OK | No `code` | 200, WEBHOOK_UNKNOWN | Unknown transfer logged |
| TC-05 | OK | Same id as TC-04 | 200, no DB write | Idempotency |
| TC-06 | OK | Short amount | 200, WEBHOOK_IGNORED | Underpayment guard |
| TC-07 | OK | Valid, on-time | 200, order PAID | Happy path |
| TC-08 | OK | Same id as TC-07 | 200, no DB write | Success idempotency |
| TC-09 | OK | Valid, expired order | 200, PAYMENT_REVIEW | Late payment path |

All 9 pass → Task 3 complete.
