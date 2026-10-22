-- AlterTable
ALTER TABLE "AuditFinding" ADD COLUMN "findingDate" TIMESTAMP(3);

-- Before this change the (possibly backdated) date users entered was stored in
-- "assignedDate". Preserve it as the finding date for existing records.
UPDATE "AuditFinding" SET "findingDate" = COALESCE("assignedDate", "createdAt") WHERE "findingDate" IS NULL;
