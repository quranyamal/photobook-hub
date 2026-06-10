# System Architecture

## Architecture Style

Modular Monolith

The MVP is implemented as a single deployable application.

Microservices are intentionally avoided.

---

## High-Level Architecture

Customer Browser
↓
Next.js Application
↓
Prisma ORM
↓
PostgreSQL

Additional Services:

* Object Storage
* Payment Gateway
* Shipping Provider

---

## Application Modules

### Customer Module

Responsibilities:

* Registration
* Authentication
* Profile Management

### Project Module

Responsibilities:

* Project Management
* Photo Upload
* Photobook Creation

### Order Module

Responsibilities:

* Checkout
* Payment
* Order Tracking

### Production Module

Responsibilities:

* Production Queue
* Printing Workflow
* Quality Control

### Shipment Module

Responsibilities:

* Delivery Tracking
* Shipment Updates

---

## Storage Strategy

### PostgreSQL

Stores:

* Users
* Projects
* Orders
* Payments
* Shipments

### Object Storage

Stores:

* Uploaded Photos
* Generated Assets
* Production Files

---

## Architectural Principles

1. Simplicity over complexity
2. Server-first architecture
3. Type safety by default
4. Database migrations through Prisma
5. Small and reversible changes
6. Modular boundaries without microservices

---

## Technology Stack

Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

Backend

* Next.js Route Handlers
* Server Actions
* Prisma

Database

* PostgreSQL

Infrastructure

* Docker
* pnpm
