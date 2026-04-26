-- AlterTable
ALTER TABLE "SessionLog" ADD COLUMN     "exercises" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "restTimeSeconds" INTEGER DEFAULT 90;
