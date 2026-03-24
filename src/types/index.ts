import { Timestamp } from 'firebase/firestore';

export type RiskLevel = 'High' | 'Medium' | 'Low' | string;
export type FindingStatus = string;
export type AuditeeAgreement = 'Pending' | 'Agreed' | 'Declined' | 'Partially Agreed';

export type AuditTypeCategory = 'Branch' | 'District' | 'Division' | 'Department' | 'Chief' | 'CEO' | 'Board';

export type FindingCategory = 
  | 'Cash' 
  | 'Accounts' 
  | 'Negotiable Instruments' 
  | 'Loans' 
  | 'Deposits' 
  | 'Fixed Assets' 
  | 'Card Banking' 
  | 'Security' 
  | 'Others';

export type CommunicationEntry = {
  date?: Date | Timestamp;
  meta?: string; // Individuals for verbal, Address for others
};

export type ForwardingEntry = {
  id: string;
  from: string;
  to: string;
  date: Date | Timestamp;
  comments?: string;
};

export type FollowUpStatus = 'Pending' | 'Partially Rectified' | 'Rectified' | 'Refereed' | 'Action Plan';

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
  id: string; // Subsection ID, e.g., "1.1" or "1.1.1"
  parentCaseNumber: string; // Level 1: Main Audit ID, e.g., "1"
  parentSummary: string; // Level 1: Summary of the Main Audit mission
  subsectionId?: string; // Level 2: Subsection ID if this is a sub-subsection, e.g., "1.1"
  subsectionTitle?: string; // Level 2: Title of the Subsection
  title: string; // Level 3 (or Level 2 if no Level 3 exists)
  category: FindingCategory;
  details: string;
  riskLevel: RiskLevel;
  branchOrDepartment: string;
  auditType: AuditTypeCategory; // Category from hierarchical levels
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
  // KPI Fields
  assignedDate?: Date | Timestamp;
  dateCommunicated?: Date | Timestamp;
  finalizationDate?: Date | Timestamp;
  tatDays?: number;
  // Follow-up Fields
  followUpStatus?: FollowUpStatus;
  verbalComm?: CommunicationEntry[]; // Max 3
  writtenComm?: CommunicationEntry[]; // Max 3
  esc1?: CommunicationEntry[]; // Max 3
  esc2?: CommunicationEntry[]; // Max 3
  followUpRecommendations?: string;
  isClosed?: boolean;
  // Forwarding & Collaboration
  collaboratingWith?: string;
  forwardingHistory?: ForwardingEntry[];
};

export type SpecialAuditIndividual = {
  name: string;
  position: string;
  tenure: string;
  age: number;
  sex: 'Male' | 'Female';
};

export type SpecialAudit = {
  id: string;
  shortSummary: string;
  placement: 'Branch' | 'District' | 'H.O';
  placementValue: string; // Name of the branch, district or HO
  amountInvolved: number;
  recovered: number;
  pending: number;
  individuals: SpecialAuditIndividual[];
  actionDisciplinary: string;
  gapWitnessed: string;
  correctiveActionTaken: string;
  dateCreated: Date | string;
};

export type Branch = {
  id?: string;
  name: string;
  district: string;
};

export type Department = {
  id?: string;
  name: string;
};

export type Chief = {
  id?: string;
  name: string;
};

export type CEO = {
  id?: string;
  name: string;
};

export type Board = {
  id?: string;
  name: string;
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

export type UserRole = 'Admin' | 'Auditor' | 'Auditee' | 'Management' | string;

export type UserStatus = 'Active' | 'Inactive';

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  dateJoined: string;
  branch?: string;
  district?: string;
};

export type Permission = 'audit_read' | 'audit_write' | 'reports_read' | 'settings_manage';

export type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSpecial?: boolean;
};
