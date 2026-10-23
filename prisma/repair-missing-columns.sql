-- One-off repair for a database whose migrations 20261021000000 .. 20261023000000
-- were marked as applied (prisma migrate resolve) without actually being run.
-- Safe to re-run: every column is added only if missing and the updates are idempotent.

ALTER TABLE "AuditFinding"
  ADD COLUMN IF NOT EXISTS "findingDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reportingPeriod" TEXT;

ALTER TABLE "SpecialAudit"
  ADD COLUMN IF NOT EXISTS "auditeeAgreement" TEXT NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS "auditeeResponse" TEXT,
  ADD COLUMN IF NOT EXISTS "auditeeResponseDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "collaboratingWith" TEXT,
  ADD COLUMN IF NOT EXISTS "esc1" JSONB,
  ADD COLUMN IF NOT EXISTS "esc2" JSONB,
  ADD COLUMN IF NOT EXISTS "followUpRecommendations" TEXT,
  ADD COLUMN IF NOT EXISTS "followUpStatus" TEXT NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS "forwardingHistory" JSONB,
  ADD COLUMN IF NOT EXISTS "isClosed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mitigationDueDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "progressUpdates" JSONB,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'Open',
  ADD COLUMN IF NOT EXISTS "verbalComm" JSONB,
  ADD COLUMN IF NOT EXISTS "writtenComm" JSONB;

-- Data fix from 20261021000000: correct the "Refereed" misspelling to "Referred".
UPDATE "FollowUpStatus" SET "name" = 'Referred'
WHERE "name" = 'Refereed' AND NOT EXISTS (SELECT 1 FROM "FollowUpStatus" WHERE "name" = 'Referred');
DELETE FROM "FollowUpStatus" WHERE "name" = 'Refereed';
UPDATE "AuditFinding" SET "followUpStatus" = 'Referred' WHERE "followUpStatus" = 'Refereed';

-- Data fix from 20261021120000: keep the date users entered as the finding date.
UPDATE "AuditFinding" SET "findingDate" = COALESCE("assignedDate", "createdAt") WHERE "findingDate" IS NULL;
