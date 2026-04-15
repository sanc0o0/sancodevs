/*
  Warnings:

  - A unique constraint covering the columns `[communityGroupId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "communityGroupId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_communityGroupId_key" ON "Project"("communityGroupId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_communityGroupId_fkey" FOREIGN KEY ("communityGroupId") REFERENCES "CommunityGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
