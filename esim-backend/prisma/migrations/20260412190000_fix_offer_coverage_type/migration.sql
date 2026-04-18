DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'CoverageType'
          AND n.nspname = 'public'
    ) THEN
        CREATE TYPE "CoverageType" AS ENUM ('LOCAL', 'REGIONAL', 'GLOBAL');
    END IF;
END $$;

ALTER TABLE "Offer"
ADD COLUMN IF NOT EXISTS "coverageType" "CoverageType" NOT NULL DEFAULT 'LOCAL';
