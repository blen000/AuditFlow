export type RiskLevel = 'High' | 'Medium' | 'Low';
export type FindingStatus = 'Open' | 'In Progress' | 'Mitigated' | 'Closed';
export type AuditeeAgreement = 'Pending' | 'Agreed' | 'Declined';

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
};
