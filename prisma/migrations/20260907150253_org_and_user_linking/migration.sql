/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Generation` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Voice` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Generation" DROP CONSTRAINT "Generation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Voice" DROP CONSTRAINT "Voice_organizationId_fkey";

-- AlterTable
ALTER TABLE "Generation" DROP COLUMN "organizationId",
ADD COLUMN     "generatedBy" TEXT;

-- AlterTable
ALTER TABLE "Voice" DROP COLUMN "organizationId",
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Voice" ADD CONSTRAINT "Voice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voice" ADD CONSTRAINT "Voice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
