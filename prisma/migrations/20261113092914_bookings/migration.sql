-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'REPLIED', 'BOOKED', 'PAID', 'CLOSED');

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "amount" INTEGER,
ADD COLUMN     "bookedAt" TIMESTAMP(3),
ADD COLUMN     "service" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'direct',
ADD COLUMN     "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "wantedOn" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD';
