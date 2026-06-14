# Use Case Diagram — PhotoBook Hub

Renders natively in GitHub, VS Code (Markdown Preview), Notion, and Obsidian.

---

## Actor Overview

```mermaid
mindmap
  root((PhotoBook Hub))
    👤 Guest
      Register
      Login
    👤 Customer
      Login
      Logout
      Create Project
      Upload Photos
      View Photos
      Delete Photo
      Create Photobook
      Select Size and Cover Type
      Preview Photobook
      Place Order
      Submit Payment Reference
      View My Orders
      Track Order Status
    🔧 Admin
      Login
      Logout
      View All Orders
      Confirm Payment
      Reject Payment
      Download Print Assets
      Update Order Status
    🏭 Production Team
      Receive Print Assets
```

---

## Authentication

```mermaid
flowchart LR
    Guest(["👤 Guest"])
    Customer(["👤 Customer"])
    Admin(["🔧 Admin"])

    subgraph System["PhotoBook Hub"]
        UC01(("Register"))
        UC02(("Login"))
        UC03(("Logout"))
    end

    Guest     --> UC01
    Guest     --> UC02
    Customer  --> UC02
    Customer  --> UC03
    Admin     --> UC02
    Admin     --> UC03
```

---

## Project & Photo Management

```mermaid
flowchart LR
    Customer(["👤 Customer"])

    subgraph System["PhotoBook Hub"]
        UC04(("Create\nProject"))
        UC05(("Upload\nPhotos"))
        UC06(("View\nPhotos"))
        UC07(("Delete\nPhoto"))

        UC04 -.->|include| UC05
        UC05 -.->|include| UC06
    end

    Customer --> UC04
    Customer --> UC05
    Customer --> UC06
    Customer --> UC07
```

---

## Photobook Editor

```mermaid
flowchart LR
    Customer(["👤 Customer"])

    subgraph System["PhotoBook Hub"]
        UC08(("Create\nPhotobook"))
        UC09(("Select Size\n& Cover Type"))
        UC10(("Auto-assign\nPhotos to Pages"))
        UC11(("Preview\nPhotobook"))

        UC08 -.->|include| UC09
        UC08 -.->|include| UC10
        UC08 -.->|include| UC11
    end

    Customer --> UC08
```

---

## Order Placement

```mermaid
flowchart LR
    Customer(["👤 Customer"])

    subgraph System["PhotoBook Hub"]
        UC12(("Place\nOrder"))
        UC13(("Enter Shipping\nAddress"))
        UC14(("Confirm Order\nSummary"))
        UC15(("Submit Payment\nReference"))
        UC16(("View My\nOrders"))
        UC17(("Track Order\nStatus"))

        UC12 -.->|include| UC13
        UC12 -.->|include| UC14
        UC15 -.->|extend| UC17
    end

    Customer --> UC12
    Customer --> UC15
    Customer --> UC16
    Customer --> UC17
```

---

## Admin Panel

```mermaid
flowchart LR
    Admin(["🔧 Admin"])
    ProdTeam(["🏭 Production\nTeam"])

    subgraph System["PhotoBook Hub"]
        UC18(("View All\nOrders"))
        UC19(("View Order\nDetail"))
        UC20(("Confirm\nPayment"))
        UC21(("Reject\nPayment"))
        UC22(("Download\nPrint Assets"))
        UC23(("Update Order\nStatus"))

        UC18 -.->|include| UC19
        UC20 -.->|include| UC19
        UC21 -.->|include| UC19
        UC22 -.->|include| UC19
        UC23 -.->|include| UC19
    end

    Admin    --> UC18
    Admin    --> UC20
    Admin    --> UC21
    Admin    --> UC22
    Admin    --> UC23

    ProdTeam -.->|receives manually| UC22
```

---

## Use Case Reference

| ID | Use Case | Actor | Domain |
|---|---|---|---|
| UC01 | Register | Guest | Authentication |
| UC02 | Login | Guest, Customer, Admin | Authentication |
| UC03 | Logout | Customer, Admin | Authentication |
| UC04 | Create Project | Customer | Project & Photos |
| UC05 | Upload Photos | Customer | Project & Photos |
| UC06 | View Photos | Customer | Project & Photos |
| UC07 | Delete Photo | Customer | Project & Photos |
| UC08 | Create Photobook | Customer | Photobook Editor |
| UC09 | Select Size & Cover Type | Customer | Photobook Editor |
| UC10 | Auto-assign Photos to Pages | Customer | Photobook Editor |
| UC11 | Preview Photobook | Customer | Photobook Editor |
| UC12 | Place Order | Customer | Order Placement |
| UC13 | Enter Shipping Address | Customer | Order Placement |
| UC14 | Confirm Order Summary | Customer | Order Placement |
| UC15 | Submit Payment Reference | Customer | Order Placement |
| UC16 | View My Orders | Customer | Order Placement |
| UC17 | Track Order Status | Customer | Order Placement |
| UC18 | View All Orders | Admin | Admin Panel |
| UC19 | View Order Detail | Admin | Admin Panel |
| UC20 | Confirm Payment | Admin | Admin Panel |
| UC21 | Reject Payment | Admin | Admin Panel |
| UC22 | Download Print Assets | Admin, Production Team | Admin Panel |
| UC23 | Update Order Status | Admin | Admin Panel |

---

## Relationship Legend

| Notation | Meaning |
|---|---|
| `——>` solid arrow | Actor initiates the use case |
| `- - ->` include | Base use case always triggers the included use case |
| `- - ->` extend | Extending use case adds optional behaviour to the base |
| `..>` dotted | External actor interaction outside the system |

---

## Out of Scope (MVP)

| Use Case | Reason |
|---|---|
| Social login | Excluded from MVP |
| Email verification | Excluded from MVP |
| AI layout generation | Excluded from MVP |
| Coupons and referrals | Excluded from MVP |
| Production team portal | Manual workflow — no system interface |
| Automated fulfillment | Excluded from MVP |
| Multi-language / multi-country | Excluded from MVP |
