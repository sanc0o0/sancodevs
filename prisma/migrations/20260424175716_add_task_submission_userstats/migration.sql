-- AlterTable
ALTER TABLE "ProjectTask" ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "submissionUrl" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "tasksMissed" INTEGER NOT NULL DEFAULT 0,
    "tasksLate" INTEGER NOT NULL DEFAULT 0,
    "tasksRejected" INTEGER NOT NULL DEFAULT 0,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "onTimeRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
