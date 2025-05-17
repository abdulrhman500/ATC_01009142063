-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "fts" tsvector;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Event' AND column_name = 'fts' AND table_schema = current_schema()
    ) THEN
        ALTER TABLE "Event" ADD COLUMN "fts" tsvector;
        RAISE NOTICE 'Column "fts" added to "Event" table.';
    ELSE
        -- If it exists but is not tsvector, you might need to alter it (more complex)
        -- For now, we assume if it exists, it's either correct or will be handled.
        -- Or, ensure Prisma did not create it as another type. If it did, drop and add.
        -- Example: ALTER TABLE "Event" ALTER COLUMN "fts" TYPE tsvector USING "fts"::text::tsvector;
        RAISE NOTICE 'Column "fts" already exists in "Event" table. Ensuring type is appropriate is manual if Prisma created it differently.';
    END IF;
END $$;

-- Create or replace the function to update the tsvector.
-- This function combines 'name' and 'description' into a tsvector.
-- 'english' is a common default text search configuration.
-- Weights: 'A' for name (higher priority), 'B' for description.
CREATE OR REPLACE FUNCTION event_fts_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts :=
    setweight(to_tsvector('pg_catalog.english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('pg_catalog.english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the fts column on INSERT or UPDATE.
-- Drop the trigger first if it already exists from a previous attempt.
DROP TRIGGER IF EXISTS tsvectorupdate_event_trigger ON "Event";
CREATE TRIGGER tsvectorupdate_event_trigger
BEFORE INSERT OR UPDATE ON "Event"
FOR EACH ROW EXECUTE FUNCTION event_fts_trigger_function();

-- Create a GIN index on the fts tsvector column for performance.
-- Drop if exists to ensure correct creation, or use CREATE INDEX IF NOT EXISTS.
DROP INDEX IF EXISTS event_fts_gin_idx;
CREATE INDEX event_fts_gin_idx ON "Event" USING gin (fts);

-- IMPORTANT: Populate the 'fts' column for existing rows.
-- This is crucial if you are adding FTS to a table with existing data.
-- If this is a new setup or `prisma migrate reset` is used (like in tests),
-- // this might not be strictly needed for the first run on an empty DB.
UPDATE "Event"
SET fts = (
    setweight(to_tsvector('pg_catalog.english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('pg_catalog.english', coalesce(description, '')), 'B')
)
WHERE fts IS NULL; -- Only update rows where fts hasn't been populated yet

-- RAISE NOTICE 'FTS setup for "Event" table completed.';