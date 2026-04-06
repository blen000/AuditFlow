-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "branch" TEXT,
    "district" TEXT,
    "dateJoined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
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
    "auditeeResponse" TEXT,
    "auditeeAttachmentFilename" TEXT,
    "progressUpdates" JSONB,
    "dynamicValues" JSONB,
    "hierarchyNodeId" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "followUpStatus" TEXT DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialAudit" (
    "id" TEXT NOT NULL,
    "shortSummary" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "placementValue" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

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
CREATE UNIQUE INDEX "AuditHierarchyNode_number_key" ON "AuditHierarchyNode"("number");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditHierarchyNode" ADD CONSTRAINT "AuditHierarchyNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AuditHierarchyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_hierarchyNodeId_fkey" FOREIGN KEY ("hierarchyNodeId") REFERENCES "AuditHierarchyNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialAuditIndividual" ADD CONSTRAINT "SpecialAuditIndividual_specialAuditId_fkey" FOREIGN KEY ("specialAuditId") REFERENCES "SpecialAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
