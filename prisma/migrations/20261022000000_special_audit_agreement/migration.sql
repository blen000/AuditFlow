-- AlterTable
ALTER TABLE "SpecialAudit" ADD COLUMN "auditeeAgreement" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN "mitigationDueDate" TIMESTAMP(3);
