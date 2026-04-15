-- AlterTable
ALTER TABLE "CommunityMember" ADD COLUMN     "muted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CommunityMessage" ADD COLUMN     "mediaType" TEXT,
ADD COLUMN     "mediaUrl" TEXT,
ALTER COLUMN "content" DROP NOT NULL;
