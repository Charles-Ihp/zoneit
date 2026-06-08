-- DropColumn
ALTER TABLE "ProgramProgress" DROP COLUMN "dayIndex";

-- AddColumn
ALTER TABLE "ProgramProgress" ADD COLUMN "completedDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
