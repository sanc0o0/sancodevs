/*
  Warnings:

  - The `role` column on the `CommunityMember` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `CommunityMember` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'LEFT');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "CommunityGroup" ALTER COLUMN "isPrivate" SET DEFAULT true;

-- AlterTable
ALTER TABLE "CommunityMember" DROP COLUMN "role",
ADD COLUMN     "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
DROP COLUMN "status",
ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'PENDING';
