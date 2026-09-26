/*
  Warnings:

  - A unique constraint covering the columns `[userId,type]` on the table `Policies` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Policies_type_key";

-- CreateIndex
CREATE UNIQUE INDEX "Policies_userId_type_key" ON "Policies"("userId", "type");
