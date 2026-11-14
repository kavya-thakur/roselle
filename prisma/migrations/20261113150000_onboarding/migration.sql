-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardedAt" TIMESTAMP(3);


-- Everyone who signed up before onboarding existed already has a page of their own: never send them there
UPDATE "User" SET "onboardedAt" = "createdAt";
