-- Add year/month to Habit (default 0 for existing rows, dropped after)
ALTER TABLE "Habit" ADD COLUMN "year" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Habit" ADD COLUMN "month" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Habit" ALTER COLUMN "year" DROP DEFAULT;
ALTER TABLE "Habit" ALTER COLUMN "month" DROP DEFAULT;

-- Add habit_id to Check, populate from Month, then make NOT NULL
ALTER TABLE "Check" ADD COLUMN "habit_id" TEXT;
UPDATE "Check" c SET "habit_id" = m."habit_id" FROM "Month" m WHERE c."month_id" = m."id";
DELETE FROM "Check" WHERE "habit_id" IS NULL;
ALTER TABLE "Check" ALTER COLUMN "habit_id" SET NOT NULL;
ALTER TABLE "Check" ADD CONSTRAINT "Check_habit_id_fkey"
  FOREIGN KEY ("habit_id") REFERENCES "Habit"("id") ON DELETE CASCADE;

-- Drop old month_id column and Month table
ALTER TABLE "Check" DROP CONSTRAINT "Check_month_id_fkey";
ALTER TABLE "Check" DROP COLUMN "month_id";
ALTER TABLE "Month" DROP CONSTRAINT "Month_habit_id_fkey";
DROP TABLE "Month";
