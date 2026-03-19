import type { AuditFinding, Branch, District, RiskLevelData, StatusData, Auditor, Department, Chief, CEO, Board, SpecialAudit } from '@/types';
import { subDays } from 'date-fns';

export const initialDistricts: District[] = [
  { id: 'DIST-1', name: 'Northern District' },
  { id: 'DIST-2', name: 'Southern District' },
  { id: 'DIST-3', name: 'Eastern District' },
];

export const initialBranches: Branch[] = [
  { id: 'BR-1', name: 'Main Street Branch', district: 'Northern District' },
  { id: 'BR-2', name: 'Park Avenue Branch', district: 'Southern District' },
  { id: 'BR-3', name: 'East Side Hub', district: 'Eastern District' },
];

export const initialDepartments: Department[] = [
  { id: 'DEPT-1', name: 'Internal Audit' },
  { id: 'DEPT-2', name: 'Risk Management' },
  { id: 'DEPT-3', name: 'Operations Department' },
  { id: 'DEPT-4', name: 'IT Security' },
];

export const initialChiefs: Chief[] = [
  { id: 'CHIEF-1', name: 'Chief Audit Executive' },
  { id: 'CHIEF-2', name: 'Chief Risk Officer' },
  { id: 'CHIEF-3', name: 'Chief Operations Officer' },
];

export const initialCEOs: CEO[] = [
  { id: 'CEO-1', name: 'Group CEO' },
  { id: 'CEO-2', name: 'Acting CEO' },
];

export const initialBoards: Board[] = [
  { id: 'BOARD-1', name: 'Board Audit Committee' },
  { id: 'BOARD-2', name: 'Board of Directors' },
  { id: 'BOARD-3', name: 'Risk Oversight Committee' },
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

export const initialAuditors: Auditor[] = [
  { id: 'AUD-1', fullName: 'Abebe Shirega', email: 'abebe@bank.com', phone: '+251911000001' },
  { id: 'AUD-2', fullName: 'Fikre Tollossa', email: 'fikre@bank.com', phone: '+251911000002' },
  { id: 'AUD-3', fullName: 'Ze', email: 'ze@bank.com', phone: '+251911000003' },
];

export const initialSpecialAudits: SpecialAudit[] = [
  {
    id: 'SA-1',
    shortSummary: 'Financial Discrepancy in Cash Handling',
    placement: 'Branch',
    placementValue: 'Downtown Main',
    amountInvolved: 50000,
    recovered: 30000,
    pending: 20000,
    individuals: [
      { name: 'John Doe', position: 'Cashier', tenure: '2 years', age: 28, sex: 'Male' }
    ],
    actionDisciplinary: 'Suspension pending further investigation',
    gapWitnessed: 'Lack of daily vault reconciliation',
    correctiveActionTaken: 'Mandatory daily reconciliation policy implemented',
    dateCreated: subDays(new Date(), 5).toISOString(),
  }
];

export const initialFindings: AuditFinding[] = [
  {
    id: '1.1.1',
    parentCaseNumber: '1',
    parentSummary: 'IT Policy Review 2024',
    subsectionId: '1.1',
    subsectionTitle: 'Authentication Controls',
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
    teamLeader: 'Abebe Shirega',
    teamMembers: ['Fikre Tollossa', 'Ze'],
    assignedDate: subDays(new Date(), 20),
    tatDays: 15,
  },
  {
    id: '2.1',
    parentCaseNumber: '2',
    parentSummary: 'Operational Compliance Audit',
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
    teamLeader: 'Abebe Shirega',
    teamMembers: ['Fikre Tollossa'],
    assignedDate: subDays(new Date(), 10),
    tatDays: 15,
  },
  {
    id: '3.1',
    parentCaseNumber: '3',
    parentSummary: 'KYC & AML Review',
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
    teamLeader: 'Fikre Tollossa',
    teamMembers: ['Ze'],
    assignedDate: subDays(new Date(), 5),
    tatDays: 15,
  },
  {
    id: '2.2',
    parentCaseNumber: '2',
    parentSummary: 'Operational Compliance Audit',
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
    teamLeader: 'Abebe Shirega',
    teamMembers: ['Ze'],
    assignedDate: subDays(new Date(), 25),
    finalizationDate: subDays(new Date(), 2),
    tatDays: 15,
  },
  {
    id: '4.1',
    parentCaseNumber: '4',
    parentSummary: 'Data Protection Mission',
    title: 'Unsecured Customer Records',
    details: 'Customer loan files were found left unsecured in an open cabinet.',
    riskLevel: 'Medium',
    branchOrDepartment: 'Internal Audit',
    recommendation: 'Implement clean desk policy and lockable storage.',
    status: 'Closed',
    auditeeAgreement: 'Agreed',
    involvedCases: [],
    involvedAmounts: [],
    progressUpdates: [],
    teamLeader: 'Fikre Tollossa',
    teamMembers: ['Abebe Shirega', 'Ze'],
    assignedDate: subDays(new Date(), 30),
    finalizationDate: subDays(new Date(), 12),
    tatDays: 20,
  }
];
