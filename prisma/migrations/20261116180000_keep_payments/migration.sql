-- Payments stay when an account is deleted, with the address that paid

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "userId" DROP NOT NULL;

-- the address of each payment made so far
UPDATE "Payment" SET "email" = "User"."email" FROM "User" WHERE "User"."id" = "Payment"."userId";

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
