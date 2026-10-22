-- AlterTable
ALTER TABLE "SpecialAudit" ADD COLUMN "verbalComm" JSONB,
ADD COLUMN "writtenComm" JSONB,
ADD COLUMN "esc1" JSONB,
ADD COLUMN "esc2" JSONB,
ADD COLUMN "followUpRecommendations" TEXT,
ADD COLUMN "isClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "forwardingHistory" JSONB,
ADD COLUMN "collaboratingWith" TEXT;
