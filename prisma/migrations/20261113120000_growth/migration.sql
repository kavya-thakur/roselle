-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "paymentRequestedAmount" INTEGER,
ADD COLUMN     "paymentRequestedAt" TIMESTAMP(3),
ADD COLUMN     "remindedAt" TIMESTAMP(3),
ADD COLUMN     "repliedAt" TIMESTAMP(3),
ADD COLUMN     "reviewRequestedAt" TIMESTAMP(3),
ADD COLUMN     "reviewTokenHash" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "monthlyGoal" INTEGER,
ADD COLUMN     "paymentLink" TEXT,
ADD COLUMN     "weeklyEmail" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "enquiryId" INTEGER,
    "name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "service" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_enquiryId_key" ON "Review"("enquiryId");

-- CreateIndex
CREATE INDEX "Review_pageId_approvedAt_idx" ON "Review"("pageId", "approvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_reviewTokenHash_key" ON "Enquiry"("reviewTokenHash");

-- CreateIndex
CREATE INDEX "Enquiry_status_createdAt_idx" ON "Enquiry"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A rating is 1 to 5 stars, whatever the code above it does
ALTER TABLE "Review" ADD CONSTRAINT "Review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
