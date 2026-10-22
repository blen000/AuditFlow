-- AlterTable
ALTER TABLE "AuditFinding" ADD COLUMN "reportingPeriod" TEXT;

-- AlterTable
ALTER TABLE "SpecialAudit" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Open',
ADD COLUMN "followUpStatus" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN "progressUpdates" JSONB,
ADD COLUMN "auditeeResponse" TEXT,
ADD COLUMN "auditeeResponseDate" TIMESTAMP(3);

-- Correct the "Refereed" misspelling to "Referred"
UPDATE "FollowUpStatus" SET "name" = 'Referred'
WHERE "name" = 'Refereed' AND NOT EXISTS (SELECT 1 FROM "FollowUpStatus" WHERE "name" = 'Referred');
DELETE FROM "FollowUpStatus" WHERE "name" = 'Refereed';
UPDATE "AuditFinding" SET "followUpStatus" = 'Referred' WHERE "followUpStatus" = 'Refereed';
