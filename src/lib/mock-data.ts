import type { AuditFinding } from '@/types';

export const mockFindings: AuditFinding[] = [
  {
    id: 'FIND-001',
    title: 'Unauthorized Access to Vault',
    details:
      'During a surprise check, it was found that a junior teller had access codes to the main vault, which is against protocol. The access log shows they accessed the vault twice in the last month outside of business hours.',
    riskLevel: 'High',
    branchOrDepartment: 'Downtown Main',
    auditCause: 'Weak access control policies and lack of regular access review.',
    auditEffect: 'Potential for unauthorized withdrawal of cash or other valuables, leading to financial loss and reputational damage.',
    mitigationPlan:
      '1. Immediately revoke the unauthorized access codes.\n2. Implement a dual-control system for vault access.\n3. Conduct a full audit of vault contents.\n4. Provide mandatory security protocol retraining for all staff.',
    status: 'In Progress',
    revalidationDate: new Date('2024-08-15T00:00:00.000Z'),
    auditeeAgreement: 'Agreed',
    mitigationDueDate: new Date('2024-07-30T00:00:00.000Z'),
    progressUpdates: [
      {
        id: 'PROG-001',
        date: new Date('2024-07-10T00:00:00.000Z'),
        details: 'Access codes have been revoked. Dual-control system hardware has been ordered.',
        attachmentFilename: 'order_confirmation.pdf'
      },
      {
        id: 'PROG-002',
        date: new Date('2024-07-20T00:00:00.000Z'),
        details: 'Dual-control system installed. Staff retraining scheduled for next week.',
      }
    ],
    involvedCases: [
      { id: 'CASE-001-1', ownerName: 'John Doe (Teller)', status: 'Resolved' },
      { id: 'CASE-001-2', ownerName: 'Jane Smith (Head Teller)', status: 'Open' }
    ]
  },
  {
    id: 'FIND-002',
    title: 'KYC/AML Documentation Lapses',
    details:
      'A sample review of 50 new accounts opened in the last quarter revealed that 5 of them had incomplete KYC documentation. Specifically, proof of address was missing.',
    riskLevel: 'Medium',
    branchOrDepartment: 'Suburban Branch',
    mitigationPlan:
      '1. Contact the affected customers to complete their documentation within 15 days.\n2. Implement a new checklist in the account opening software that prevents proceeding without all required documents being uploaded.\n3. Monthly internal audits of new accounts.',
    status: 'Open',
    auditeeAgreement: 'Pending',
  },
  {
    id: 'FIND-003',
    title: 'Outdated Fire Extinguishers',
    details:
      'The fire extinguishers on the second floor have not been serviced and are past their expiration date. The last service date was over 2 years ago.',
    riskLevel: 'Medium',
    branchOrDepartment: 'Suburban Branch',
    mitigationPlan:
      '1. Replace all expired fire extinguishers immediately.\n2. Establish a quarterly maintenance and check-up schedule with a certified vendor.',
    status: 'Mitigated',
    revalidationDate: new Date('2024-06-20T00:00:00.000Z'),
    auditeeAgreement: 'Agreed',
    mitigationDueDate: new Date('2024-05-15T00:00:00.000Z'),
  },
  {
    id: 'FIND-004',
    title: 'Lack of Segregation of Duties',
    details:
      'The same officer is responsible for both approving and disbursing small personal loans, creating a potential for fraud.',
    riskLevel: 'High',
    branchOrDepartment: 'Loan Processing Center',
    mitigationPlan:
      'Reassign duties to ensure one person approves and another disburses the loan amounts.',
    status: 'Closed',
    revalidationDate: new Date('2024-05-01T00:00:00.00Z'),
    auditeeAgreement: 'Agreed',
  },
  {
    id: 'FIND-005',
    title: 'Teller Cash Drawer Discrepancy',
    details:
      "A teller's cash drawer was short by $150 at the end of the day on three separate occasions in the past month.",
    riskLevel: 'Medium',
    branchOrDepartment: 'Downtown Main',
    involvedAmounts: [
      { name: 'Shortage 1', amount: 50 },
      { name: 'Shortage 2', amount: 75 },
      { name: 'Shortage 3', amount: 25 },
    ],
    mitigationPlan:
      '1. Conduct a thorough investigation into the discrepancies.\n2. Implement a policy for immediate reporting and investigation of any cash shortages or overages.\n3. Increase frequency of surprise cash counts.',
    status: 'In Progress',
    revalidationDate: new Date('2024-08-30T00:00:00.000Z'),
    auditeeAgreement: 'Declined',
    auditeeResponse: 'The teller in question was on leave for two of the dates mentioned. We believe this is an accounting error during shift change, not a drawer shortage.',
    auditeeAttachmentFilename: 'shift_logs.pdf',
  },
  {
    id: 'FIND-006',
    title: 'Physical Security - Unsecured Side Entrance',
    details:
      'The side entrance to the branch is often left propped open by staff during breaks, bypassing security access controls.',
    riskLevel: 'High',
    branchOrDepartment: 'Suburban Branch',
    mitigationPlan:
      '1. Install an alarm that sounds if the door is held open for more than 60 seconds.\n2. Reiterate policy on physical security with all staff members.\n3. Manager to perform random checks on all entrances.',
    status: 'Open',
    auditeeAgreement: 'Pending',
    involvedCases: [
      { id: 'CASE-006-1', ownerName: 'Security Team', status: 'Open' },
      { id: 'CASE-006-2', ownerName: 'Branch Manager', status: 'Open' }
    ]
  },
  {
    id: 'FIND-007',
    title: 'Customer Data Privacy Breach Risk',
    details:
      'Sensitive customer documents were found in an unlocked recycling bin, not in the designated secure shredding bins.',
    riskLevel: 'High',
    branchOrDepartment: 'Operations HQ',
    mitigationPlan:
      '1. Immediately secure and shred the documents found.\n2. Conduct mandatory data privacy and handling training for all employees.\n3. Replace open recycling bins in sensitive areas with secure shredding consoles.',
    status: 'Mitigated',
    revalidationDate: new Date('2024-07-01T00:00:00.000Z'),
    auditeeAgreement: 'Agreed',
    mitigationDueDate: new Date('2024-06-01T00:00:00.000Z'),
  },
  {
    id: 'FIND-008',
    title: 'Inadequate IT Patch Management',
    details:
      'Audit of branch computers found that several workstations were missing critical security patches that were released over 3 months ago.',
    riskLevel: 'Medium',
    branchOrDepartment: 'IT Department',
    mitigationPlan:
      '1. Deploy all pending critical security patches to all workstations immediately.\n2. Automate the patch management process to ensure patches are applied within 30 days of release.\n3. Perform monthly vulnerability scans.',
    status: 'Closed',
    revalidationDate: new Date('2024-06-10T00:00:00.000Z'),
    auditeeAgreement: 'Agreed',
  },
];
