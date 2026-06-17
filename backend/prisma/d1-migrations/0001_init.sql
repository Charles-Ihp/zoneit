-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "durationMax" INTEGER NOT NULL,
    "intensity" INTEGER NOT NULL,
    "defaultSets" INTEGER,
    "defaultReps" INTEGER
);

-- CreateTable
CREATE TABLE "ExerciseWallType" (
    "exerciseId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    PRIMARY KEY ("exerciseId", "value"),
    CONSTRAINT "ExerciseWallType_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseLevel" (
    "exerciseId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    PRIMARY KEY ("exerciseId", "value"),
    CONSTRAINT "ExerciseLevel_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseEquipment" (
    "exerciseId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    PRIMARY KEY ("exerciseId", "value"),
    CONSTRAINT "ExerciseEquipment_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseInjuryRisk" (
    "exerciseId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    PRIMARY KEY ("exerciseId", "value"),
    CONSTRAINT "ExerciseInjuryRisk_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseFocus" (
    "exerciseId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    PRIMARY KEY ("exerciseId", "value"),
    CONSTRAINT "ExerciseFocus_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "passwordHash" TEXT,
    "age" INTEGER,
    "weightKg" REAL,
    "heightCm" INTEGER,
    "restTimeSeconds" INTEGER DEFAULT 90,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'gym',
    "lengthWeeks" INTEGER NOT NULL DEFAULT 4,
    "days" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Program_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgramProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "week" INTEGER NOT NULL DEFAULT 1,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProgramProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgramProgressCompletedDay" (
    "progressId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,

    PRIMARY KEY ("progressId", "day"),
    CONSTRAINT "ProgramProgressCompletedDay_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "ProgramProgress" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folderId" TEXT,
    "sessionInput" TEXT NOT NULL,
    "generatedSession" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Workout_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workoutId" TEXT,
    "sessionTitle" TEXT NOT NULL,
    "sessionSubtitle" TEXT,
    "startedAt" DATETIME NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "exerciseCount" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "exercises" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionLog_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharedWorkout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "workoutId" TEXT,
    "workoutName" TEXT NOT NULL,
    "sessionInput" TEXT NOT NULL,
    "generatedSession" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "importCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedWorkout_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "usedAt" DATETIME,
    "usedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "letter" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "ExerciseWallType_exerciseId_idx" ON "ExerciseWallType"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseLevel_exerciseId_idx" ON "ExerciseLevel"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseEquipment_exerciseId_idx" ON "ExerciseEquipment"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseInjuryRisk_exerciseId_idx" ON "ExerciseInjuryRisk"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseFocus_exerciseId_idx" ON "ExerciseFocus"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Program_userId_idx" ON "Program"("userId");

-- CreateIndex
CREATE INDEX "ProgramProgress_userId_idx" ON "ProgramProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramProgress_userId_programId_key" ON "ProgramProgress"("userId", "programId");

-- CreateIndex
CREATE INDEX "ProgramProgressCompletedDay_progressId_idx" ON "ProgramProgressCompletedDay"("progressId");

-- CreateIndex
CREATE INDEX "Folder_userId_idx" ON "Folder"("userId");

-- CreateIndex
CREATE INDEX "Folder_userId_order_idx" ON "Folder"("userId", "order");

-- CreateIndex
CREATE INDEX "Workout_userId_idx" ON "Workout"("userId");

-- CreateIndex
CREATE INDEX "Workout_folderId_idx" ON "Workout"("folderId");

-- CreateIndex
CREATE INDEX "SessionLog_userId_idx" ON "SessionLog"("userId");

-- CreateIndex
CREATE INDEX "SessionLog_userId_startedAt_idx" ON "SessionLog"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SharedWorkout_code_key" ON "SharedWorkout"("code");

-- CreateIndex
CREATE INDEX "SharedWorkout_code_idx" ON "SharedWorkout"("code");

-- CreateIndex
CREATE INDEX "SharedWorkout_createdById_idx" ON "SharedWorkout"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "SharedWorkout_workoutId_createdById_key" ON "SharedWorkout"("workoutId", "createdById");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Term_term_key" ON "Term"("term");

