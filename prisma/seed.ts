import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding organizational data...');

  // 1. Roles
  const roles = [
    { name: 'Admin', description: 'Full system access including user and settings management.', permissions: ['audit_read', 'audit_write', 'reports_read', 'settings_manage'], isSpecial: false },
    { name: 'Auditor', description: 'Can create and manage audit findings and view reports.', permissions: ['audit_read', 'audit_write', 'reports_read'], isSpecial: false },
    { name: 'Auditee', description: 'Can view findings related to their branch and provide responses.', permissions: ['audit_read'], isSpecial: false },
    { name: 'CEO', description: 'Executive level oversight and organizational strategy review.', permissions: ['audit_read', 'reports_read'], isSpecial: true },
    { name: 'Chief Auditor', description: 'Top level audit executive with departmental governance responsibilities.', permissions: ['audit_read', 'audit_write', 'reports_read', 'settings_manage'], isSpecial: true },
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
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'password';
    await prisma.user.upsert({
      where: { email: 'admin@auditflow.com' },
      update: {
        roleId: adminRole.id,
        status: 'Active',
      },
      create: {
        fullName: 'System Administrator',
        email: 'admin@auditflow.com',
        password: adminPassword, // NOTE: demo uses plaintext; hash in production
        roleId: adminRole.id,
        status: 'Active',
        branch: 'Head Office',
        district: 'HQ',
      }
    });

    console.log(`Admin user ensured (email=admin@auditflow.com)`);
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
