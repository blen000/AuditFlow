import type { AuditFinding, Branch, District, RiskLevelData, StatusData } from '@/types';

export const initialDistricts: District[] = [
  { id: 'DIST-1', name: 'Northern District' },
  { id: 'DIST-2', name: 'Southern District' },
  { id: 'DIST-3', name: 'Eastern District' },
];

export const initialBranches: Branch[] = [
  { id: 'BR-1', name: 'Main Street Branch', district: 'Northern District' },
  { id: 'BR-2', name: 'Park Avenue Branch', district: 'Southern District' },
  { id: 'BR-3', name: 'East Side Hub', district: 'Eastern District' },
  { id: 'BR-4', name: 'Central Department', district: 'Northern District' },
];

export const initialRiskLevels: RiskLevelData[] = [
  { id: 'RISK-1', name: 'High' },
  { id: 'RISK-2', name: 'Medium' },
  { id: 'RISK-3', name: 'Low' },
];

export const initialStatuses: StatusData[] = [
  { id: 'STAT-1', name: 'Open' },
  { id: 'STAT-2', name: 'In Progress' },
  { id: 'STAT-3', name: 'Mitigated' },
  { id: 'STAT-4', name: 'Closed' },
  { id: 'STAT-5', name: 'Awaiting Response' },
];

export const initialFindings: AuditFinding[] = [
  {
    id: 'CASE-001',
    title: 'Weak Password Policy',
    details: 'The branch password policy does not enforce complexity requirements.',
    riskLevel: 'Medium',
    branchOrDepartment: 'Main Street Branch',
    recommendation: 'Update password policy to require characters, numbers, and symbols.',
    status: 'Open',
    auditeeAgreement: 'Pending',
    involvedCases: [],
    involvedAmounts: [],
    progressUpdates: [],
    findingAttachments: [],
    recommendationAttachments: [],
    auditCause: 'Configuration oversight during last system update.',
    auditEffect: 'Potential unauthorized access to branch terminals.',
    assignedAuditor: 'Abebe Shirega',
    teamLeader: 'Abebe Shirega',
    teamMembers: ['Fikre Tollossa', 'Ze'],
  },
  {
    id: 'CASE-002',
    title: 'Dual Control Violation',
    details: 'The vault was opened by a single employee on three separate occasions.',
    riskLevel: 'High',
    branchOrDepartment: 'Park Avenue Branch',
    recommendation: 'Reinforce dual control training and audit vault logs weekly.',
    status: 'In Progress',
    auditeeAgreement: 'Agreed',
    mitigationDueDate: new Date('2024-12-30'),
    involvedCases: [
      { id: 'C-01', ownerName: 'Vault A', status: 'Open' }
    ],
    involvedAmounts: [],
    progressUpdates: [
      { id: 'P-01', date: new Date('2024-11-20'), details: 'Training session scheduled for staff.' }
    ],
    findingAttachments: [],
    recommendationAttachments: [],
    auditCause: 'Staff shortage leading to operational shortcuts.',
    auditEffect: 'High risk of internal fraud or theft.',
    assignedAuditor: 'Fikre Tollossa',
    teamLeader: 'Abebe Shirega',
    teamMembers: ['Fikre Tollossa'],
  },
  {
    id: 'CASE-003',
    title: 'Missing KYC Documentation',
    details: 'Several high-value accounts were opened without complete KYC documentation.',
    riskLevel: 'High',
    branchOrDepartment: 'Main Street Branch',
    recommendation: 'Freeze accounts until documentation is provided.',
    status: 'Awaiting Response',
    auditeeAgreement: 'Declined',
    auditeeResponse: 'Documentation was scanned but not linked in the system.',
    involvedCases: [],
    involvedAmounts: [
      { name: 'Total Account Value', amount: 250000 }
    ],
    progressUpdates: [],
    findingAttachments: [],
    recommendationAttachments: [],
    assignedAuditor: 'Ze',
    teamLeader: 'Fikre Tollossa',
    teamMembers: ['Ze'],
  },
  {
    id: 'CASE-004',
    title: 'Excessive Cash Limits',
    details: 'Tellers were found holding cash in excess of their authorized limits.',
    riskLevel: 'Low',
    branchOrDepartment: 'East Side Hub',
    recommendation: 'Adhere to daily cash transfer protocols to the vault.',
    status: 'Mitigated',
    auditeeAgreement: 'Agreed',
    revalidationDate: new Date('2025-01-15'),
    involvedCases: [],
    involvedAmounts: [
      { name: 'Excess Cash Found', amount: 5400 }
    ],
    progressUpdates: [],
    assignedAuditor: 'Abebe Shirega',
    teamLeader: 'Abebe Shirega',
    teamMembers: ['Ze'],
  },
  {
    id: 'CASE-005',
    title: 'Unsecured Customer Records',
    details: 'Customer loan files were found left unsecured in an open cabinet.',
    riskLevel: 'Medium',
    branchOrDepartment: 'Central Department',
    recommendation: 'Implement clean desk policy and lockable storage.',
    status: 'Closed',
    auditeeAgreement: 'Agreed',
    involvedCases: [],
    involvedAmounts: [],
    progressUpdates: [],
    assignedAuditor: 'Fikre Tollossa',
    teamLeader: 'Fikre Tollossa',
    teamMembers: ['Abebe Shirega', 'Ze'],
  }
];
