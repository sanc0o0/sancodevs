/*
  Warnings:

  - You are about to drop the column `type` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CommunityGroup" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CommunityMember" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "type",
ADD COLUMN     "buildGoal" TEXT,
ADD COLUMN     "collaborationType" TEXT NOT NULL DEFAULT 'team',
ADD COLUMN     "complexityType" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "featuresIncluded" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "monetization" TEXT,
ADD COLUMN     "projectType" TEXT,
ADD COLUMN     "timeToComplete" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
