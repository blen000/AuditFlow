import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const prisma = new PrismaClient({
  log: ['error'],
});

const SALT_ROUNDS = 12;

async function main() {
  console.log('Seeding organizational data...');

  // 1. Roles
  const roles = [
    {
      name: 'Admin',
      description: 'Full system access including user and settings management.',
      permissions: [
        'dashboard_access',
        'auditee_view_access',
        'findings_new_access',
        'special_audits_new_access',
        'users_manage_access',
        'roles_manage_access',
        'register_user_access',
        'special_onboarding_access',
        'reports_consolidated_access',
        'reports_frequency_access',
        'reports_assignments_access',
        'reports_communications_access',
        'reports_special_audits_access',
        'settings_audit_structure_access',
        'settings_branches_access',
        'settings_districts_access',
        'settings_departments_access',
        'settings_risk_levels_access',
        'settings_statuses_access',
      ],
      isSpecial: false,
    },
    {
      name: 'Auditor',
      description: 'Can create and manage audit findings and view reports.',
      permissions: [
        'dashboard_access',
        'auditee_view_access',
        'findings_new_access',
        'special_audits_new_access',
        'reports_consolidated_access',
        'reports_frequency_access',
        'reports_assignments_access',
        'reports_communications_access',
        'reports_special_audits_access',
      ],
      isSpecial: false,
    },
    {
      name: 'Auditee',
      description: 'Can view dashboards and respond as an auditee.',
      permissions: ['dashboard_access', 'auditee_view_access'],
      isSpecial: false,
    },
    {
      name: 'CEO',
      description: 'Executive level oversight and organizational strategy review.',
      permissions: [
        'dashboard_access',
        'auditee_view_access',
        'reports_consolidated_access',
        'reports_frequency_access',
        'reports_assignments_access',
        'reports_communications_access',
        'reports_special_audits_access',
      ],
      isSpecial: true,
    },
    {
      name: 'Chief Auditor',
      description: 'Top level audit executive with departmental governance responsibilities.',
      permissions: [
        'dashboard_access',
        'auditee_view_access',
        'findings_new_access',
        'special_audits_new_access',
        'users_manage_access',
        'roles_manage_access',
        'register_user_access',
        'special_onboarding_access',
        'reports_consolidated_access',
        'reports_frequency_access',
        'reports_assignments_access',
        'reports_communications_access',
        'reports_special_audits_access',
        'settings_audit_structure_access',
        'settings_branches_access',
        'settings_districts_access',
        'settings_departments_access',
        'settings_risk_levels_access',
        'settings_statuses_access',
      ],
      isSpecial: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });

  // 2. Users
  if (adminRole) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD environment variable must be set to seed the admin user.");
    }
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@auditflow.com';
    const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        roleId: adminRole.id,
        status: 'Active',
      },
      create: {
        fullName: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        roleId: adminRole.id,
        status: 'Active',
        branch: 'Head Office',
        district: 'HQ',
        requirePasswordChange: true,
      }
    });

    console.log(`Admin user ensured (email=${adminEmail})`);
  }

  // 3. Risk Levels & Statuses
  const riskLevels = ['High', 'Medium', 'Low'];
  for (const name of riskLevels) {
    await prisma.riskLevel.upsert({ where: { name }, update: {}, create: { name } });
  }

  const statuses = ['Open', 'In Progress', 'Mitigated', 'Closed', 'Awaiting Response'];
  for (const name of statuses) {
    await prisma.findingStatus.upsert({ where: { name }, update: {}, create: { name } });
  }

  // 4. Districts & Branches
  const northern = await prisma.district.upsert({
    where: { name: 'Northern District' },
    update: {},
    create: { name: 'Northern District' },
  });

  await prisma.branch.upsert({
    where: { name: 'Main Street Branch' },
    update: {},
    create: { name: 'Main Street Branch', districtId: northern.id },
  });

  // 5. Audit Hierarchy
  console.log('Seeding audit hierarchy...');
  const root1 = await prisma.auditHierarchyNode.upsert({
    where: { number: '1' },
    update: {},
    create: {
      number: '1',
      title: 'Cash & Vault Management',
      level: 1,
      customFields: [
        { id: 'cf-1', name: 'Cash Over/Short Amount', type: 'number' }
      ]
    }
  });

  // 6. Special Audits
  console.log('Seeding special audits...');
  await prisma.specialAudit.create({
    data: {
      shortSummary: 'Financial Discrepancy in Cash Handling',
      placement: 'Branch',
      placementValue: 'Main Street Branch',
      amountInvolved: 50000,
      recovered: 30000,
      pending: 20000,
      actionDisciplinary: 'Suspension pending further investigation',
      gapWitnessed: 'Lack of daily vault reconciliation',
      correctiveActionTaken: 'Mandatory daily reconciliation policy implemented',
      individuals: {
        create: [
          { name: 'John Doe', position: 'Cashier', tenure: '2 years', age: 28, sex: 'Male' }
        ]
      }
    }
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });