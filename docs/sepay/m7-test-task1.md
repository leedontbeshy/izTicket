# M7 Task 1 — API Test Guide

Purpose
- Verify routes, auth guards, role guards, and DTO validation wired in Task 1.
- No SePay credentials required. Service stubs throw 500 after guards pass — that is expected for Task 1.

Prerequisites
- Server running: `pnpm --filter api dev`
- Postman env vars: `api = http://localhost:3000/api/v1`, `customer_token`, `organizer_token`
- Seed accounts exist (`pnpm --dir apps/api exec prisma db seed`):
  - `admin@izticket.local` / `Password123!`
  - `organizer@izticket.local` / `Password123!`
  - `customer@izticket.local` / `Password123!`

---

## Setup — Get tokens (skip if already have from M6 tests)

Login as customer:
```
POST {{api}}/auth/login
```
```json
{ "email": "customer@izticket.local", "password": "Password123!" }
```
Save `accessToken` → `customer_token`.

Login as organizer:
```
POST {{api}}/auth/login
```
```json
{ "email": "organizer@izticket.local", "password": "Password123!" }
```
Save `accessToken` → `organizer_token`.

---

## Test Cases — POST /payments/sepay/create

### TC-01: No JWT → 401

```
POST {{api}}/payments/sepay/create
```
```json
{ "orderId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }
```
Expected: `401 Unauthorized`
Proves: `JwtAuthGuard` wired on route.

---

### TC-02: ORGANIZER JWT → 403

```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{organizer_token}}
```
```json
{ "orderId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }
```
Expected: `403 Forbidden`
Proves: `RolesGuard` + `@Roles(CUSTOMER)` blocks non-customers.

---

### TC-03: CUSTOMER JWT + invalid orderId (not UUID) → 400

```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{customer_token}}
```
```json
{ "orderId": "not-a-uuid" }
```
Expected: `400 Bad Request`
Proves: `@IsUUID()` validation fires on DTO.

---

### TC-04: CUSTOMER JWT + missing orderId → 400

```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{customer_token}}
```
```json
{}
```
Expected: `400 Bad Request`
Proves: required field enforced by validation pipe.

---

### TC-05: CUSTOMER JWT + unknown extra field → 400

```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{customer_token}}
```
```json
{
  "orderId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "extraField": "hacker"
}
```
Expected: `400 Bad Request`
Proves: `forbidNonWhitelisted: true` rejects unknown fields.

---

### TC-06: CUSTOMER JWT + valid UUID → 500 "Not implemented"

Use a real `orderId` from M6 tests (saved as `{{orderId}}`), or any properly formatted UUID:
```
POST {{api}}/payments/sepay/create
Authorization: Bearer {{customer_token}}
```
```json
{ "orderId": "{{orderId}}" }
```
If no orderId available, use: `"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"` (valid UUID v4 format).

Expected: `500 Internal Server Error`, body contains `Not implemented`
Proves: all guards pass, DTO valid, request reaches service stub. Task 2 replaces stub.

Note: `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11` looks like UUID but fails `@IsUUID()` — version nibble must be 1–5.

---

## Test Cases — POST /payments/sepay/webhook

### TC-07: No auth, empty body → 500 "Not implemented"

```
POST {{api}}/payments/sepay/webhook
```
```json
{}
```
Expected: `500 Internal Server Error`
Proves: webhook route is public (no `JwtAuthGuard`), reaches service stub. Webhook auth verification is handled inside service in Task 3.

---

### TC-08: Webhook route uses HTTP 200, not 201

Note for later: once Task 3 is implemented, successful webhook returns `{ "success": true }` with `200 OK` (not `201`).
The route has `@HttpCode(HttpStatus.OK)` — currently TC-07 confirms route exists. Full status code test in Task 3 guide.

---

## Pass Criteria Summary

| TC | Route | Auth | Expected | Proves |
|----|-------|------|----------|--------|
| TC-01 | `/payments/sepay/create` | None | 401 | `JwtAuthGuard` wired |
| TC-02 | `/payments/sepay/create` | ORGANIZER | 403 | `RolesGuard` + `@Roles(CUSTOMER)` |
| TC-03 | `/payments/sepay/create` | CUSTOMER | 400 | `@IsUUID()` DTO validation |
| TC-04 | `/payments/sepay/create` | CUSTOMER | 400 | Required field enforced |
| TC-05 | `/payments/sepay/create` | CUSTOMER | 400 | `forbidNonWhitelisted` |
| TC-06 | `/payments/sepay/create` | CUSTOMER | 500 | Guards pass, stub reached |
| TC-07 | `/payments/sepay/webhook` | None | 500 | Route public, stub reached |

All 7 pass → Task 1 contract correctly wired. Proceed to Task 2.
