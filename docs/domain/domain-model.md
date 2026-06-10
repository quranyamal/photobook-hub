# Domain Model

## Overview

PhotoBook Hub is a platform that allows customers to create personalized photobooks, place orders, and receive professionally printed products.

The MVP assumes that production is performed by an internal production team.

---

# Core Domains

## Customer Domain

Responsible for customer identity and ownership.

### User

Represents a customer account.

Attributes:

* id
* email
* name
* phoneNumber

Relationships:

* owns many Projects
* owns many Orders
* owns many Addresses

### Address

Represents a shipping destination.

Attributes:

* recipientName
* phoneNumber
* addressLine
* city
* province
* postalCode

Relationships:

* belongs to User

---

## Project Domain

Responsible for photobook creation.

### Project

A customer workspace for creating a photobook.

Attributes:

* title
* status
* createdAt
* updatedAt

Relationships:

* belongs to User
* contains many Photos
* contains one Photobook

### Photo

Uploaded image belonging to a project.

Attributes:

* fileName
* storageKey
* width
* height

Relationships:

* belongs to Project

### Photobook

Represents the final photobook design.

Attributes:

* title
* pageCount
* size
* coverType

Relationships:

* belongs to Project

---

## Order Domain

Responsible for purchasing and fulfillment.

### Order

Represents a customer purchase.

Attributes:

* orderNumber
* status
* subtotal
* shippingCost
* totalAmount

Relationships:

* belongs to User
* contains OrderItems
* has one Payment
* has one Shipment

### OrderItem

Represents a purchased photobook.

Relationships:

* belongs to Order
* references Photobook

### Payment

Represents payment information.

Attributes:

* paymentMethod
* amount
* status

Relationships:

* belongs to Order

### Shipment

Represents delivery information.

Attributes:

* courier
* trackingNumber
* status

Relationships:

* belongs to Order

---

## Production Domain

Responsible for internal production workflow.

### ProductionJob

Represents an internal production request.

Attributes:

* status
* assignedTo
* createdAt

Relationships:

* belongs to Order

Production states:

* PENDING
* PREPARING
* PRINTING
* QUALITY_CHECK
* PACKAGING
* READY_TO_SHIP
* SHIPPED
* COMPLETED
