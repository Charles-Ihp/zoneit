-- CreateTable
CREATE TABLE "SharedWorkout" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "workoutId" TEXT,
    "workoutName" TEXT NOT NULL,
    "sessionInput" JSONB NOT NULL,
    "generatedSession" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "importCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedWorkout_code_key" ON "SharedWorkout"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SharedWorkout_workoutId_createdById_key" ON "SharedWorkout"("workoutId", "createdById");

-- CreateIndex
CREATE INDEX "SharedWorkout_code_idx" ON "SharedWorkout"("code");

-- CreateIndex
CREATE INDEX "SharedWorkout_createdById_idx" ON "SharedWorkout"("createdById");

-- AddForeignKey
ALTER TABLE "SharedWorkout" ADD CONSTRAINT "SharedWorkout_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
