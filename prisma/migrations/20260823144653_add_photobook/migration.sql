-- CreateEnum
CREATE TYPE "PhotobookSize" AS ENUM ('A4', 'A5', 'SQUARE');

-- CreateEnum
CREATE TYPE "CoverType" AS ENUM ('SOFTCOVER', 'HARDCOVER');

-- CreateTable
CREATE TABLE "photobooks" (
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

-- CreateTable
CREATE TABLE "photobook_pages" (
    "id" TEXT NOT NULL,
    "photobookId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "photoId" TEXT,
    "layout" JSONB NOT NULL,

    CONSTRAINT "photobook_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "photobooks_projectId_key" ON "photobooks"("projectId");

-- AddForeignKey
ALTER TABLE "photobooks" ADD CONSTRAINT "photobooks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photobook_pages" ADD CONSTRAINT "photobook_pages_photobookId_fkey" FOREIGN KEY ("photobookId") REFERENCES "photobooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
