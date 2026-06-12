-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "branch" TEXT,
    "department" TEXT,
    "district" TEXT,
    "dateJoined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requirePasswordChange" BOOLEAN NOT NULL DEFAULT true,
    "passwordLastChanged" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "fingerprint" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "permissions" TEXT[],
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RiskLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FindingStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FindingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FollowUpStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialFindingCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SpecialFindingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditHierarchyNode" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "level" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditHierarchyNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "branch" TEXT,
    "department" TEXT,
    "district" TEXT,
    "branchOrDepartment" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "auditeeAgreement" TEXT NOT NULL DEFAULT 'Pending',
    "auditCause" TEXT,
    "auditEffect" TEXT,
    "involvedAmounts" JSONB,
    "involvedCases" JSONB,
    "teamLeader" TEXT,
    "teamMembers" JSONB,
    "assignedDate" TIMESTAMP(3),
    "dateCommunicated" TIMESTAMP(3),
    "finalizationDate" TIMESTAMP(3),
    "tatDays" INTEGER DEFAULT 15,
    "revalidationDate" TIMESTAMP(3),
    "mitigationDueDate" TIMESTAMP(3),
    "rectificationDate" TIMESTAMP(3),
    "auditeeResponse" TEXT,
    "auditeeAttachmentFilename" TEXT,
    "progressUpdates" JSONB,
    "dynamicValues" JSONB,
    "verbalComm" JSONB,
    "writtenComm" JSONB,
    "esc1" JSONB,
    "esc2" JSONB,
    "followUpRecommendations" TEXT,
    "forwardingHistory" JSONB,
    "collaboratingWith" TEXT,
    "hierarchyNodeId" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "followUpStatus" TEXT DEFAULT 'Pending',
    "auditorId" TEXT,
    "auditeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAttachment" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "findingId" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialAudit" (
    "id" TEXT NOT NULL,
    "shortSummary" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "placementValue" TEXT NOT NULL,
    "categoryId" TEXT,
    "amountInvolved" DOUBLE PRECISION NOT NULL,
    "recovered" DOUBLE PRECISION NOT NULL,
    "pending" DOUBLE PRECISION NOT NULL,
    "actionDisciplinary" TEXT NOT NULL,
    "gapWitnessed" TEXT NOT NULL,
    "correctiveActionTaken" TEXT NOT NULL,
    "auditCause" TEXT,
    "auditEffect" TEXT,
    "recommendation" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialAuditIndividual" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "tenure" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" TEXT NOT NULL,
    "specialAuditId" TEXT NOT NULL,

    CONSTRAINT "SpecialAuditIndividual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "resourceId" TEXT,
    "resourceType" TEXT,

    CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "findingId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "District_name_key" ON "District"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "Branch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RiskLevel_name_key" ON "RiskLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FindingStatus_name_key" ON "FindingStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpStatus_name_key" ON "FollowUpStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialFindingCategory_name_key" ON "SpecialFindingCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AuditHierarchyNode_number_key" ON "AuditHierarchyNode"("number");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_eventType_idx" ON "SecurityAuditLog"("eventType");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_userId_idx" ON "SecurityAuditLog"("userId");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_timestamp_idx" ON "SecurityAuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttempt_identifier_key" ON "LoginAttempt"("identifier");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditHierarchyNode" ADD CONSTRAINT "AuditHierarchyNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AuditHierarchyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_hierarchyNodeId_fkey" FOREIGN KEY ("hierarchyNodeId") REFERENCES "AuditHierarchyNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_auditeeId_fkey" FOREIGN KEY ("auditeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "AuditFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialAudit" ADD CONSTRAINT "SpecialAudit_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SpecialFindingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialAuditIndividual" ADD CONSTRAINT "SpecialAuditIndividual_specialAuditId_fkey" FOREIGN KEY ("specialAuditId") REFERENCES "SpecialAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "AuditFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
