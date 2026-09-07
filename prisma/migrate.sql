-- PhotoBook Hub — consolidated schema migration
-- Run with: psql -d vnzdavgh_photobookhub < prisma/migrate.sql

-- ── Migration 1: init ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- ── Migration 2: expand_user_model ───────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TABLE IF EXISTS "User";

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- ── Migration 3: add_project_photo ───────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'READY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "photos" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "projects" VALIDATE CONSTRAINT "projects_userId_fkey";

ALTER TABLE "photos" ADD CONSTRAINT "photos_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "photos" VALIDATE CONSTRAINT "photos_projectId_fkey";

-- ── Migration 4: add_photobook ────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "PhotobookSize" AS ENUM ('A4', 'A5', 'SQUARE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CoverType" AS ENUM ('SOFTCOVER', 'HARDCOVER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "photobooks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "size" "PhotobookSize" NOT NULL DEFAULT 'A4',
    "coverType" "CoverType" NOT NULL DEFAULT 'SOFTCOVER',
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "photobooks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "photobooks_projectId_key" ON "photobooks"("projectId");

CREATE TABLE IF NOT EXISTS "photobook_pages" (
    "id" TEXT NOT NULL,
    "photobookId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "photoId" TEXT,
    "layout" JSONB NOT NULL,
    CONSTRAINT "photobook_pages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "photobooks" ADD CONSTRAINT "photobooks_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "photobooks" VALIDATE CONSTRAINT "photobooks_projectId_fkey";

ALTER TABLE "photobook_pages" ADD CONSTRAINT "photobook_pages_photobookId_fkey"
  FOREIGN KEY ("photobookId") REFERENCES "photobooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "photobook_pages" VALIDATE CONSTRAINT "photobook_pages_photobookId_fkey";

-- ── Migration 5: add_orders ───────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('AWAITING', 'CONFIRMED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON "orders"("orderNumber");

CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "photobookId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'AWAITING',
    "referenceCode" TEXT,
    "paidAt" TIMESTAMP(3),
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "payments_orderId_key" ON "payments"("orderId");

ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_userId_fkey";

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "order_items" VALIDATE CONSTRAINT "order_items_orderId_fkey";

ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "payments" VALIDATE CONSTRAINT "payments_orderId_fkey";

-- ── Mark all migrations as applied in Prisma's tracking table ─────────────────

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","logs","rolled_back_at","started_at","applied_steps_count")
VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001','',now(),'20260608012219_init',NULL,NULL,now(),1),
  ('a1b2c3d4-0001-0001-0001-000000000002','',now(),'20260610014313_expand_user_model',NULL,NULL,now(),1),
  ('a1b2c3d4-0001-0001-0001-000000000003','',now(),'20260823104536_add_project_photo',NULL,NULL,now(),1),
  ('a1b2c3d4-0001-0001-0001-000000000004','',now(),'20260823144653_add_photobook',NULL,NULL,now(),1),
  ('a1b2c3d4-0001-0001-0001-000000000005','',now(),'20260823153602_add_orders',NULL,NULL,now(),1)
ON CONFLICT DO NOTHING;
