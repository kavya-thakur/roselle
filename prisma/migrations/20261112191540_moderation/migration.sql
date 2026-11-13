-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedReason" TEXT;

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_resolvedAt_createdAt_idx" ON "Report"("resolvedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
