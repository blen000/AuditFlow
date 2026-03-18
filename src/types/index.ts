import { Timestamp } from 'firebase/firestore';

export type RiskLevel = 'High' | 'Medium' | 'Low' | string;
export type FindingStatus = string;
export type AuditeeAgreement = 'Pending' | 'Agreed' | 'Declined' | 'Partially Agreed';

export type ProgressUpdate = {
  id: string;
  date: Date | Timestamp;
  details: string;
  attachmentFilename?: string;
};

export type InvolvedAmount = {
  name: string;
  amount: number;
};

export type InvolvedCase = {
  id: string;
  ownerName: string;
  status: 'Open' | 'Resolved';
};

export type AuditFinding = {
  id: string; // Subsection ID, e.g., "1.1"
  parentCaseNumber: string; // Main Audit ID, e.g., "1"
  parentSummary: string; // Summary of the Main Audit
  title: string;
  details: string;
  riskLevel: RiskLevel;
  branchOrDepartment: string;
  recommendation: string;
  status: FindingStatus;
  revalidationDate?: Date | Timestamp;
  auditeeAgreement: AuditeeAgreement;
  mitigationDueDate?: Date | Timestamp;
  auditeeResponse?: string;
  progressUpdates?: ProgressUpdate[];
  findingAttachments?: string[];
  recommendationAttachments?: string[];
  auditCause?: string;
  auditCauseAttachments?: string[];
  auditEffect?: string;
  auditEffectAttachments?: string[];
  involvedAmounts?: InvolvedAmount[];
  involvedCases?: InvolvedCase[];
  teamLeader: string;
  teamMembers: string[];
};

export type Branch = {
  id?: string;
  name: string;
  district: string;
};

export type Department = {
  id?: string;
  name: string;
  district: string;
};

export type District = {
  id?: string;
  name: string;
};

export type RiskLevelData = {
  id?: string;
  name: string;
};

export type StatusData = {
  id?: string;
  name: string;
};

export type Auditor = {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'info' | 'warning' | 'alert';
  findingId?: string;
};
