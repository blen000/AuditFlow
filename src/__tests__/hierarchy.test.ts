const prismaMock: any = {
  auditHierarchyNode: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(),
};
jest.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
jest.mock('@/lib/serverAuth');
jest.mock('@/lib/securityLogger', () => ({ logSecurityEvent: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

import { createHierarchyNode, createHierarchyNodes, updateHierarchyNode } from '@/app/actions/settings';
import { parseTitleList, suggestNextNumber } from '@/lib/hierarchy';
import { getUserFromCookiesServer } from '@/lib/serverAuth';

const n = (id: string, number: string, level: number, parentId: string | null = null) => ({ id, number, level, parentId });

describe('suggestNextNumber', () => {
  it('starts at 1 for an empty hierarchy and for a parent with no children', () => {
    expect(suggestNextNumber([], null)).toBe('1');
    expect(suggestNextNumber([n('a', '1', 1)], n('a', '1', 1))).toBe('1.1');
  });
  it('continues after the highest sibling, not the count', () => {
    const nodes = [n('a', '1', 1), n('b', '2', 1), n('c', '5', 1)];
    expect(suggestNextNumber(nodes, null)).toBe('6');
  });
  it('numbers children under their parent prefix and ignores other branches', () => {
    const p = n('a', '2', 1);
    const nodes = [p, n('b', '1', 1), n('c', '2.1', 2, 'a'), n('d', '2.3', 2, 'a'), n('e', '1.9', 2, 'b')];
    expect(suggestNextNumber(nodes, p)).toBe('2.4');
  });
  it('goes deeper', () => {
    const p = n('c', '2.1', 2, 'a');
    expect(suggestNextNumber([p, n('x', '2.1.1', 3, 'c')], p)).toBe('2.1.2');
  });
  it('never returns a number that is already taken anywhere', () => {
    // a stray node outside the parent already uses 1.2
    const p = n('a', '1', 1);
    const nodes = [p, n('x', '1.1', 2, 'a'), n('y', '1.2', 2, 'zzz')];
    expect(suggestNextNumber(nodes, p)).toBe('1.3');
  });
});

describe('parseTitleList', () => {
  it('splits lines, drops blanks and trims', () => {
    expect(parseTitleList('Cash handling\n\n  Vault access  \r\nATM')).toEqual(['Cash handling', 'Vault access', 'ATM']);
  });
  it('strips bullets and pasted numbering', () => {
    expect(parseTitleList('- One\n* Two\n• Three\n1. Four\n2) Five\n3.1 Six')).toEqual(['One', 'Two', 'Three', 'Four', 'Five', 'Six']);
  });
  it('keeps titles that merely start with a digit', () => {
    expect(parseTitleList('24/7 ATM monitoring\n2026 Budget review')).toEqual(['24/7 ATM monitoring', '2026 Budget review']);
  });
  it('returns nothing for empty input', () => {
    expect(parseTitleList('  \n \n')).toEqual([]);
  });
});

const asRole = (permissions: string[], name = 'Custom') =>
  (getUserFromCookiesServer as jest.Mock).mockResolvedValue({ id: 'u1', email: 'u@test.com', role: { name, permissions } });

describe('hierarchy server actions', () => {
  const existing = [n('m1', '1', 1), n('m2', '2', 1), n('s1', '2.1', 2, 'm2')];
  beforeEach(() => {
    jest.clearAllMocks();
    asRole(['settings_audit_structure_access']);
    prismaMock.auditHierarchyNode.findMany.mockResolvedValue(existing.map((x) => ({ ...x })));
    prismaMock.auditHierarchyNode.create.mockImplementation(async (a: any) => ({ id: 'new', ...a.data }));
    prismaMock.$transaction.mockImplementation(async (ops: any[]) => Promise.all(ops));
  });

  describe('createHierarchyNode', () => {
    it('generates the Ref No. and takes the level from the parent', async () => {
      expect((await createHierarchyNode({ title: 'Teller cash', parentId: 'm2' })).success).toBe(true);
      expect(prismaMock.auditHierarchyNode.create.mock.calls[0][0].data).toMatchObject({
        title: 'Teller cash', number: '2.2', level: 2, parentId: 'm2',
      });
    });
    it('creates a Level 1 mission when there is no parent', async () => {
      await createHierarchyNode({ title: 'Lending' });
      expect(prismaMock.auditHierarchyNode.create.mock.calls[0][0].data).toMatchObject({ number: '3', level: 1, parentId: null });
    });
    it('ignores a level sent by the client', async () => {
      await createHierarchyNode({ title: 'Lending', level: 9, parentId: 'm1' });
      expect(prismaMock.auditHierarchyNode.create.mock.calls[0][0].data.level).toBe(2);
    });
    it('uses a supplied Ref No. when it is free, and rejects a duplicate with a clear message', async () => {
      expect((await createHierarchyNode({ title: 'Custom', number: '7' })).success).toBe(true);
      expect(prismaMock.auditHierarchyNode.create.mock.calls[0][0].data.number).toBe('7');
      const dup = await createHierarchyNode({ title: 'Again', number: '2.1' });
      expect(dup.success).toBe(false);
      expect(dup.error).toMatch(/2\.1.*already used/);
    });
    it('rejects a missing parent and a blank title', async () => {
      expect((await createHierarchyNode({ title: 'x', parentId: 'gone' })).success).toBe(false);
      expect((await createHierarchyNode({ title: '   ' })).success).toBe(false);
      expect(prismaMock.auditHierarchyNode.create).not.toHaveBeenCalled();
    });
    it('requires the Audit Structure permission', async () => {
      asRole(['settings_branches_access']);
      await expect(createHierarchyNode({ title: 'Nope' })).rejects.toThrow();
      expect(prismaMock.auditHierarchyNode.create).not.toHaveBeenCalled();
    });
  });

  describe('createHierarchyNodes (add several)', () => {
    it('numbers each title in turn under the parent', async () => {
      const res = await createHierarchyNodes('m2', ['Cash', 'Vault', 'ATM']);
      expect(res).toMatchObject({ success: true, created: 3 });
      const rows = prismaMock.auditHierarchyNode.create.mock.calls.map((c: any) => c[0].data);
      expect(rows.map((r: any) => r.number)).toEqual(['2.2', '2.3', '2.4']);
      expect(rows.every((r: any) => r.level === 2 && r.parentId === 'm2')).toBe(true);
    });
    it('numbers top-level missions from the next free number', async () => {
      await createHierarchyNodes(null, ['Lending', 'Treasury']);
      const rows = prismaMock.auditHierarchyNode.create.mock.calls.map((c: any) => c[0].data);
      expect(rows.map((r: any) => r.number)).toEqual(['3', '4']);
      expect(rows.every((r: any) => r.level === 1 && r.parentId === null)).toBe(true);
    });
    it('writes everything in one transaction', async () => {
      await createHierarchyNodes(null, ['A title', 'B title']);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.$transaction.mock.calls[0][0]).toHaveLength(2);
    });
    it('trims, skips blanks, and rejects empty or oversized lists', async () => {
      await createHierarchyNodes(null, ['  Keep  ', '', '   ']);
      expect(prismaMock.auditHierarchyNode.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.auditHierarchyNode.create.mock.calls[0][0].data.title).toBe('Keep');

      expect((await createHierarchyNodes(null, ['', ' '])).success).toBe(false);
      expect((await createHierarchyNodes(null, Array.from({ length: 101 }, (_, i) => `Title ${i}`))).success).toBe(false);
    });
    it('rejects a missing parent and requires the permission', async () => {
      expect((await createHierarchyNodes('gone', ['x title'])).success).toBe(false);
      asRole([]);
      await expect(createHierarchyNodes(null, ['x title'])).rejects.toThrow();
    });
  });

  describe('updateHierarchyNode', () => {
    it('reports a duplicate Ref No. clearly', async () => {
      prismaMock.auditHierarchyNode.update.mockRejectedValue({ code: 'P2002' });
      expect(await updateHierarchyNode('m1', { number: '2' })).toEqual({ success: false, error: 'That Ref No. is already used by another level.' });
    });
  });
});

describe('deleteHierarchyNode', () => {
  const { deleteHierarchyNode } = require('@/app/actions/settings');
  beforeEach(() => {
    jest.clearAllMocks();
    asRole(['settings_audit_structure_access']);
    prismaMock.auditHierarchyNode.findMany.mockResolvedValue([n('m1', '1', 1), n('s1', '1.1', 2, 'm1'), n('m2', '2', 1)]);
    prismaMock.auditFinding = { count: jest.fn().mockResolvedValue(0) };
    prismaMock.auditHierarchyNode.delete = jest.fn().mockResolvedValue({});
  });

  it('deletes an empty leaf level', async () => {
    expect((await deleteHierarchyNode('m2')).success).toBe(true);
    expect(prismaMock.auditHierarchyNode.delete).toHaveBeenCalledWith({ where: { id: 'm2' } });
  });
  it('refuses a level that still has findings, with a clear message, without touching the database', async () => {
    prismaMock.auditFinding.count.mockResolvedValue(3);
    const res = await deleteHierarchyNode('m2');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/2 cannot be deleted: 3 findings are logged/);
    expect(prismaMock.auditHierarchyNode.delete).not.toHaveBeenCalled();
  });
  it('refuses a level that has sub-levels', async () => {
    const res = await deleteHierarchyNode('m1');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/has sub-levels/);
    expect(prismaMock.auditHierarchyNode.delete).not.toHaveBeenCalled();
  });
  it('requires the Audit Structure permission', async () => {
    asRole([]);
    await expect(deleteHierarchyNode('m2')).rejects.toThrow();
  });
});

describe('orderHierarchyAsTree', () => {
  const { orderHierarchyAsTree } = require('@/lib/hierarchy');
  const nodes = [
    n('c1', '1.1', 2, 'm1'), n('m2', '2', 1), n('m1', '1', 1), n('c2', '1.2', 2, 'm1'),
    n('g', '1.1.1', 3, 'c1'), n('m10', '10', 1), n('d', '2.1', 2, 'm2'),
  ];
  const nums = (l: any[]) => l.map((x) => x.number);

  it('puts each category directly above its own sub-sections', () => {
    expect(nums(orderHierarchyAsTree(nodes))).toEqual(['1', '1.1', '1.1.1', '1.2', '2', '2.1', '10']);
  });
  it('sorts numerically, so 10 comes after 2', () => {
    expect(nums(orderHierarchyAsTree(nodes)).slice(-1)).toEqual(['10']);
  });
  it('keeps matches with their ancestors when filtering', () => {
    expect(nums(orderHierarchyAsTree(nodes, new Set(['g'])))).toEqual(['1', '1.1', '1.1.1']);
    expect(nums(orderHierarchyAsTree(nodes, new Set(['d', 'm10'])))).toEqual(['2', '2.1', '10']);
  });
  it('does not lose orphans or loop on a cycle', () => {
    expect(nums(orderHierarchyAsTree([n('o', '5.1', 2, 'gone'), n('a', '1', 1)]))).toEqual(['1', '5.1']);
    expect(orderHierarchyAsTree([n('x', '1', 1, 'y'), n('y', '2', 1, 'x')])).toHaveLength(0);
  });
});
