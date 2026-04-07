-- Add ARC relation modeling fields to Contact
ALTER TABLE "Contact"
ADD COLUMN "quickContext" JSONB,
ADD COLUMN "relationVector" JSONB,
ADD COLUMN "archetype" TEXT;