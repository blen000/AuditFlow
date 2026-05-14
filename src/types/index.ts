import { Timestamp } from 'firebase/firestore';
import type { PermissionKey } from '@/lib/permissions';

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
  date?: Date | Timestamp | string;
  meta?: string; // Individuals for verbal, Address for others
};

export type ForwardingEntry = {
  id: string;
  from: string;
  to: string;
  date: Date | Timestamp | string;
  comments?: string;
};

export type FollowUpStatus = string;

export type ProgressUpdate = {
  id: string;
  date: Date | Timestamp | string;
  details: string;
  attachmentFilename?: string;
  attachmentId?: string;
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

export type CustomFieldType = 'text' | 'number';

export type CustomFieldDefinition = {
  id: string;
  name: string;
  type: CustomFieldType;
};

export type AuditFinding = {
  id: string; // Hierarchical ID, e.g., "1.1.1"
  parentCaseNumber: string; // Level 1: Mission Case Number, e.g., "1"
  parentSummary: string; // Level 1: Mission Title
  subsectionId?: string; // Level 2: e.g., "1.1"
  subsectionTitle?: string; // Level 2: Title
  title: string; // Level 3 title
  category: FindingCategory;
  details: string;
  riskLevel: RiskLevel;
  branchOrDepartment: string;
  auditType: AuditTypeCategory;
  recommendation: string;
  status: FindingStatus;
  revalidationDate?: Date | Timestamp | string;
  auditeeAgreement: AuditeeAgreement;
  mitigationDueDate?: Date | Timestamp | string;
  auditeeResponse?: string;
  progressUpdates?: ProgressUpdate[];
  findingAttachments?: string[];
  recommendationAttachments?: string[];
  auditCause?: string;
  auditCauseAttachments?: string[];
  auditEffect?: string;
  auditEffectAttachments?: string[];
  auditeeAttachmentFilename?: string;
  involvedAmounts?: InvolvedAmount[];
  involvedCases?: InvolvedCase[];
  teamLeader: string;
  teamMembers: string[];
  // KPI Fields
  assignedDate?: Date | Timestamp | string;
  dateCommunicated?: Date | Timestamp | string;
  finalizationDate?: Date | Timestamp | string;
  tatDays?: number;
  // Follow-up Fields
  followUpStatus?: FollowUpStatus;
  verbalComm?: CommunicationEntry[];
  writtenComm?: CommunicationEntry[];
  esc1?: CommunicationEntry[];
  esc2?: CommunicationEntry[];
  followUpRecommendations?: string;
  isClosed?: boolean;
  // Forwarding & Collaboration
  collaboratingWith?: string;
  forwardingHistory?: ForwardingEntry[];
  // Reference to Settings Hierarchy
  hierarchyNodeId: string;
  // Dynamic Custom Values
  dynamicValues?: Record<string, any>;
  // Secure Attachments
  attachments?: FileAttachment[];
};

export type FileAttachment = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploaderId: string;
  findingId?: string;
  category?: string;
  createdAt: string | Date;
};

export type AuditHierarchyNode = {
  id: string;
  parentId: string | null;
  level: number;
  number: string; // e.g., "1", "1.1", "1.1.1"
  title: string;
  customFields?: CustomFieldDefinition[];
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
  placementValue: string;
  amountInvolved: number;
  recovered: number;
  pending: number;
  individuals: SpecialAuditIndividual[];
  actionDisciplinary: string;
  gapWitnessed: string;
  correctiveActionTaken: string;
  auditCause?: string;
  auditEffect?: string;
  recommendation?: string;
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
  role?: string;
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

export type Permission = PermissionKey;

export type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSpecial?: boolean;
};