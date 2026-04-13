-- CreateTable
CREATE TABLE "ModuleContent" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "moduleIndex" INTEGER NOT NULL,
    "sections" JSONB NOT NULL,

    CONSTRAINT "ModuleContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModuleContent_pathId_moduleIndex_key" ON "ModuleContent"("pathId", "moduleIndex");
