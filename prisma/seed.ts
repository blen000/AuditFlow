import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding organizational data...');

  // 1. Roles
  const roles = [
    { name: 'Admin', description: 'Full system access including user and settings management.', permissions: ['audit_read', 'audit_write', 'reports_read', 'settings_manage'], isSpecial: false },
    { name: 'Auditor', description: 'Can create and manage audit findings and view reports.', permissions: ['audit_read', 'audit_write', 'reports_read'], isSpecial: false },
    { name: 'Auditee', description: 'Can view findings related to their branch and provide responses.', permissions: ['audit_read'], isSpecial: false },
    { name: 'CEO', description: 'Executive level oversight and organizational strategy review.', permissions: ['audit_read', 'reports_read'], isSpecial: true },
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
    await prisma.user.upsert({
      where: { email: 'admin@auditflow.com' },
      update: {},
      create: {
        fullName: 'System Administrator',
        email: 'admin@auditflow.com',
        roleId: adminRole.id,
        status: 'Active',
        branch: 'Head Office',
        district: 'HQ',
      }
    });
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
  const root1 = await prisma.auditHierarchyNode.create({
    data: {
      number: '1',
      title: 'Cash & Vault Management',
      level: 1,
      customFields: [
        { id: 'cf-1', name: 'Cash Over/Short Amount', type: 'number' }
      ]
    }
  });

  const sub1_1 = await prisma.auditHierarchyNode.create({
    data: {
      number: '1.1',
      title: 'Dual Control Protocols',
      level: 2,
      parentId: root1.id,
      customFields: [
        { id: 'cf-2', name: 'Dual Control Witness', type: 'text' }
      ]
    }
  });

  await prisma.auditHierarchyNode.create({
    data: {
      number: '1.1.1',
      title: 'Vault Access Logs',
      level: 3,
      parentId: sub1_1.id,
    }
  });

  const root2 = await prisma.auditHierarchyNode.create({
    data: {
      number: '2',
      title: 'IT Systems & Cyber Security',
      level: 1,
    }
  });

  await prisma.auditHierarchyNode.create({
    data: {
      number: '2.1',
      title: 'Identity & Access Management',
      level: 2,
      parentId: root2.id,
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
