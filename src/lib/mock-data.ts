import type { 
  AuditFinding, 
  Branch, 
  District, 
  RiskLevelData, 
  StatusData, 
  Auditor, 
  Department, 
  Chief, 
  CEO, 
  Board, 
  SpecialAudit,
  User,
  Role,
  AuditHierarchyNode
} from '@/types';
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

// Recursive Predefined Audit Hierarchy
export const initialHierarchy: AuditHierarchyNode[] = [
  { 
    id: 'NODE-1', 
    parentId: null, 
    level: 1, 
    number: '1', 
    title: 'Cash & Vault Management',
    customFields: [
      { id: 'cf-1', name: 'Cash Over/Short Amount', type: 'number' }
    ]
  },
  { 
    id: 'NODE-1-1', 
    parentId: 'NODE-1', 
    level: 2, 
    number: '1.1', 
    title: 'Dual Control Protocols',
    customFields: [
      { id: 'cf-2', name: 'Dual Control Witness', type: 'text' }
    ]
  },
  { id: 'NODE-1-1-1', parentId: 'NODE-1-1', level: 3, number: '1.1.1', title: 'Vault Access Logs' },
  { id: 'NODE-2', parentId: null, level: 1, number: '2', title: 'IT Systems & Cyber Security' },
  { id: 'NODE-2-1', parentId: 'NODE-2', level: 2, number: '2.1', title: 'Identity & Access Management' },
  { id: 'NODE-2-1-1', parentId: 'NODE-2-1', level: 3, number: '2.1.1', title: 'Password Complexity' },
  { id: 'NODE-3', parentId: null, level: 1, number: '3', title: 'Operational Compliance' },
  { id: 'NODE-3-1', parentId: 'NODE-3', level: 2, number: '3.1', title: 'KYC & AML Controls' },
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

export const initialUsers: User[] = [
  { id: 'USR-1', fullName: 'Admin User', email: 'admin@auditflow.com', role: 'Admin', status: 'Active', dateJoined: '2024-01-01', branch: 'Head Office', district: 'HQ' },
  { id: 'USR-2', fullName: 'Abebe Shirega', email: 'abebe@bank.com', role: 'Auditor', status: 'Active', dateJoined: '2024-02-15', branch: 'Internal Audit Dept', district: 'HQ' },
  { id: 'USR-3', fullName: 'Branch Manager', email: 'manager@mainstreet.com', role: 'Auditee', status: 'Active', dateJoined: '2024-03-10', branch: 'Main Street Branch', district: 'Northern District' },
  { id: 'USR-4', fullName: 'InActive Auditor', email: 'inactive@bank.com', role: 'Auditor', status: 'Inactive', dateJoined: '2024-01-20', branch: 'Park Avenue Branch', district: 'Southern District' },
];

import { sidebarMenuItems } from './sidebar-access';

export const initialRoles: Role[] = [
  { id: 'ROL-1', name: 'Admin', description: 'Full system access including user and settings management.', permissions: ['audit_read', 'audit_write', 'reports_read', 'settings_manage'], sidebarAccess: sidebarMenuItems.map(i => i.id), isSpecial: false },
  { id: 'ROL-2', name: 'Auditor', description: 'Can create and manage audit findings and view reports.', permissions: ['audit_read', 'audit_write', 'reports_read'], sidebarAccess: ['dashboard', 'auditee-view', 'findings-new', 'special-audits-new', 'reports'], isSpecial: false },
  { id: 'ROL-3', name: 'Auditee', description: 'Can view findings related to their branch and provide responses.', permissions: ['audit_read'], sidebarAccess: ['dashboard', 'auditee-view', 'reports'], isSpecial: false },
  { id: 'ROL-4', name: 'Management', description: 'View-only access to all audit reports and high-level dashboards.', permissions: ['audit_read', 'reports_read'], sidebarAccess: ['dashboard', 'reports'], isSpecial: false },
  { id: 'ROL-5', name: 'CEO', description: 'Executive level oversight and organizational strategy review.', permissions: ['audit_read', 'reports_read'], sidebarAccess: ['dashboard', 'reports'], isSpecial: true },
  { id: 'ROL-6', name: 'Chief Auditor', description: 'Top level audit executive with departmental governance responsibilities.', permissions: ['audit_read', 'audit_write', 'reports_read', 'settings_manage'], sidebarAccess: sidebarMenuItems.map(i => i.id), isSpecial: true },
];

export const initialFindings: AuditFinding[] = [
  {
    id: '1.1.1',
    parentCaseNumber: '1',
    parentSummary: 'IT Policy Review 2024',
    subsectionId: '1.1',
    subsectionTitle: 'Authentication Controls',
    title: 'Weak Password Policy',
    category: 'Security',
    details: 'The branch password policy does not enforce complexity requirements.',
    riskLevel: 'Medium',
    branchOrDepartment: 'Main Street Branch',
    auditType: 'Branch',
    recommendation: 'Update password policy to require characters, numbers, and symbols.',
    status: 'Open',
    auditeeAgreement: 'Pending',
    followUpStatus: 'Pending',
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
    dateCommunicated: subDays(new Date(), 18),
    tatDays: 15,
    hierarchyNodeId: 'NODE-2-1-1'
  }
];
