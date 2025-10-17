export type RiskLevel = 'High' | 'Medium' | 'Low' | string;
export type FindingStatus = 'Open' | 'In Progress' | 'Mitigated' | 'Closed';
export type AuditeeAgreement = 'Pending' | 'Agreed' | 'Declined';

export type ProgressUpdate = {
  id: string;
  date: Date;
  details: string;
  attachmentFilename?: string;
};

export type AuditFinding = {
  id: string;
  title: string;
  details: string;
  riskLevel: RiskLevel;
  branchOrDepartment: string;
  mitigationPlan: string;
  status: FindingStatus;
  revalidationDate?: Date;
  auditeeAgreement: AuditeeAgreement;
  mitigationDueDate?: Date;
  auditeeResponse?: string;
  auditeeAttachmentFilename?: string;
  progressUpdates?: ProgressUpdate[];
  findingAttachments?: string[];
  mitigationAttachments?: string[];
};
