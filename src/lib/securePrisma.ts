import { prisma } from './prisma';
import { getScopingFilter } from './authorization';

/**
 * A secure wrapper around Prisma to enforce query-level scoping automatically.
 * Only includes relations that exist in the current Prisma client to avoid build errors
 * when the database hasn't been migrated with new relations.
 */
export const securePrisma = {
  finding: {
    findMany: async (args: any = {}) => {
      const filter = await getScopingFilter('finding');
      return prisma.auditFinding.findMany({
        ...args,
        where: {
          ...args.where,
          ...filter,
        },
      });
    },
    findUnique: async (args: any) => {
      const filter = await getScopingFilter('finding');
      const result = await prisma.auditFinding.findUnique(args);
      if (!result) return null;
      
      // Ownership check for single record
      const scopedResult = await prisma.auditFinding.findFirst({
        where: {
          id: result.id,
          ...filter,
        },
      });
      return scopedResult;
    },
  },
  user: {
    findMany: async (args: any = {}) => {
      const filter = await getScopingFilter('user');
      return prisma.user.findMany({
        ...args,
        where: {
          ...args.where,
          ...filter,
        },
      });
    },
    findUnique: async (args: any) => {
      const filter = await getScopingFilter('user');
      const result = await prisma.user.findUnique(args);
      if (!result) return null;

      const scopedResult = await prisma.user.findFirst({
        where: {
          id: result.id,
          ...filter,
        },
      });
      return scopedResult;
    },
  },
  specialAudit: {
    findMany: async (args: any = {}) => {
      const filter = await getScopingFilter('specialAudit');
      return prisma.specialAudit.findMany({
        ...args,
        where: {
          ...args.where,
          ...filter,
        },
      });
    },
  },
};
