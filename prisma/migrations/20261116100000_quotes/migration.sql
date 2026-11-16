-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "quoteToken" TEXT,
ADD COLUMN     "quoteDetails" TEXT,
ADD COLUMN     "quoteAmount" INTEGER,
ADD COLUMN     "quoteDeposit" INTEGER,
ADD COLUMN     "quoteSentAt" TIMESTAMP(3),
ADD COLUMN     "quoteAcceptedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_quoteToken_key" ON "Enquiry"("quoteToken");
