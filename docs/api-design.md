# izTicket API Design

Last updated: 2026-05-25

## 1. API Style

The MVP uses REST APIs because REST is simple to demo, works well with React, and maps cleanly to NestJS controllers.

Recommended base path:

```text
/api/v1
```

General conventions:

- Request and response body format: JSON.
- Authentication: short-lived access token in
  `Authorization: Bearer <jwt>`.
- Refresh token: HttpOnly cookie named `izticket_refresh_token`, scoped to
  `/api/v1/auth`.
- Frontend requests to refresh/logout must include cookies.
- Validation: DTO validation at controller boundary.
- Pagination: `page`, `limit`.
- Sorting: `sortBy`, `sortOrder`.
- Timestamps: ISO 8601 strings.
- Identifiers: UUID strings.
- Public users can only view `PUBLISHED` events.
- Organizer APIs are scoped to resources owned by the authenticated organizer.
- Admin APIs require `ADMIN` role.

## 2. Roles

| Role        | Capabilities                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `CUSTOMER`  | Browse events, reserve tickets, create orders, pay, view own tickets.                                     |
| `ORGANIZER` | Create and edit own events, configure ticket types, submit events for review, view orders for own events. |
| `ADMIN`     | Review, approve, and reject submitted events.                                                             |

## 3. Common Error Response

```json
{
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Ticket quantity is not available",
    "code": "INSUFFICIENT_TICKET_QUANTITY",
    "details": {}
}
```

Suggested status code usage:

| Status | Meaning                                                     |
| ------ | ----------------------------------------------------------- |
| `200`  | Successful read or update.                                  |
| `201`  | Resource created.                                           |
| `400`  | Invalid request or business rule violation.                 |
| `401`  | Missing or invalid token.                                   |
| `403`  | Authenticated but not allowed.                              |
| `404`  | Resource not found.                                         |
| `409`  | Conflict, such as stale state or duplicate webhook.         |
| `422`  | Valid JSON but semantically invalid checkout/payment state. |

## 4. Authentication APIs

Access tokens are returned in JSON and default to a 15-minute lifetime. Refresh
tokens are opaque random tokens stored only in the `izticket_refresh_token`
HttpOnly cookie and default to a 7-day lifetime.

### `POST /auth/register`

Creates a new account.

Allowed roles for self-registration:

- `CUSTOMER`
- `ORGANIZER`

Admin accounts should be seeded or created manually for the MVP.

Request:

```json
{
    "name": "Nguyen Van A",
    "email": "customer@example.com",
    "password": "Password123!",
    "role": "CUSTOMER"
}
```

Response:

```json
{
    "id": "user_uuid",
    "name": "Nguyen Van A",
    "email": "customer@example.com",
    "role": "CUSTOMER"
}
```

### `POST /auth/login`

Request:

```json
{
    "email": "customer@example.com",
    "password": "Password123!"
}
```

Response body:

```json
{
    "accessToken": "jwt_token",
    "user": {
        "id": "user_uuid",
        "name": "Nguyen Van A",
        "email": "customer@example.com",
        "role": "CUSTOMER"
    }
}
```

Response also sets a refresh-token cookie:

```http
Set-Cookie: izticket_refresh_token=<opaque_token>; HttpOnly; Path=/api/v1/auth; SameSite=Lax; Max-Age=604800
```

The refresh token is not returned in the JSON body.

### `POST /auth/refresh`

Rotates the current refresh token and returns a new access token.

Auth: valid `izticket_refresh_token` cookie.

Request body: none.

Response body:

```json
{
    "accessToken": "new_jwt_token",
    "user": {
        "id": "user_uuid",
        "name": "Nguyen Van A",
        "email": "customer@example.com",
        "role": "CUSTOMER"
    }
}
```

Response also sets a new `izticket_refresh_token` cookie. The previous refresh
token is revoked and cannot be reused.

Returns `401` when the cookie is missing, malformed, expired, already revoked,
or belongs to a disabled user.

### `POST /auth/logout`

Revokes the current refresh-token session and clears the refresh cookie.

Auth: optional `izticket_refresh_token` cookie.

Response: `204 No Content`.

Logout is idempotent. Missing or already-revoked refresh cookies do not cause an
error.

### `GET /auth/me`

Returns the current authenticated user.

Auth: any authenticated role using `Authorization: Bearer <jwt>`.

## 5. Public Event APIs

### `GET /events`

Lists public events.

Auth: public.

Query parameters:

```text
q=music
city=Ho Chi Minh City
category=concert
from=2026-06-01
to=2026-06-30
page=1
limit=12
```

Response:

```json
{
    "items": [
        {
            "id": "event_uuid",
            "title": "Summer Music Night",
            "slug": "summer-music-night",
            "status": "PUBLISHED",
            "venueName": "UEH Hall",
            "city": "Ho Chi Minh City",
            "startsAt": "2026-06-20T12:00:00.000Z",
            "minPrice": 150000,
            "thumbnailUrl": "https://example.com/event.jpg"
        }
    ],
    "page": 1,
    "limit": 12,
    "total": 1
}
```

### `GET /events/:eventId`

Returns public event details and available ticket types.

Auth: public.

Response:

```json
{
    "id": "event_uuid",
    "title": "Summer Music Night",
    "description": "A public event description.",
    "status": "PUBLISHED",
    "venue": {
        "name": "UEH Hall",
        "address": "59C Nguyen Dinh Chieu",
        "city": "Ho Chi Minh City"
    },
    "startsAt": "2026-06-20T12:00:00.000Z",
    "endsAt": "2026-06-20T15:00:00.000Z",
    "ticketTypes": [
        {
            "id": "ticket_type_uuid",
            "name": "Standard",
            "price": 150000,
            "availableQuantity": 120,
            "saleStartsAt": "2026-05-25T00:00:00.000Z",
            "saleEndsAt": "2026-06-19T23:59:59.000Z"
        }
    ]
}
```

## 6. Organizer Event APIs

### `GET /organizer/events`

Lists events owned by the authenticated organizer.

Auth: `ORGANIZER`.

### `GET /organizer/events/:eventId`

Returns one organizer-owned event by id.

Auth: `ORGANIZER`.

### `POST /organizer/events`

Creates an event in `DRAFT` state.

Auth: `ORGANIZER`.

Request:

```json
{
    "title": "Summer Music Night",
    "description": "A public event description.",
    "category": "concert",
    "venue": {
        "name": "UEH Hall",
        "address": "59C Nguyen Dinh Chieu",
        "city": "Ho Chi Minh City"
    },
    "startsAt": "2026-06-20T12:00:00.000Z",
    "endsAt": "2026-06-20T15:00:00.000Z",
    "thumbnailUrl": "https://example.com/event.jpg"
}
```

Response:

```json
{
    "id": "event_uuid",
    "status": "DRAFT"
}
```

### `PATCH /organizer/events/:eventId`

Updates an organizer-owned event.

Auth: `ORGANIZER`.

Allowed when:

- Event is `DRAFT`.
- Event is `REJECTED` and organizer is revising it.

### `POST /organizer/events/:eventId/submit`

Submits an event for admin review.

Auth: `ORGANIZER`.

State transition:

```text
DRAFT or REJECTED -> PENDING_REVIEW
```

Response:

```json
{
    "id": "event_uuid",
    "status": "PENDING_REVIEW"
}
```

## 7. Organizer Ticket Type APIs

### `POST /organizer/events/:eventId/ticket-types`

Creates a ticket type for an organizer-owned event.

Auth: `ORGANIZER`.

Request:

```json
{
    "name": "Standard",
    "description": "General admission",
    "price": 150000,
    "totalQuantity": 200,
    "maxPerOrder": 4,
    "saleStartsAt": "2026-05-25T00:00:00.000Z",
    "saleEndsAt": "2026-06-19T23:59:59.000Z"
}
```

Response:

```json
{
    "id": "ticket_type_uuid",
    "name": "Standard",
    "price": 150000,
    "totalQuantity": 200,
    "availableQuantity": 200
}
```

### `PATCH /organizer/ticket-types/:ticketTypeId`

Updates ticket type metadata and sale window.

Auth: `ORGANIZER`.

Important rule:

- Reducing `totalQuantity` below already sold or reserved quantity is not allowed.

## 8. Admin Review APIs

### `GET /admin/events/pending`

Lists events waiting for approval.

Auth: `ADMIN`.

### `GET /admin/events/:eventId`

Returns review details for an event.

Auth: `ADMIN`.

### `POST /admin/events/:eventId/approve`

Approves an event.

Auth: `ADMIN`.

State transition:

```text
PENDING_REVIEW -> PUBLISHED
```

Response:

```json
{
    "id": "event_uuid",
    "status": "PUBLISHED"
}
```

### `POST /admin/events/:eventId/reject`

Rejects an event and stores the reason.

Auth: `ADMIN`.

Request:

```json
{
    "reason": "Event description is incomplete."
}
```

State transition:

```text
PENDING_REVIEW -> REJECTED
```

## 9. Reservation APIs

Reservations hold tickets for a short checkout window, usually 10-15 minutes.

### `POST /reservations`

Creates a ticket reservation.

Auth: `CUSTOMER`.

Request:

```json
{
    "eventId": "event_uuid",
    "items": [
        {
            "ticketTypeId": "ticket_type_uuid",
            "quantity": 2
        }
    ]
}
```

Business rules:

- Event must be `PUBLISHED`.
- Ticket sale window must be active.
- Requested quantity must be positive.
- Available quantity must be enough.
- Inventory decrement and reservation creation must happen in a transaction.

Response:

```json
{
    "id": "reservation_uuid",
    "status": "ACTIVE",
    "expiresAt": "2026-05-23T10:15:00.000Z",
    "items": [
        {
            "ticketTypeId": "ticket_type_uuid",
            "quantity": 2,
            "unitPrice": 150000,
            "subtotal": 300000
        }
    ],
    "totalAmount": 300000
}
```

### `GET /reservations/:reservationId`

Returns reservation status and remaining checkout time.

Auth: reservation owner.

### `POST /reservations/:reservationId/cancel`

Cancels an active reservation and releases ticket inventory.

Auth: reservation owner.

## 10. Order APIs

### `POST /orders`

Creates a checkout order from an active reservation.

Auth: `CUSTOMER`.

Request:

```json
{
    "reservationId": "reservation_uuid"
}
```

Response:

```json
{
    "id": "order_uuid",
    "reservationId": "reservation_uuid",
    "status": "PENDING_PAYMENT",
    "totalAmount": 300000,
    "expiresAt": "2026-05-23T10:15:00.000Z"
}
```

### `GET /orders/:orderId`

Returns order detail.

Auth: order owner, organizer for own event orders, or admin.

### `GET /orders/my`

Returns orders for the authenticated customer.

Auth: `CUSTOMER`.

## 11. Payment APIs

The MVP payment provider is SePay. Exact provider payload fields should be verified against SePay documentation during implementation. The internal API should hide provider-specific details from most frontend screens.

### `POST /payments/sepay/create`

Creates a SePay payment request for an order.

Auth: order owner.

Request:

```json
{
    "orderId": "order_uuid",
    "returnUrl": "https://izticket.vercel.app/payment-result"
}
```

Response:

```json
{
    "paymentId": "payment_uuid",
    "orderId": "order_uuid",
    "status": "INITIATED",
    "provider": "SEPAY",
    "paymentUrl": "https://provider.example/pay",
    "amount": 300000
}
```

### `POST /payments/sepay/webhook`

Receives SePay payment status updates.

Auth: public endpoint protected by provider verification such as signature, token, or transaction reference validation.

Important rules:

- Must be idempotent.
- Must store raw provider event or transaction reference.
- Must ignore or safely handle duplicate callbacks.
- Must not issue tickets if reservation is already expired; move order to `PAYMENT_REVIEW` instead.

Response:

```json
{
    "received": true
}
```

### `GET /payments/:paymentId`

Returns payment status.

Auth: payment owner, admin, or organizer if payment belongs to their event.

## 12. Ticket APIs

### `GET /tickets/my`

Returns issued tickets for the authenticated customer.

Auth: `CUSTOMER`.

Response:

```json
{
    "items": [
        {
            "id": "ticket_uuid",
            "eventTitle": "Summer Music Night",
            "ticketTypeName": "Standard",
            "status": "ISSUED",
            "issuedAt": "2026-05-23T10:03:00.000Z",
            "qrPayload": "signed_ticket_payload"
        }
    ]
}
```

### `GET /tickets/:ticketId`

Returns one ticket detail.

Auth: ticket owner, admin, or organizer if the ticket belongs to their event.

## 13. Organizer Order APIs

### `GET /organizer/events/:eventId/orders`

Lists orders for an organizer-owned event.

Auth: `ORGANIZER`.

Query parameters:

```text
status=PAID
page=1
limit=20
```

Response:

```json
{
    "items": [
        {
            "id": "order_uuid",
            "customerName": "Nguyen Van A",
            "status": "PAID",
            "totalAmount": 300000,
            "createdAt": "2026-05-23T10:00:00.000Z"
        }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
}
```

## 14. State Transitions

### Event

```text
DRAFT -> PENDING_REVIEW -> PUBLISHED
DRAFT -> PENDING_REVIEW -> REJECTED -> PENDING_REVIEW
PUBLISHED -> CANCELLED
```

### Reservation

```text
ACTIVE -> CONFIRMED
ACTIVE -> EXPIRED
ACTIVE -> CANCELLED
```

### Order

```text
PENDING_PAYMENT -> PAID
PENDING_PAYMENT -> EXPIRED
PENDING_PAYMENT -> CANCELLED
PENDING_PAYMENT -> PAYMENT_REVIEW
```

### Payment

```text
INITIATED -> SUCCEEDED
INITIATED -> FAILED
INITIATED -> REQUIRES_REVIEW
```

## 15. Authorization Summary

| API group                  | Public        | Customer      | Organizer              | Admin                           |
| -------------------------- | ------------- | ------------- | ---------------------- | ------------------------------- |
| Public event browse        | Yes           | Yes           | Yes                    | Yes                             |
| Reservation/order checkout | No            | Own resources | No                     | Read for support if implemented |
| Organizer event management | No            | No            | Own events             | Optional read                   |
| Admin review               | No            | No            | No                     | Yes                             |
| Payment webhook            | Provider only | No            | No                     | No                              |
| Ticket viewing             | No            | Own tickets   | Tickets for own events | Yes                             |

## 16. Open Implementation Notes

- SePay webhook verification details must be checked during implementation.
- Admin creation should be handled by seed data or manual database setup.
- The first implementation can log notification events instead of sending real email.
- API versioning can start with `/api/v1` to keep room for future changes.
