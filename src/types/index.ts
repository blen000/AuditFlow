export type RiskLevel = 'High' | 'Medium' | 'Low';
export type FindingStatus = 'Open' | 'In Progress' | 'Mitigated' | 'Closed';

export type AuditFinding = {
  id: string;
  title: string;
  details: string;
  riskLevel: RiskLevel;
  mitigationPlan: string;
  status: FindingStatus;
  revalidationDate?: Date;
};
