-- CreateTable
CREATE TABLE "TaskAssignmentRequest" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignmentRequest_taskId_userId_key" ON "TaskAssignmentRequest"("taskId", "userId");

-- AddForeignKey
ALTER TABLE "TaskAssignmentRequest" ADD CONSTRAINT "TaskAssignmentRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ProjectTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignmentRequest" ADD CONSTRAINT "TaskAssignmentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
