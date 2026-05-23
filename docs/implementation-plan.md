# izTicket Implementation Plan

Last updated: 2026-05-23

## 1. Goal

This plan turns the agreed architecture and design documents into an implementation roadmap for the `izTicket` MVP.

Target outcome:

- A working event ticketing web app.
- Customer can browse events, reserve tickets, create an order, pay through SePay flow, and view issued tickets.
- Organizer can create events, configure ticket types, submit events, and view orders.
- Admin can approve or reject submitted events.
- Backend uses NestJS, Prisma, PostgreSQL, modular monolith, layered architecture, and internal domain events.
- Frontend uses React + Vite.
- Basic deployment uses Vercel for frontend and Render for backend.

Related design documents:

- [Backend Architecture](./backend-architecture.md)
- [API Design](./api-design.md)
- [System Flows](./system-flows.md)
- [Database Design](./database-design.md)
- [Diagrams](./diagrams.md)

## 2. Implementation Strategy

Build the MVP by vertical slices, not by isolated UI-only or DB-only work.

Recommended order:

1. Database schema and seed data.
2. Auth and RBAC foundation.
3. Event management and admin approval.
4. Ticket types and inventory.
5. Reservation hold and order creation.
6. Payment integration and webhook handling.
7. Ticket issuing and notification logging.
8. Frontend screens for Customer, Organizer, and Admin.
9. Tests, deployment, and demo polish.

The highest-risk parts are:

- Reservation inventory correctness.
- SePay webhook idempotency.
- RBAC access control.
- Late payment after reservation expiry.

Implement these carefully before adding visual polish.

## 3. Team Split

For a 2-3 person team:

| Role | Main owner | Backup |
| --- | --- | --- |
| Backend/domain | Prisma schema, NestJS modules, business rules, tests | Frontend dev reviews API contracts |
| Frontend | React routes, screens, forms, API client integration | Backend dev provides mock/seed data |
| Architecture/report/demo | Diagrams, report chapters, deployment notes, demo script | Everyone contributes screenshots and trade-off notes |


If the team has 3 people:

- Person A: backend core, database, Auth, Events, Reservations.
- Person B: frontend Customer/Organizer/Admin screens.
- Person C: Payment, Tickets, tests, deployment, report/diagrams.

## 4. Branch and Work Policy

Recommended Git workflow:

- Main branch: stable demo-ready code.
- Feature branches:
  - `feature/db-schema`
  - `feature/auth-rbac`
  - `feature/events-admin-review`
  - `feature/reservation-order`
  - `feature/payment-sepay`
  - `feature/tickets-notifications`
  - `feature/web-customer`
  - `feature/web-organizer-admin`
  - `feature/deploy`

Before merging:

- Run relevant tests.
- Run type checks.
- Confirm API contract did not break frontend.
- Update docs if architecture/API/schema changes.

Repository rules:

- Use `pnpm`, not npm or yarn.
- Ask before adding production dependencies.
- Keep changes scoped.
- Do not refactor unrelated template code while implementing a feature.

## 5. Dependency Plan

The repo already has NestJS, Prisma, PostgreSQL adapter, class-validator, zod, React, and Vite.

Before implementation, ask for approval to add production dependencies if needed.

Likely backend dependencies:

| Dependency | Why it may be needed | Can be delayed? |
| --- | --- | --- |
| `@nestjs/jwt` | JWT issuing and verification | No, needed for real auth |
| `bcrypt` or `argon2` | Password hashing | No, needed for secure auth |
| `@nestjs/schedule` | Reservation expiry scheduled job | Yes, can start with manual expiry endpoint/job |
| `qrcode` | Generate QR images or QR payloads | Yes, MVP can store signed text payload first |
| `nanoid` or similar | Human-friendly ticket/order codes | Yes, UUID is enough for MVP |

Likely frontend dependencies:

| Dependency | Why it may be needed | Can be delayed? |
| --- | --- | --- |
| Router library | Multi-page app navigation | No if building realistic routes |
| Form helper library | Complex forms | Yes, can use React state first |
| UI/icon library | Faster UI polish | Yes, can build basic components first |

Keep dependency additions minimal. The demo can be successful without a large UI kit.

## 6. Milestone Overview

| Milestone | Name | Main output | Risk |
| --- | --- | --- | --- |
| M0 | Project setup | Env files, naming cleanup, dev sanity check | Low |
| M1 | Database foundation | Prisma schema, migrations, seed data | High |
| M2 | Backend foundation | Shared module structure, errors, validation, API prefix | Medium |
| M3 | Auth and RBAC | Register, login, JWT, role guards | High |
| M4 | Events and admin review | Organizer creates events, admin approves | Medium |
| M5 | Ticket types and inventory | Ticket capacities, sale window, availability | High |
| M6 | Reservation and orders | Hold tickets, create orders, expire reservations | Very high |
| M7 | SePay payment | Payment request, webhook, idempotency | Very high |
| M8 | Ticket issuing | Issue tickets, QR payload, notification logs | Medium |
| M9 | Frontend MVP | Customer, Organizer, Admin screens | Medium |
| M10 | Tests and hardening | Unit/e2e tests for core flows | High |
| M11 | Deployment | Vercel, Render, environment config | Medium |
| M12 | Report/demo | Report content, screenshots, demo script | Medium |

## 7. Milestone M0: Project Setup

### Goal

Make the template clearly become `izTicket` and ensure local development works.

### Tasks

- Update root `package.json` name from template name to `izticket`.
- Update `README.md` with project name, stack, and basic commands.
- Confirm `pnpm install` works.
- Confirm API and web can run separately:
  - `pnpm dev:api`
  - `pnpm dev:web`
- Create/copy environment files:
  - `apps/api/.env` from `apps/api/.env.example`
  - root `.env` only if repo-wide tooling needs it
- Define local API URL for frontend:
  - example: `VITE_API_URL=http://localhost:3000/api/v1`
- Confirm Prettier and TypeScript commands are known:
  - `pnpm format:check`
  - `pnpm lint`
  - `pnpm check-types`
  - `pnpm build`

### Files likely touched

- `README.md`
- `package.json`
- `apps/api/.env.example`
- `apps/web/.env.example`

### Done when

- Both apps can start locally.
- README no longer reads like a generic template.
- Team knows how to run quality checks.

## 8. Milestone M1: Database Foundation

### Goal

Convert [Database Design](./database-design.md) into Prisma schema and seed data.

### Backend tasks

- Replace placeholder `ExampleItem` model in `apps/api/prisma/schema.prisma`.
- Add Prisma enums:
  - `UserRole`
  - `UserStatus`
  - `EventStatus`
  - `ReservationStatus`
  - `OrderStatus`
  - `PaymentStatus`
  - `TicketStatus`
  - `NotificationStatus`
- Add Prisma models:
  - `User`
  - `Venue`
  - `Event`
  - `EventReview`
  - `TicketType`
  - `Reservation`
  - `ReservationItem`
  - `Order`
  - `OrderItem`
  - `Payment`
  - `PaymentEvent`
  - `Ticket`
  - `NotificationLog`
- Add indexes and unique constraints from `database-design.md`.
- Decide which advanced constraints need raw SQL migrations:
  - `ends_at > starts_at`
  - quantity non-negative checks
  - partial unique indexes for nullable payment provider ids
- Run:
  - `pnpm --dir apps/api exec prisma validate`
  - `pnpm --dir apps/api exec prisma format`
  - `pnpm --dir apps/api exec prisma generate`
- Create first migration:
  - `pnpm --dir apps/api exec prisma migrate dev --name init_izticket_schema`

### Seed data tasks

Create seed data for demo:

- Admin user:
  - email: `admin@izticket.local`
  - role: `ADMIN`
- Organizer user:
  - email: `organizer@izticket.local`
  - role: `ORGANIZER`
- Customer user:
  - email: `customer@izticket.local`
  - role: `CUSTOMER`
- 2-3 venues.
- 3-5 events:
  - one `PUBLISHED`
  - one `PENDING_REVIEW`
  - one `DRAFT`
  - one `REJECTED` if time allows
- Ticket types for published event:
  - Standard
  - VIP

### Important design decisions

- Use integer VND fields, for example `priceVnd`, `totalAmountVnd`.
- Keep raw provider payloads as JSON.
- Keep all expired/cancelled rows instead of deleting them.
- Make one order per reservation using a unique constraint.

### Tests/checks

- Prisma validate passes.
- Prisma generate passes.
- Migration applies locally.
- Seed script creates deterministic demo data.
- Generated Prisma client compiles with TypeScript.

### Done when

- Database can be reset and reseeded.
- Demo users and sample events exist.
- No placeholder schema remains.

## 9. Milestone M2: Backend Foundation

### Goal

Create reusable backend structure before implementing business modules.

### Backend tasks

- Set global API prefix:
  - `/api/v1`
- Confirm global validation pipe:
  - whitelist unknown fields
  - transform primitive DTO fields if needed
- Define common error response shape:
  - `statusCode`
  - `error`
  - `message`
  - `code`
  - `details`
- Create shared folder structure:
  - `src/common/errors`
  - `src/common/guards`
  - `src/common/decorators`
  - `src/common/pagination`
  - `src/common/events`
  - `src/common/utils`
- Create domain event bus abstraction:
  - MVP can be synchronous/in-process.
  - Keep API simple so it can later move to queue.
- Create pagination DTO/helper.
- Create current user decorator.
- Create role decorator.
- Add request logging at basic level if not already present.

### Suggested backend folder shape

```text
apps/api/src/
  common/
    decorators/
    errors/
    events/
    guards/
    pagination/
    utils/
  modules/
    auth/
    users/
    events/
    ticket-types/
    reservations/
    orders/
    payments/
    tickets/
    admin-review/
    notifications/
    health/
  prisma/
```

### Done when

- All modules can reuse shared DTO/error/auth patterns.
- API responses are predictable.
- Later modules do not duplicate basic plumbing.

## 10. Milestone M3: Auth and RBAC

### Goal

Implement secure login and role-based access control.

### Backend tasks

- Implement `UsersModule`.
- Implement `AuthModule`.
- Add password hashing.
- Add JWT issuing.
- Add JWT auth guard.
- Add RBAC guard.
- Add decorators:
  - `@CurrentUser()`
  - `@Roles(UserRole.ADMIN)`
- Implement endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
- Restrict self-registration:
  - allow `CUSTOMER`
  - allow `ORGANIZER`
  - do not allow public registration as `ADMIN`
- Add seed/admin path for admin account.

### Security rules

- Normalize email before saving.
- Never return `passwordHash` from API.
- Reject disabled users.
- Keep JWT secret in environment variable.
- Add reasonable token expiration.

### Tests

Unit tests:

- Password hashing verifies correct password.
- Wrong password fails.
- Public cannot register as admin.

E2E tests:

- Register customer.
- Login customer.
- `GET /auth/me` works with token.
- Protected route rejects missing token.
- Role guard rejects wrong role.

### Done when

- Customer, Organizer, Admin can authenticate.
- RBAC is reusable by all future endpoints.
- Auth tests pass.

## 11. Milestone M4: Events and Admin Review

### Goal

Organizer can create events and admin can approve/reject them.

### Backend tasks

Implement `EventsModule`:

- `GET /events`
- `GET /events/:eventId`
- `GET /organizer/events`
- `POST /organizer/events`
- `PATCH /organizer/events/:eventId`
- `POST /organizer/events/:eventId/submit`

Implement `AdminReviewModule`:

- `GET /admin/events/pending`
- `GET /admin/events/:eventId`
- `POST /admin/events/:eventId/approve`
- `POST /admin/events/:eventId/reject`

### Business rules

- Public event list only returns `PUBLISHED` events.
- Organizer can only see/edit own events.
- Organizer can edit `DRAFT` or `REJECTED` events.
- Submit transitions:
  - `DRAFT -> PENDING_REVIEW`
  - `REJECTED -> PENDING_REVIEW`
- Admin approve transitions:
  - `PENDING_REVIEW -> PUBLISHED`
- Admin reject transitions:
  - `PENDING_REVIEW -> REJECTED`
- Reject reason is required.
- Published events should not be edited freely in MVP.

### Event payload fields

Minimum fields:

- title
- description
- category
- venue name/address/city
- startsAt
- endsAt
- thumbnailUrl optional

### Internal events

- Emit `EventSubmitted`.
- Emit `EventApproved`.
- Emit `EventRejected`.
- Notification handler can write `notification_logs`.

### Tests

Unit tests:

- Event status transition rules.
- Organizer ownership checks.

E2E tests:

- Organizer creates draft event.
- Organizer submits event.
- Admin sees pending event.
- Admin approves event.
- Public can now see event.
- Customer cannot create organizer event.
- Organizer cannot approve event.

### Done when

- Event approval flow works end to end.
- Public event list respects status.
- RBAC and ownership are enforced.

## 12. Milestone M5: Ticket Types and Inventory

### Goal

Organizer can configure ticket types with price, capacity, and sale window.

### Backend tasks

Implement `TicketTypesModule`:

- `POST /organizer/events/:eventId/ticket-types`
- `PATCH /organizer/ticket-types/:ticketTypeId`
- `GET /organizer/events/:eventId/ticket-types`
- Public event detail includes ticket types.

### Business rules

- Only event owner can create ticket types.
- Ticket type can be created while event is `DRAFT` or `REJECTED`.
- `priceVnd >= 0`.
- `totalQuantity > 0`.
- `availableQuantity` starts equal to `totalQuantity`.
- `soldQuantity` starts at `0`.
- `saleEndsAt > saleStartsAt`.
- Cannot reduce `totalQuantity` below already sold/reserved quantity.
- Public event detail should not expose internal fields.

### Tests

- Organizer can add ticket type to own event.
- Organizer cannot add ticket type to another organizer's event.
- Invalid sale window fails.
- Public event detail returns ticket types for published event.

### Done when

- Published events can display sellable tickets.
- Inventory fields are ready for reservation logic.

## 13. Milestone M6: Reservations and Orders

### Goal

Implement the ticket hold and order creation flow.

### Backend tasks

Implement `ReservationsModule`:

- `POST /reservations`
- `GET /reservations/:reservationId`
- `POST /reservations/:reservationId/cancel`
- Internal method/job: expire active reservations.

Implement `OrdersModule`:

- `POST /orders`
- `GET /orders/:orderId`
- `GET /orders/my`
- `GET /organizer/events/:eventId/orders`

### Reservation business rules

- Customer only.
- Event must be `PUBLISHED`.
- Ticket sale window must be active.
- Quantity must be positive.
- Quantity must not exceed `maxPerOrder` if configured.
- Reservation expires after 10-15 minutes.
- Inventory decrement and reservation item creation happen in one transaction.
- If one ticket type fails, entire reservation fails.
- Customer can only view own reservation.

### Order business rules

- Order can only be created from an `ACTIVE` reservation.
- One order per reservation.
- Order total is calculated server-side from reservation items.
- Order expires at the same time as reservation.
- Customer can view own orders.
- Organizer can view orders only for own events.

### Expiry behavior

For MVP:

- Scheduled job periodically finds expired active reservations.
- Mark reservation `EXPIRED`.
- Mark related pending order `EXPIRED`.
- Add reserved quantity back to `ticket_types.available_quantity`.

If dependency approval for scheduler is delayed:

- Implement expiry service first.
- Trigger it manually from tests or an admin-only endpoint during demo prep.
- Add real scheduler later.

### Critical tests

Unit tests:

- Cannot reserve unpublished event.
- Cannot reserve outside sale window.
- Cannot reserve more than available quantity.
- Cancelling reservation releases inventory.
- Expiring reservation releases inventory exactly once.

E2E tests:

- Customer creates reservation.
- Available quantity decreases.
- Customer creates order from reservation.
- Duplicate order for same reservation is rejected.
- Reservation expiry marks order expired.

Concurrency test target:

- Two reservations competing for the last ticket should not oversell.
- At least one request must fail when total requested quantity exceeds availability.

### Done when

- Checkout can safely hold tickets.
- Orders can be created from reservations.
- Inventory cannot go negative.

## 14. Milestone M7: SePay Payment Integration

### Goal

Create payment requests and process SePay webhook safely.

### Important note

Before implementation, verify current SePay documentation for:

- How to create a payment request or QR/payment URL.
- Required merchant credentials.
- Webhook payload shape.
- Signature, token, or verification mechanism.
- Unique transaction/reference fields.
- Success/failure status values.

Do not hard-code assumptions from memory.

### Backend tasks

Implement `PaymentsModule`:

- `POST /payments/sepay/create`
- `POST /payments/sepay/webhook`
- `GET /payments/:paymentId`

Create infrastructure adapter:

- `SePayClient`
- `SePayWebhookVerifier`
- `PaymentReferenceFactory`

### Payment creation rules

- Customer can create payment only for own order.
- Order must be `PENDING_PAYMENT`.
- Reservation must still be `ACTIVE`.
- Payment amount must equal order total.
- Store provider reference.
- Return payment URL, QR data, or payment instructions based on SePay integration model.

### Webhook rules

- Verify provider callback.
- Store raw webhook in `payment_events`.
- Process idempotently.
- If duplicate success webhook arrives, return success and do not issue duplicate tickets.
- If payment succeeds before reservation expiry:
  - mark payment `SUCCEEDED`
  - mark order `PAID`
  - mark reservation `CONFIRMED`
  - increment `soldQuantity`
  - emit `PaymentSucceeded`
- If payment succeeds after reservation expiry:
  - mark payment `SUCCEEDED`
  - mark order `PAYMENT_REVIEW`
  - do not issue tickets automatically
- If payment fails:
  - mark payment `FAILED`
  - cancel or wait for reservation expiry based on provider behavior

### Tests

Unit tests:

- Webhook verifier accepts valid payload.
- Webhook verifier rejects invalid payload.
- Duplicate webhook does not duplicate side effects.
- Late success moves order to `PAYMENT_REVIEW`.

E2E tests:

- Create payment for pending order.
- Simulate success webhook.
- Order becomes `PAID`.
- Reservation becomes `CONFIRMED`.
- Payment becomes `SUCCEEDED`.
- Duplicate webhook is safe.

### Done when

- Payment flow can be demoed with SePay sandbox/test setup or controlled callback simulation.
- Webhook processing is idempotent.
- Late payment edge case is handled.

## 15. Milestone M8: Tickets and Notifications

### Goal

Issue e-tickets after successful payment and make them visible to customers.

### Backend tasks

Implement `TicketsModule`:

- `GET /tickets/my`
- `GET /tickets/:ticketId`
- Internal handler for `PaymentSucceeded`.

Implement `NotificationsModule`:

- Write notification logs for:
  - event approved
  - event rejected
  - ticket issued
- Real email can be skipped for MVP if notification log is visible in DB or admin/debug output.

### Ticket issuing rules

- Tickets are issued only for `PAID` orders.
- One ticket row per purchased quantity.
- Ticket issuing must be idempotent.
- Each ticket gets:
  - unique `ticketCode`
  - signed or unique `qrPayload`
  - status `ISSUED`
- Customer sees only own tickets.
- Organizer can see tickets/orders for own events if needed.

### QR payload MVP

Minimum QR payload can be:

```text
izticket:{ticketId}:{ticketCode}
```

Better payload:

```json
{
    "ticketId": "uuid",
    "ticketCode": "IZT-2026-ABC123",
    "eventId": "uuid",
    "issuedAt": "iso-date",
    "signature": "server-generated-signature"
}
```

For MVP, QR can be displayed as text first. QR image generation can be added after core flow works.

### Tests

- Payment success issues correct number of tickets.
- Duplicate `PaymentSucceeded` event does not issue duplicate tickets.
- Customer cannot view another customer's ticket.
- Ticket code is unique.

### Done when

- Paid order creates visible tickets.
- Customer can view ticket list and ticket detail.
- Notification log records ticket issuing.

## 16. Milestone M9: Frontend MVP

### Goal

Build a usable frontend, not just isolated API testing.

### Frontend architecture tasks

- Create API client with base URL from env.
- Create auth state:
  - token storage
  - current user
  - logout
  - protected routes
- Create layout shell:
  - customer/public layout
  - organizer dashboard layout
  - admin dashboard layout
- Create common UI components:
  - buttons
  - inputs
  - select
  - status badge
  - table
  - empty state
  - loading state
  - error message

### Customer screens

Routes:

- `/login`
- `/register`
- `/events`
- `/events/:eventId`
- `/checkout/:reservationId`
- `/payment-result`
- `/my-tickets`
- `/my-tickets/:ticketId`

Customer tasks:

- Register/login.
- Browse published events.
- Filter/search by text and city if time allows.
- View event detail.
- Select ticket quantity.
- Create reservation.
- Show checkout countdown.
- Create order.
- Start SePay payment.
- Show payment result screen.
- View issued tickets.

### Organizer screens

Routes:

- `/organizer`
- `/organizer/events`
- `/organizer/events/new`
- `/organizer/events/:eventId/edit`
- `/organizer/events/:eventId/ticket-types`
- `/organizer/events/:eventId/orders`

Organizer tasks:

- Dashboard summary:
  - total events
  - pending review events
  - published events
  - paid orders
- Create event form.
- Edit draft/rejected event.
- Add ticket types.
- Submit event for review.
- View review status.
- View orders for own event.

### Admin screens

Routes:

- `/admin`
- `/admin/events/pending`
- `/admin/events/:eventId/review`

Admin tasks:

- Dashboard summary:
  - pending events
  - recent review decisions
- Pending event list.
- Review event detail.
- Approve event.
- Reject event with reason.

### Frontend acceptance criteria

- A user can complete the happy path without Postman.
- Role-based navigation shows relevant pages.
- Unauthorized users are redirected or blocked.
- Form validation errors are visible.
- API error messages are displayed clearly.
- Checkout countdown is visible.
- Ticket page clearly shows QR payload/code.

### Done when

- Demo can be run from browser for all three roles.
- Screens look coherent and are not just raw JSON dumps.

## 17. Milestone M10: Tests and Hardening

### Goal

Prove the important business rules work.

### Backend unit test priority

Highest priority:

- Event state transitions.
- Reservation inventory rules.
- Reservation expiry.
- Payment webhook idempotency.
- Ticket issuing idempotency.
- RBAC guard behavior.

Lower priority:

- Pagination helper.
- Notification logging.
- DTO validation details.

### Backend e2e test priority

E2E flow 1: auth

1. Register customer.
2. Login.
3. Access `GET /auth/me`.

E2E flow 2: event approval

1. Organizer creates event.
2. Organizer submits event.
3. Public cannot see pending event.
4. Admin approves event.
5. Public can see published event.

E2E flow 3: checkout happy path

1. Customer reserves tickets.
2. Available quantity decreases.
3. Customer creates order.
4. Payment webhook succeeds.
5. Order becomes paid.
6. Ticket is issued.

E2E flow 4: expiry

1. Customer reserves tickets.
2. Reservation expires.
3. Order expires.
4. Available quantity is restored.

E2E flow 5: duplicate webhook

1. Payment webhook succeeds.
2. Same webhook is sent again.
3. Only one set of tickets exists.

### Frontend manual test checklist

- Login/logout works.
- Customer event list loads.
- Customer can reserve and checkout.
- Organizer can create event.
- Organizer can add ticket type.
- Organizer can submit event.
- Admin can approve/reject.
- Customer can see event only after approval.
- Customer can view ticket after payment success.

### Quality commands

Run before finishing a major milestone:

```text
pnpm --dir apps/api exec prisma validate
pnpm --dir apps/api exec prisma format
pnpm --dir apps/api exec prisma generate
pnpm --filter api test
pnpm --filter api test:e2e
pnpm lint
pnpm check-types
pnpm build
```

If a command cannot run, document why in the final report or demo notes.

### Done when

- Core backend tests pass.
- Full app builds.
- Manual browser demo is stable.

## 18. Milestone M11: Deployment

### Goal

Deploy frontend to Vercel and backend to Render.

### Backend deployment tasks on Render

- Create Render web service for `apps/api`.
- Configure build command.
- Configure start command.
- Configure environment variables:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `SEPAY_*`
  - `CORS_ORIGIN`
  - `NODE_ENV=production`
- Configure PostgreSQL database.
- Run Prisma migration on deploy or manually:
  - `pnpm --dir apps/api exec prisma migrate deploy`
- Confirm health endpoint works.
- Confirm API base URL:
  - `https://your-api.onrender.com/api/v1`

### Frontend deployment tasks on Vercel

- Create Vercel project for `apps/web`.
- Configure build command.
- Configure output directory.
- Configure env:
  - `VITE_API_URL=https://your-api.onrender.com/api/v1`
- Confirm deployed frontend can call backend.
- Configure CORS on backend to allow Vercel domain.

### Deployment verification

- Visit deployed frontend.
- Login with seeded/demo users.
- Browse events.
- Run event approval flow.
- Run checkout flow.
- Trigger payment test/simulation.
- Confirm tickets appear.

### Done when

- Demo works from deployed URL.
- Local fallback still works if Render/Vercel has issues.

## 19. Milestone M12: Report and Demo Package

### Goal

Prepare the final submission for the software architecture course.

### Report sections to write

Follow `SA-requirements.md`:

1. Introduction
   - System overview.
   - Project motivation.
   - Scope.
2. System Requirements
   - Stakeholders.
   - Functional requirements.
   - Non-functional requirements.
3. Architecture Selection
   - Considered options.
   - Chosen architecture.
   - Trade-offs.
4. Architecture Design
   - Architecture diagram.
   - Component diagram.
   - Data flow diagram.
   - ERD.
5. Technical Design
   - API design.
   - Data model.
   - SePay integration.
   - Reservation consistency strategy.
6. Implementation
   - What was implemented.
   - Tech stack.
   - Screenshots.
   - Demo URLs.
7. Evaluation
   - Strengths.
   - Weaknesses.
   - Risks.
   - How architecture scales.
8. Conclusion
   - Summary.
   - Future work.

### Demo script

Demo should be short and deterministic.

Recommended script:

1. Login as Organizer.
2. Create event.
3. Add Standard/VIP ticket types.
4. Submit event for review.
5. Login as Admin.
6. Approve event.
7. Login as Customer.
8. Open public event detail.
9. Reserve two tickets.
10. Create order.
11. Start payment.
12. Simulate or complete SePay payment.
13. Show issued tickets.
14. Show organizer order list.

### Screenshots to capture

- Public event list.
- Event detail with ticket types.
- Organizer event form.
- Organizer ticket type config.
- Admin pending event review.
- Checkout screen with countdown.
- Payment result.
- My tickets page.
- Backend deployed health endpoint.
- Optional: Render/Vercel deployment dashboard.

### Done when

- Report has all rubric sections.
- Diagrams are included.
- Demo can be completed in 5-8 minutes.
- Source code and docs are ready for submission.

## 20. Detailed Task Checklist

### Backend checklist

- [ ] Replace Prisma placeholder schema.
- [ ] Add database enums.
- [ ] Add database models.
- [ ] Add seed script and demo users.
- [ ] Add API prefix `/api/v1`.
- [ ] Add validation pipe.
- [ ] Add common error format.
- [ ] Add Auth module.
- [ ] Add Users module.
- [ ] Add JWT auth guard.
- [ ] Add RBAC guard.
- [ ] Add Events module.
- [ ] Add Admin Review module.
- [ ] Add Ticket Types module.
- [ ] Add Reservations module.
- [ ] Add Orders module.
- [ ] Add Payments module.
- [ ] Add SePay client adapter.
- [ ] Add SePay webhook endpoint.
- [ ] Add Tickets module.
- [ ] Add Notifications module.
- [ ] Add reservation expiry service/job.
- [ ] Add unit tests for state rules.
- [ ] Add e2e tests for core flows.

### Frontend checklist

- [ ] Add API client.
- [ ] Add auth state.
- [ ] Add protected route behavior.
- [ ] Add login page.
- [ ] Add register page.
- [ ] Add event list page.
- [ ] Add event detail page.
- [ ] Add ticket quantity selector.
- [ ] Add checkout page.
- [ ] Add payment result page.
- [ ] Add my tickets page.
- [ ] Add organizer dashboard.
- [ ] Add organizer event list.
- [ ] Add organizer create/edit event form.
- [ ] Add organizer ticket type form.
- [ ] Add organizer order list.
- [ ] Add admin dashboard.
- [ ] Add pending event list.
- [ ] Add admin review detail page.
- [ ] Add approve/reject actions.
- [ ] Add loading and error states.
- [ ] Add responsive layout pass.

### Documentation checklist

- [ ] Keep API docs updated if endpoints change.
- [ ] Keep database docs updated if schema changes.
- [ ] Export diagrams from draw.io.
- [ ] Add screenshots for report.
- [ ] Write trade-off analysis.
- [ ] Write NFR evaluation.
- [ ] Write scale evolution section.
- [ ] Write implementation limitation section.
- [ ] Write demo guide.

## 21. Suggested Implementation Order by Pull Request

### PR 1: Project naming and env setup

Includes:

- README update.
- Env examples.
- Basic app sanity check.

Avoid:

- Business logic.

### PR 2: Prisma schema and seed

Includes:

- Enums and models.
- Migration.
- Seed data.

Acceptance:

- Database can be migrated and seeded from scratch.

### PR 3: Backend foundation and auth

Includes:

- API prefix.
- Validation.
- Error shape.
- Register/login/me.
- JWT and RBAC.

Acceptance:

- Protected endpoints work.

### PR 4: Events and admin approval

Includes:

- Organizer event CRUD.
- Submit event.
- Admin pending list.
- Approve/reject.
- Public event list.

Acceptance:

- Event becomes visible only after approval.

### PR 5: Ticket types

Includes:

- Organizer ticket type management.
- Public event detail includes ticket types.

Acceptance:

- Ticket inventory is initialized correctly.

### PR 6: Reservations and orders

Includes:

- Reservation creation.
- Conditional inventory decrement.
- Order creation.
- Expiry service.

Acceptance:

- Inventory is not oversold.

### PR 7: Payments and tickets

Includes:

- SePay payment creation.
- Webhook handling.
- Payment events.
- Ticket issuing.
- Notification logs.

Acceptance:

- Payment success issues tickets exactly once.

### PR 8: Customer frontend

Includes:

- Public event browsing.
- Event detail.
- Checkout.
- My tickets.

Acceptance:

- Customer happy path works from browser.

### PR 9: Organizer and admin frontend

Includes:

- Organizer dashboard/forms.
- Admin review screens.

Acceptance:

- Event approval flow works from browser.

### PR 10: Deployment and report polish

Includes:

- Render/Vercel config notes.
- Screenshots.
- Final tests.
- Report updates.

Acceptance:

- Deployed demo works.

## 22. API Implementation Priority

Build endpoints in this order:

1. `POST /auth/register`
2. `POST /auth/login`
3. `GET /auth/me`
4. `POST /organizer/events`
5. `GET /organizer/events`
6. `PATCH /organizer/events/:eventId`
7. `POST /organizer/events/:eventId/submit`
8. `GET /admin/events/pending`
9. `POST /admin/events/:eventId/approve`
10. `POST /admin/events/:eventId/reject`
11. `GET /events`
12. `GET /events/:eventId`
13. `POST /organizer/events/:eventId/ticket-types`
14. `PATCH /organizer/ticket-types/:ticketTypeId`
15. `POST /reservations`
16. `GET /reservations/:reservationId`
17. `POST /orders`
18. `GET /orders/:orderId`
19. `POST /payments/sepay/create`
20. `POST /payments/sepay/webhook`
21. `GET /tickets/my`
22. `GET /organizer/events/:eventId/orders`

This order lets frontend start early while backend continues deeper checkout/payment logic.

## 23. Database Implementation Priority

Implement schema in this order to reduce relationship friction:

1. Enums.
2. `users`.
3. `venues`.
4. `events`.
5. `event_reviews`.
6. `ticket_types`.
7. `reservations`.
8. `reservation_items`.
9. `orders`.
10. `order_items`.
11. `payments`.
12. `payment_events`.
13. `tickets`.
14. `notification_logs`.

Then add:

- indexes
- unique constraints
- raw SQL constraints if needed
- seed data

## 24. State Transition Rules to Implement First

### Event

Allowed:

- `DRAFT -> PENDING_REVIEW`
- `REJECTED -> PENDING_REVIEW`
- `PENDING_REVIEW -> PUBLISHED`
- `PENDING_REVIEW -> REJECTED`
- `PUBLISHED -> CANCELLED`

Reject:

- `DRAFT -> PUBLISHED`
- `REJECTED -> PUBLISHED`
- `CANCELLED -> PUBLISHED`

### Reservation

Allowed:

- `ACTIVE -> CONFIRMED`
- `ACTIVE -> EXPIRED`
- `ACTIVE -> CANCELLED`

Reject:

- `EXPIRED -> CONFIRMED`
- `CANCELLED -> CONFIRMED`
- `CONFIRMED -> EXPIRED`

### Order

Allowed:

- `PENDING_PAYMENT -> PAID`
- `PENDING_PAYMENT -> EXPIRED`
- `PENDING_PAYMENT -> CANCELLED`
- `PENDING_PAYMENT -> PAYMENT_REVIEW`

Reject:

- `EXPIRED -> PAID`
- `CANCELLED -> PAID`
- `PAID -> EXPIRED`

### Payment

Allowed:

- `INITIATED -> SUCCEEDED`
- `INITIATED -> FAILED`
- `INITIATED -> REQUIRES_REVIEW`

Reject:

- `SUCCEEDED -> FAILED`
- `FAILED -> SUCCEEDED` unless a new payment attempt is created.

## 25. Demo Data Plan

Use stable demo data so the presentation does not depend on random setup.

### Users

| Role | Email | Purpose |
| --- | --- | --- |
| Admin | `admin@izticket.local` | Approve/reject events |
| Organizer | `organizer@izticket.local` | Create events |
| Customer | `customer@izticket.local` | Buy tickets |

### Events

| Event | Status | Purpose |
| --- | --- | --- |
| UEH Music Night | `PUBLISHED` | Customer purchase demo |
| Tech Career Workshop | `PENDING_REVIEW` | Admin approval demo |
| Startup Pitch Day | `DRAFT` | Organizer editing demo |

### Ticket types

For UEH Music Night:

- Standard: 150,000 VND, quantity 100.
- VIP: 350,000 VND, quantity 30.

For Tech Career Workshop:

- Regular: 99,000 VND, quantity 80.

## 26. Risk Management

| Risk | When it appears | Mitigation |
| --- | --- | --- |
| SePay integration takes longer than expected | M7 | Build provider adapter interface and allow controlled webhook simulation for demo. |
| Inventory bug causes oversell | M6 | Prioritize transaction tests and conditional update logic. |
| Frontend scope becomes too large | M9 | Build happy paths first, dashboard metrics later. |
| Team members block each other | All milestones | Backend publishes API contract and seed data early. |
| Deployment is unstable on demo day | M11/M12 | Keep local demo fallback ready. |
| Auth dependencies delay implementation | M3 | Get dependency approval before starting Auth. |
| Report is rushed | M12 | Add screenshots and notes after each milestone, not only at the end. |

## 27. MVP Cut Line

If time runs short, keep these:

- Auth + RBAC.
- Organizer event creation.
- Admin approval.
- Public event list/detail.
- Ticket type creation.
- Reservation hold.
- Order creation.
- Payment callback simulation or SePay test flow.
- Ticket issuing.

Can be simplified:

- Real email sending.
- Advanced search/filter.
- QR image generation.
- Organizer analytics.
- Admin user management.
- Refunds.
- Seat maps.
- Discounts.

Do not cut:

- Reservation hold.
- Webhook idempotency.
- Event approval status.
- RBAC.
- At least one end-to-end browser demo.

## 28. Final Definition of Done

The project is implementation-complete when:

- Backend can start locally.
- Frontend can start locally.
- Database can migrate and seed.
- Customer happy path works.
- Organizer happy path works.
- Admin approval path works.
- Payment success path issues tickets.
- Duplicate webhook does not duplicate tickets.
- Reservation expiry releases inventory.
- Quality checks have been run or documented if blocked.
- Vercel/Render deployment works or local fallback is ready.
- Report includes architecture diagrams, trade-offs, API design, database design, and implementation screenshots.

