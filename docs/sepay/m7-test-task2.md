# M7 Task 2 — API Test Guide

Purpose
- Verify `POST /payments/sepay/create`: ownership, status checks, idempotency, and successful payment initiation with QR/transfer instructions.

Prerequisites
- Server running: `pnpm --filter api dev`
- `.env` has `SEPAY_BANK_CODE`, `SEPAY_BANK_ACCOUNT_NUMBER` set (required for QR generation). Use any non-empty values for local testing.
- Postman env vars: `api`, `customer_token`, `organizer_token`, `admin_token`
- A `PENDING_PAYMENT` order with its `orderId`. Follow steps 1–9 from `m6-test-task3.md` to create one, then save `id` → `orderId`.

---

## Setup — Create a fresh PENDING_PAYMENT order

Reservations expire in 15 min. Create reservation and order in one sitting, then run TC-01 through TC-05 immediately.

1) Login as organizer
```
POST {{api}}/auth/login
```
```json
{ "email": "organizer@izticket.local", "password": "Password123!" }
```
Save `accessToken` → `organizer_token`.

2) Create event
```
POST {{api}}/organizer/events
Authorization: Bearer {{organizer_token}}
```
```json
{
  "title": "Payment Test Event",
  "description": "M7 Task 2 test",
  "category": "music",
  "venue": {
    "name": "Test Hall",
    "address": "1 Test St",
    "city": "Hanoi",
    "district": "C1",
    "mapUrl": "https://map.example"
  },
  "startsAt": "2026-07-01T09:00:00.000Z",
  "endsAt": "2026-07-01T18:00:00.000Z"
}
```
Save `id` → `eventId`.

3) Create ticket type
```
POST {{api}}/organizer/events/{{eventId}}/ticket-types
Authorization: Bearer {{organizer_token}}
```
```json
{
  "name": "Standard",
  "description": "Standard seat",
  "price": 150000,
  "totalQuantity": 50,
  "maxPerOrder": 5,
  "saleStartsAt": "2026-05-01T00:00:00.000Z",
  "saleEndsAt": "2026-12-31T00:00:00.000Z"
}
```
Save `id` → `ticketTypeId`.

4) Submit event for review
```
POST {{api}}/organizer/events/{{eventId}}/submit
Authorization: Bearer {{organizer_token}}
```
Expected: `{ "status": "PENDING_REVIEW" }`

5) Login as admin
```
POST {{api}}/auth/login
```
```json
{ "email": "admin@izticket.local", "password": "Password123!" }
```
Save `accessToken` → `admin_token`.

6) Approve event
```
POST {{api}}/admin/events/{{eventId}}/approve
Authorization: Bearer {{admin_token}}
```
Expected: `{ "status": "PUBLISHED" }`

7) Login as customer
```
POST {{api}}/auth/login
```
```json
{ "email": "customer@izticket.local", "password": "Password123!" }
```
Save `accessToken` → `customer_token`.

8) Create reservation
```
POST {{api}}/reservations
Authorization: Bearer {{customer_token}}
```
```json
{
  "eventId": "{{eventId}}",
  "items": [{ "ticketTypeId": "{{ticketTypeId}}", "quantity": 2 }]
}
```
Expected: `201`. Save `id` → `reservationId`.

9) Create order
```
POST {{api}}/orders
Authorization: Bearer {{customer_token}}
```
```json
{ "reservationId": "{{reservationId}}" }
```
Expected: `201`, `status = "PENDING_PAYMENT"`, `totalAmountVnd = 300000`.
Save `id` → `orderId`.

Proceed immediately to test cases below.

---

## Test Cases — POST /payments/sepay/create

### TC-01: Order not found → 404

```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{customer_token}}
```
```json
{ "orderId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }
```
Expected: `404 Not Found`, message `"Order was not found."`

---

### TC-02: Order belongs to another customer → 403

Register or use a second customer account. Login as second customer, save token → `customer2_token`.
```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{customer2_token}}
```
```json
{ "orderId": "{{orderId}}" }
```
Expected: `403 Forbidden`, message contains permission error.

---

### TC-03: Order status not PENDING_PAYMENT → 409

Use an `orderId` whose status is `EXPIRED` or `PAID` (from previous M6 expiry tests, or force-expire via DB):
```sql
UPDATE orders SET status = 'EXPIRED' WHERE id = '<orderId>';
```
```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{customer_token}}
```
```json
{ "orderId": "<expired_orderId>" }
```
Expected: `409 Conflict`, message `"Order is not in PENDING_PAYMENT status."`

---

### TC-04: Happy path — payment initiated → 201

```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{customer_token}}
```
```json
{ "orderId": "{{orderId}}" }
```
Expected: `201 Created`
```json
{
  "paymentId": "<uuid>",
  "providerReference": "IZT????????",
  "amountVnd": 300000,
  "expiresAt": "<order expiresAt>",
  "transferInstructions": {
    "bankName": "<SEPAY_BANK_NAME>",
    "accountNumber": "<SEPAY_BANK_ACCOUNT_NUMBER>",
    "transferContent": "IZT????????",
    "amountVnd": 300000,
    "qrImageUrl": "https://qr.sepay.vn/img?acc=...&bank=...&amount=300000&des=IZT????????"
  }
}
```
Verify:
- `providerReference` matches `/^IZT[A-Z0-9]{8}$/`
- `transferInstructions.transferContent` equals `providerReference`
- `qrImageUrl` contains `amount=<totalAmountVnd>` and `des=<providerReference>`
- `amountVnd` equals order `totalAmountVnd`

Save `paymentId` → `paymentId`.

---

### TC-05: Duplicate — payment already initiated → 409

Call TC-04 again with same `orderId`:
```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{customer_token}}
```
```json
{ "orderId": "{{orderId}}" }
```
Expected: `409 Conflict`, message `"Payment already initiated for this order."`
Proves: idempotency guard blocks duplicate INITIATED payments.

---

## Pass Criteria Summary

| TC | Condition | Expected | Proves |
|----|-----------|----------|--------|
| TC-01 | Unknown orderId | 404 | Not-found guard |
| TC-02 | Wrong customer | 403 | Ownership check |
| TC-03 | Non-PENDING_PAYMENT order | 409 | Status guard |
| TC-04 | Valid order | 201 + QR instructions | Full happy path |
| TC-05 | Duplicate call | 409 | Idempotency guard |

All 5 pass → Task 2 complete. Proceed to Task 3 (webhook handler).

---

## DB verification (optional)

After TC-04, check payment row created:
```sql
SELECT id, order_id, provider, provider_reference, status, amount_vnd, payment_url
FROM payments
WHERE order_id = '<orderId>';
```
Expected: one row with `status = 'INITIATED'`, `provider = 'SEPAY'`, `provider_reference = 'IZT????????'`.
