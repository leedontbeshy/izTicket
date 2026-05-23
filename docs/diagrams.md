# izTicket Architecture Diagrams

Last updated: 2026-05-23

## How to import into draw.io

Use diagrams.net / draw.io:

1. Open draw.io.
2. Choose `Insert` -> `Advanced` -> `Mermaid`.
3. Copy one Mermaid block from this file.
4. Paste it into the Mermaid dialog.
5. Click `Insert`.

Each section below has a complete Mermaid diagram that can be imported separately.

## 1. Architecture Diagram

Purpose: shows the high-level system architecture, deployment targets, external payment provider, and main backend modules.

```mermaid
flowchart TB
    Customer["Customer<br/>Browse events, buy tickets"]
    Organizer["Organizer<br/>Create and manage events"]
    Admin["Admin<br/>Review submitted events"]

    Web["React Web App<br/>Vite<br/>Deployed on Vercel"]
    API["NestJS API<br/>Modular Monolith<br/>Deployed on Render"]
    DB[("PostgreSQL<br/>Managed database")]
    SePay["SePay<br/>Payment Provider"]
    Email["Email or Mock Notification<br/>MVP adapter"]

    Customer -->|"HTTPS"| Web
    Organizer -->|"HTTPS"| Web
    Admin -->|"HTTPS"| Web

    Web -->|"REST API / JSON"| API

    subgraph Backend["Backend Modules inside NestJS API"]
        Auth["Auth Module<br/>JWT, RBAC"]
        Users["Users Module"]
        Events["Events Module"]
        TicketTypes["Ticket Types Module"]
        Reservations["Reservations Module"]
        Orders["Orders Module"]
        Payments["Payments Module"]
        Tickets["Tickets Module"]
        AdminReview["Admin Review Module"]
        Notifications["Notifications Module"]
        EventBus["Internal Event Bus"]
    end

    API --> Auth
    API --> Users
    API --> Events
    API --> TicketTypes
    API --> Reservations
    API --> Orders
    API --> Payments
    API --> Tickets
    API --> AdminReview
    API --> Notifications

    Auth --> DB
    Users --> DB
    Events --> DB
    TicketTypes --> DB
    Reservations --> DB
    Orders --> DB
    Payments --> DB
    Tickets --> DB
    AdminReview --> DB
    Notifications --> DB

    Payments -->|"Create payment request"| SePay
    SePay -->|"Webhook callback"| Payments
    Notifications -->|"Send or log notification"| Email

    Events -->|"EventSubmitted / EventApproved"| EventBus
    Reservations -->|"ReservationCreated / ReservationExpired"| EventBus
    Payments -->|"PaymentSucceeded / PaymentFailed"| EventBus
    Tickets -->|"TicketIssued"| EventBus
    EventBus --> Orders
    EventBus --> Tickets
    EventBus --> Notifications
```

## 2. Component Diagram

Purpose: shows the internal backend component structure using layered architecture inside each module.

```mermaid
flowchart LR
    Client["React Web App"]

    subgraph API["NestJS API - Modular Monolith"]
        subgraph Presentation["Presentation Layer"]
            Controllers["REST Controllers"]
            DTOs["DTO Validation"]
            Guards["JWT Guard<br/>RBAC Guard"]
        end

        subgraph Application["Application Layer"]
            AuthUseCases["Auth Use Cases"]
            EventUseCases["Event Use Cases"]
            ReservationUseCases["Reservation Use Cases"]
            OrderUseCases["Order Use Cases"]
            PaymentUseCases["Payment Use Cases"]
            TicketUseCases["Ticket Use Cases"]
            AdminUseCases["Admin Review Use Cases"]
        end

        subgraph Domain["Domain Layer"]
            EventRules["Event State Rules"]
            InventoryRules["Ticket Inventory Rules"]
            ReservationRules["Reservation Expiry Rules"]
            OrderRules["Order State Rules"]
            PaymentRules["Payment Confirmation Rules"]
            TicketRules["Ticket Issuing Rules"]
        end

        subgraph Infrastructure["Infrastructure Layer"]
            PrismaRepos["Prisma Repositories"]
            SePayClient["SePay Client Adapter"]
            EventBus["Internal Event Bus"]
            Scheduler["Reservation Expiry Scheduler"]
            NotificationAdapter["Email or Log Notification Adapter"]
        end
    end

    DB[("PostgreSQL")]
    SePay["SePay API"]
    Email["Email / Log Output"]

    Client -->|"HTTP requests"| Controllers
    Controllers --> DTOs
    Controllers --> Guards
    Controllers --> AuthUseCases
    Controllers --> EventUseCases
    Controllers --> ReservationUseCases
    Controllers --> OrderUseCases
    Controllers --> PaymentUseCases
    Controllers --> TicketUseCases
    Controllers --> AdminUseCases

    AuthUseCases --> PrismaRepos
    EventUseCases --> EventRules
    EventUseCases --> PrismaRepos
    EventUseCases --> EventBus

    ReservationUseCases --> InventoryRules
    ReservationUseCases --> ReservationRules
    ReservationUseCases --> PrismaRepos
    ReservationUseCases --> EventBus

    OrderUseCases --> OrderRules
    OrderUseCases --> PrismaRepos

    PaymentUseCases --> PaymentRules
    PaymentUseCases --> PrismaRepos
    PaymentUseCases --> SePayClient
    PaymentUseCases --> EventBus

    TicketUseCases --> TicketRules
    TicketUseCases --> PrismaRepos
    TicketUseCases --> EventBus

    AdminUseCases --> EventRules
    AdminUseCases --> PrismaRepos
    AdminUseCases --> EventBus

    Scheduler --> ReservationUseCases
    EventBus --> TicketUseCases
    EventBus --> OrderUseCases
    EventBus --> NotificationAdapter

    PrismaRepos --> DB
    SePayClient --> SePay
    NotificationAdapter --> Email
```

## 3. Data Flow Diagram

Purpose: shows the main data flow for customer ticket purchase, reservation hold, SePay payment, webhook confirmation, and ticket issuing.

```mermaid
flowchart TD
    Customer["Customer"]
    Web["React Web App"]
    EventsAPI["Events API"]
    ReservationAPI["Reservations API"]
    OrdersAPI["Orders API"]
    PaymentAPI["Payments API"]
    TicketAPI["Tickets API"]
    NotificationModule["Notifications Module"]

    EventsStore[("events<br/>ticket_types")]
    ReservationStore[("reservations<br/>reservation_items")]
    OrderStore[("orders<br/>order_items")]
    PaymentStore[("payments<br/>payment_events")]
    TicketStore[("tickets")]
    SePay["SePay"]
    NotificationLog[("notification_logs")]

    Customer -->|"1. Browse events"| Web
    Web -->|"2. GET /events"| EventsAPI
    EventsAPI -->|"Read published events"| EventsStore
    EventsStore -->|"Event and ticket data"| EventsAPI
    EventsAPI -->|"Event list/detail"| Web

    Customer -->|"3. Select ticket quantity"| Web
    Web -->|"4. POST /reservations"| ReservationAPI
    ReservationAPI -->|"Check event status and sale window"| EventsStore
    ReservationAPI -->|"Conditional decrement available quantity"| EventsStore
    ReservationAPI -->|"Create ACTIVE reservation"| ReservationStore
    ReservationAPI -->|"Reservation id and expiresAt"| Web

    Web -->|"5. POST /orders"| OrdersAPI
    OrdersAPI -->|"Read reservation items"| ReservationStore
    OrdersAPI -->|"Create PENDING_PAYMENT order"| OrderStore
    OrdersAPI -->|"Order id and total amount"| Web

    Web -->|"6. POST /payments/sepay/create"| PaymentAPI
    PaymentAPI -->|"Read order total and status"| OrderStore
    PaymentAPI -->|"Create INITIATED payment"| PaymentStore
    PaymentAPI -->|"Create payment request"| SePay
    SePay -->|"Payment URL or QR data"| PaymentAPI
    PaymentAPI -->|"Payment instruction"| Web

    Customer -->|"7. Complete payment"| SePay
    SePay -->|"8. POST /payments/sepay/webhook"| PaymentAPI
    PaymentAPI -->|"Store raw webhook and check idempotency"| PaymentStore
    PaymentAPI -->|"Mark payment SUCCEEDED"| PaymentStore
    PaymentAPI -->|"Mark order PAID"| OrderStore
    PaymentAPI -->|"Mark reservation CONFIRMED"| ReservationStore
    PaymentAPI -->|"Increment sold quantity"| EventsStore

    PaymentAPI -->|"9. PaymentSucceeded event"| TicketAPI
    TicketAPI -->|"Create issued tickets"| TicketStore
    TicketAPI -->|"10. TicketIssued event"| NotificationModule
    NotificationModule -->|"Log or send ticket notification"| NotificationLog

    Web -->|"11. GET /tickets/my"| TicketAPI
    TicketAPI -->|"Read customer tickets"| TicketStore
    TicketAPI -->|"Issued tickets and QR payload"| Web
    Web -->|"Show e-ticket"| Customer
```

## 4. Reservation Expiry Data Flow

Purpose: shows how unpaid reservations are released after the checkout window expires.

```mermaid
flowchart TD
    Scheduler["NestJS Scheduled Job"]
    ReservationAPI["Reservations Module"]
    OrderAPI["Orders Module"]
    TicketTypesStore[("ticket_types")]
    ReservationStore[("reservations<br/>reservation_items")]
    OrderStore[("orders")]

    Scheduler -->|"Run periodically"| ReservationAPI
    ReservationAPI -->|"Find ACTIVE reservations where expiresAt < now"| ReservationStore
    ReservationAPI -->|"Mark reservation EXPIRED"| ReservationStore
    ReservationAPI -->|"Release held quantity"| TicketTypesStore
    ReservationAPI -->|"ReservationExpired event"| OrderAPI
    OrderAPI -->|"Mark PENDING_PAYMENT order EXPIRED"| OrderStore
```

## 5. Admin Approval Data Flow

Purpose: shows how organizer-created events become publicly visible only after admin approval.

```mermaid
flowchart TD
    Organizer["Organizer"]
    Admin["Admin"]
    Web["React Web App"]
    EventsAPI["Events API"]
    AdminAPI["Admin Review API"]
    NotificationModule["Notifications Module"]
    EventStore[("events")]
    ReviewStore[("event_reviews")]
    NotificationLog[("notification_logs")]

    Organizer -->|"Create draft event"| Web
    Web -->|"POST /organizer/events"| EventsAPI
    EventsAPI -->|"Insert DRAFT event"| EventStore

    Organizer -->|"Submit for review"| Web
    Web -->|"POST /organizer/events/:id/submit"| EventsAPI
    EventsAPI -->|"Update status to PENDING_REVIEW"| EventStore

    Admin -->|"Open pending events"| Web
    Web -->|"GET /admin/events/pending"| AdminAPI
    AdminAPI -->|"Read PENDING_REVIEW events"| EventStore

    Admin -->|"Approve or reject"| Web
    Web -->|"POST approve or reject"| AdminAPI
    AdminAPI -->|"Save review decision"| ReviewStore
    AdminAPI -->|"Update event status"| EventStore
    AdminAPI -->|"EventApproved or EventRejected event"| NotificationModule
    NotificationModule -->|"Notify organizer or log"| NotificationLog
```

## 6. Entity Relationship Diagram

Purpose: shows the main database tables and relationships for the izTicket MVP.

```mermaid
erDiagram
    USERS ||--o{ EVENTS : organizes
    USERS ||--o{ RESERVATIONS : creates
    USERS ||--o{ ORDERS : places
    USERS ||--o{ EVENT_REVIEWS : reviews
    USERS ||--o{ TICKETS : owns
    USERS ||--o{ NOTIFICATION_LOGS : receives

    VENUES ||--o{ EVENTS : hosts

    EVENTS ||--o{ TICKET_TYPES : has
    EVENTS ||--o{ EVENT_REVIEWS : receives
    EVENTS ||--o{ RESERVATIONS : has
    EVENTS ||--o{ ORDERS : has
    EVENTS ||--o{ TICKETS : issues

    TICKET_TYPES ||--o{ RESERVATION_ITEMS : reserved_as
    TICKET_TYPES ||--o{ ORDER_ITEMS : ordered_as
    TICKET_TYPES ||--o{ TICKETS : issued_as

    RESERVATIONS ||--o{ RESERVATION_ITEMS : contains
    RESERVATIONS ||--|| ORDERS : creates

    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o{ PAYMENTS : paid_by
    ORDERS ||--o{ TICKETS : issues
    ORDERS ||--o{ NOTIFICATION_LOGS : triggers

    PAYMENTS ||--o{ PAYMENT_EVENTS : records
    TICKETS ||--o{ NOTIFICATION_LOGS : notifies

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string name
        string role
        string status
        datetime created_at
        datetime updated_at
    }

    VENUES {
        uuid id PK
        string name
        string address
        string city
        string district
        string map_url
        datetime created_at
        datetime updated_at
    }

    EVENTS {
        uuid id PK
        uuid organizer_id FK
        uuid venue_id FK
        string title
        string slug UK
        string description
        string category
        string status
        string thumbnail_url
        datetime starts_at
        datetime ends_at
        datetime submitted_at
        datetime published_at
        datetime cancelled_at
        datetime created_at
        datetime updated_at
    }

    EVENT_REVIEWS {
        uuid id PK
        uuid event_id FK
        uuid reviewer_id FK
        string decision
        string reason
        datetime created_at
    }

    TICKET_TYPES {
        uuid id PK
        uuid event_id FK
        string name
        string description
        int price_vnd
        int total_quantity
        int available_quantity
        int sold_quantity
        int max_per_order
        datetime sale_starts_at
        datetime sale_ends_at
        datetime created_at
        datetime updated_at
    }

    RESERVATIONS {
        uuid id PK
        uuid customer_id FK
        uuid event_id FK
        string status
        datetime expires_at
        datetime confirmed_at
        datetime cancelled_at
        datetime created_at
        datetime updated_at
    }

    RESERVATION_ITEMS {
        uuid id PK
        uuid reservation_id FK
        uuid ticket_type_id FK
        int quantity
        int unit_price_vnd
        int subtotal_vnd
        datetime created_at
    }

    ORDERS {
        uuid id PK
        uuid customer_id FK
        uuid event_id FK
        uuid reservation_id FK
        string status
        int total_amount_vnd
        datetime expires_at
        datetime paid_at
        datetime cancelled_at
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid ticket_type_id FK
        int quantity
        int unit_price_vnd
        int subtotal_vnd
        datetime created_at
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK
        string provider
        string provider_transaction_id UK
        string provider_reference UK
        string status
        int amount_vnd
        string payment_url
        json raw_provider_payload
        datetime succeeded_at
        datetime failed_at
        datetime created_at
        datetime updated_at
    }

    PAYMENT_EVENTS {
        uuid id PK
        uuid payment_id FK
        string provider
        string provider_event_id UK
        string provider_transaction_id
        string event_type
        json payload
        datetime processed_at
        datetime created_at
    }

    TICKETS {
        uuid id PK
        uuid order_id FK
        uuid order_item_id FK
        uuid ticket_type_id FK
        uuid customer_id FK
        uuid event_id FK
        string ticket_code UK
        string qr_payload
        string status
        datetime issued_at
        datetime voided_at
        datetime created_at
    }

    NOTIFICATION_LOGS {
        uuid id PK
        uuid user_id FK
        uuid order_id FK
        uuid ticket_id FK
        string type
        string channel
        string status
        string recipient
        json payload
        datetime sent_at
        datetime created_at
        datetime updated_at
    }
```
