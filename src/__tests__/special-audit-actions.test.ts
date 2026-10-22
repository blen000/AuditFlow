const prismaMock: any = {
  specialAudit: { create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  findingStatus: { findMany: jest.fn() },
};
const secureMock: any = { specialAudit: { findMany: jest.fn() } };

jest.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
jest.mock('@/lib/securePrisma', () => ({ securePrisma: secureMock }));
jest.mock('@/lib/serverAuth');
jest.mock('@/lib/securityLogger', () => ({ logSecurityEvent: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/app/actions/settings', () => ({
  ensureFollowUpStatuses: jest.fn().mockResolvedValue([{ id: 'f1', name: 'Pending' }]),
}));

import {
  deleteSpecialAudit,
  getSpecialAuditeeViewData,
  getSpecialAudits,
  submitSpecialAudit,
  updateSpecialAuditCase,
} from '@/app/actions/special-audits';
import { getUserFromCookiesServer } from '@/lib/serverAuth';

const mockUser = getUserFromCookiesServer as jest.Mock;
const asRole = (permissions: string[], name = 'Custom') =>
  mockUser.mockResolvedValue({ id: 'u1', email: 'u@test.com', role: { name, permissions } });
const asAdmin = () => asRole([], 'Admin');

const validReport = {
  shortSummary: 'Cash shortage at the main branch',
  placement: 'Branch',
  placementValue: 'Main Branch',
  categoryId: 'cat1',
  amountInvolved: 1000,
  recovered: 400,
  pending: 600,
  actionDisciplinary: 'Warning issued',
  gapWitnessed: 'Dual control not followed',
  correctiveActionTaken: 'Retraining',
  individuals: [{ name: 'Abebe Kebede', position: 'Teller', tenure: '3 years', age: 30, sex: 'Male' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.findingStatus.findMany.mockResolvedValue([{ id: 's1', name: 'Open' }]);
});

describe('submitSpecialAudit: report date (previous periods)', () => {
  beforeEach(() => {
    asRole(['special_audits_new_access']);
    prismaMock.specialAudit.create.mockResolvedValue({});
  });
  const createdDate = () => prismaMock.specialAudit.create.mock.calls[0][0].data.dateCreated as Date;

  it('records today when no date is given', async () => {
    const before = Date.now();
    const res = await submitSpecialAudit({ ...validReport });
    expect(res.success).toBe(true);
    expect(createdDate().getTime()).toBeGreaterThanOrEqual(before);
    expect(createdDate().getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('records an earlier period when a past date is given (Date or ISO string)', async () => {
    const past = new Date(2025, 9, 15, 12);
    expect((await submitSpecialAudit({ ...validReport, dateCreated: past })).success).toBe(true);
    expect(createdDate().getTime()).toBe(past.getTime());

    prismaMock.specialAudit.create.mockClear();
    expect((await submitSpecialAudit({ ...validReport, dateCreated: '2024-03-01T00:00:00.000Z' })).success).toBe(true);
    expect(createdDate().toISOString()).toBe('2024-03-01T00:00:00.000Z');
  });

  it('rejects a future date and an invalid date without writing', async () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const a = await submitSpecialAudit({ ...validReport, dateCreated: future });
    expect(a.success).toBe(false);
    expect((a as any).fieldErrors?.dateCreated).toBeDefined();
    const b = await submitSpecialAudit({ ...validReport, dateCreated: 'nonsense' });
    expect(b.success).toBe(false);
    expect(prismaMock.specialAudit.create).not.toHaveBeenCalled();
  });

  it('still validates the rest of the report', async () => {
    const res = await submitSpecialAudit({ ...validReport, shortSummary: 'short' });
    expect(res.success).toBe(false);
    expect(prismaMock.specialAudit.create).not.toHaveBeenCalled();
  });

  it('requires the Log Special Audit permission', async () => {
    asRole(['auditee_view_special', 'reports_special_audits_access']);
    await expect(submitSpecialAudit({ ...validReport })).rejects.toThrow();
    expect(prismaMock.specialAudit.create).not.toHaveBeenCalled();
  });
});

describe('getSpecialAudits (Special Audit Reports page)', () => {
  beforeEach(() => secureMock.specialAudit.findMany.mockResolvedValue([]));

  it('allows report and logging access', async () => {
    asRole(['reports_special_audits_access']);
    await expect(getSpecialAudits()).resolves.toEqual([]);
    asRole(['special_audits_new_access']);
    await expect(getSpecialAudits()).resolves.toEqual([]);
  });

  it('does not allow a Special-Auditee-View-only role: that role uses its own endpoint', async () => {
    asRole(['auditee_view_special']);
    await expect(getSpecialAudits()).rejects.toThrow();
  });
});

describe('getSpecialAuditeeViewData', () => {
  const row = { id: 'SA1', dateCreated: new Date('2026-10-01'), individuals: [], category: { name: 'Fraud' } };
  beforeEach(() => secureMock.specialAudit.findMany.mockResolvedValue([row]));

  it('returns cases and status lists for the special view permission', async () => {
    asRole(['auditee_view_special']);
    const data = await getSpecialAuditeeViewData();
    expect(data.audits).toHaveLength(1);
    expect(data.audits[0].category).toBe('Fraud');
    expect(data.audits[0].dateCreated).toBe(row.dateCreated.toISOString());
    expect(data.statuses).toEqual([{ id: 's1', name: 'Open' }]);
    expect(data.followUpStatuses).toEqual([{ id: 'f1', name: 'Pending' }]);
  });

  it('is denied to reports-only, logging-only and normal-view-only roles', async () => {
    for (const perms of [
      ['reports_special_audits_access'],
      ['special_audits_new_access'],
      ['auditee_view_access'],
      ['auditee_view_normal'],
    ]) {
      asRole(perms);
      await expect(getSpecialAuditeeViewData()).rejects.toThrow();
    }
    expect(secureMock.specialAudit.findMany).not.toHaveBeenCalled();
  });

  it('is open to Admin', async () => {
    asAdmin();
    await expect(getSpecialAuditeeViewData()).resolves.toBeDefined();
  });
});

describe('updateSpecialAuditCase', () => {
  beforeEach(() => {
    secureMock.specialAudit.findMany.mockResolvedValue([{ id: 'SA1' }]);
    prismaMock.specialAudit.update.mockResolvedValue({});
  });
  const denied = { success: false, error: 'You do not have permission to perform this action.' };

  it('needs BOTH the special view and the matching action permission', async () => {
    asRole(['auditee_view_follow_up']); // action only (legacy -> normal view)
    expect(await updateSpecialAuditCase('SA1', { status: 'Open' }, 'status')).toEqual(denied);
    asRole(['auditee_view_special']); // view only
    expect(await updateSpecialAuditCase('SA1', { status: 'Open' }, 'status')).toEqual(denied);
    asRole(['auditee_view_special', 'auditee_view_follow_up']); // wrong action
    expect(await updateSpecialAuditCase('SA1', { status: 'Open' }, 'status')).toEqual(denied);
    asRole(['auditee_view_normal', 'auditee_view_change_status']); // normal view is not enough
    expect(await updateSpecialAuditCase('SA1', { status: 'Open' }, 'status')).toEqual(denied);
    expect(prismaMock.specialAudit.update).not.toHaveBeenCalled();
  });

  it('lets Admin through', async () => {
    asAdmin();
    expect((await updateSpecialAuditCase('SA1', { status: 'Closed' }, 'status')).success).toBe(true);
  });

  it('changes status and writes only the status field', async () => {
    asRole(['auditee_view_special', 'auditee_view_change_status']);
    expect((await updateSpecialAuditCase('SA1', { status: '  Closed ' }, 'status')).success).toBe(true);
    expect(prismaMock.specialAudit.update).toHaveBeenCalledWith({ where: { id: 'SA1' }, data: { status: 'Closed' } });
    expect((await updateSpecialAuditCase('SA1', { status: '  ' }, 'status')).success).toBe(false);
  });

  it('maps each intent to its own permission', async () => {
    const cases: [any, string, any][] = [
      ['follow_up', 'auditee_view_follow_up', { followUpStatus: 'Rectified' }],
      ['progress', 'auditee_view_add_progress', { progressUpdates: [{ id: 'p1', date: '2026-10-01', details: 'x' }] }],
      ['response', 'auditee_view_auditee_response', { auditeeAgreement: 'Agreed' }],
    ];
    for (const [intent, perm, data] of cases) {
      asRole(['auditee_view_special', perm]);
      expect((await updateSpecialAuditCase('SA1', data, intent)).success).toBe(true);
      asRole(['auditee_view_special', 'auditee_view_change_status']);
      expect(await updateSpecialAuditCase('SA1', data, intent)).toEqual(denied);
    }
  });

  it('rejects a follow-up without a status and a malformed progress payload', async () => {
    asRole(['auditee_view_special', 'auditee_view_follow_up', 'auditee_view_add_progress']);
    expect((await updateSpecialAuditCase('SA1', {}, 'follow_up')).success).toBe(false);
    expect((await updateSpecialAuditCase('SA1', { progressUpdates: 'x' }, 'progress')).success).toBe(false);
  });

  it('validates the auditee response rules', async () => {
    asRole(['auditee_view_special', 'auditee_view_auditee_response']);
    expect((await updateSpecialAuditCase('SA1', { auditeeAgreement: 'Maybe' }, 'response')).success).toBe(false);
    expect((await updateSpecialAuditCase('SA1', { auditeeAgreement: 'Declined', auditeeResponse: '' }, 'response')).success).toBe(false);
    expect((await updateSpecialAuditCase('SA1', { auditeeAgreement: 'Agreed', mitigationDueDate: 'garbage' }, 'response')).success).toBe(false);
    expect(prismaMock.specialAudit.update).not.toHaveBeenCalled();

    await updateSpecialAuditCase('SA1', { auditeeAgreement: 'Agreed', auditeeResponse: 'ignored', mitigationDueDate: '2026-12-01' }, 'response');
    let data = prismaMock.specialAudit.update.mock.calls[0][0].data;
    expect(data.auditeeResponse).toBe('');
    expect(data.mitigationDueDate).toBeInstanceOf(Date);

    await updateSpecialAuditCase('SA1', { auditeeAgreement: 'Declined', auditeeResponse: 'Not our gap', mitigationDueDate: '2026-12-01' }, 'response');
    data = prismaMock.specialAudit.update.mock.calls[1][0].data;
    expect(data.auditeeResponse).toBe('Not our gap');
    expect(data.mitigationDueDate).toBeNull(); // declined cases carry no due date
  });

  it('reports not-found for a case outside the user scope', async () => {
    secureMock.specialAudit.findMany.mockResolvedValue([]);
    asRole(['auditee_view_special', 'auditee_view_change_status']);
    expect(await updateSpecialAuditCase('NOPE', { status: 'Open' }, 'status')).toEqual({ success: false, error: 'Case not found' });
    expect(prismaMock.specialAudit.update).not.toHaveBeenCalled();
  });
});

describe('deleteSpecialAudit', () => {
  beforeEach(() => prismaMock.specialAudit.delete.mockResolvedValue({}));

  it('is allowed for Admin and for roles with special view + delete', async () => {
    asAdmin();
    expect((await deleteSpecialAudit('SA1')).success).toBe(true);
    asRole(['auditee_view_special', 'auditee_view_delete_finding']);
    expect((await deleteSpecialAudit('SA2')).success).toBe(true);
    asRole(['auditee_view_access', 'auditee_view_special']); // parent grants delete
    expect((await deleteSpecialAudit('SA3')).success).toBe(true);
    expect(prismaMock.specialAudit.delete).toHaveBeenCalledTimes(3);
  });

  it('is denied without the special view, without delete, or with only report access', async () => {
    for (const perms of [
      ['auditee_view_delete_finding'], // delete but only the normal view
      ['auditee_view_special'],
      ['reports_special_audits_access', 'special_audits_new_access'],
      ['auditee_view_normal', 'auditee_view_delete_finding'],
    ]) {
      asRole(perms);
      await expect(deleteSpecialAudit('SA1')).rejects.toThrow();
    }
    expect(prismaMock.specialAudit.delete).not.toHaveBeenCalled();
  });
});
