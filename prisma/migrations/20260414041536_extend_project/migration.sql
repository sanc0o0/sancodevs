-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'Beginner',
ADD COLUMN     "lookingFor" TEXT,
ADD COLUMN     "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'team';
