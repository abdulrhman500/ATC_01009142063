/*
  Warnings:

  - You are about to drop the column `fts` on the `Event` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "event_fts_gin_idx";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "fts";

-- Drop the GIN index
DROP INDEX IF EXISTS event_fts_gin_idx;

-- Drop the trigger
DROP TRIGGER IF EXISTS tsvectorupdate_event_trigger ON "Event";

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_event_fts_tsvector();

-- Drop the fts column (if Prisma didn't already script this based on schema change)
ALTER TABLE "Event" DROP COLUMN IF EXISTS "fts";
