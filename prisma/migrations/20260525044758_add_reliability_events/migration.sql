-- CreateTable
CREATE TABLE "ReliabilityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "scoreDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taskId" TEXT,
    "taskTitle" TEXT,
    "projectId" TEXT,
    "projectLabel" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReliabilityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReliabilityEvent_userId_idx" ON "ReliabilityEvent"("userId");

-- CreateIndex
CREATE INDEX "ReliabilityEvent_userId_occurredAt_idx" ON "ReliabilityEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "ReliabilityEvent_userId_eventType_idx" ON "ReliabilityEvent"("userId", "eventType");

-- AddForeignKey
ALTER TABLE "ReliabilityEvent" ADD CONSTRAINT "ReliabilityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
