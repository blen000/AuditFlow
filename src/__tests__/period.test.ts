import { describeRange, isInDateRange, isInSelectedPeriod, periodPresets, toInputDate } from '../lib/period';

// Local-time constructor: the period helpers work on local calendar days.
const d = (y: number, m: number, day: number, h = 12, min = 0, s = 0) => new Date(y, m - 1, day, h, min, s);

describe('isInDateRange (Q4 2026 example: 1 Oct - 31 Dec)', () => {
  const q4 = { from: '2026-10-01', to: '2026-12-31' };

  it('includes both boundary days, even at the very start and end of the day', () => {
    expect(isInDateRange(d(2026, 10, 1, 0, 0, 0), q4)).toBe(true);
    expect(isInDateRange(d(2026, 12, 31, 23, 59, 59), q4)).toBe(true);
  });
  it('excludes the moment before and after', () => {
    expect(isInDateRange(d(2026, 9, 30, 23, 59, 59), q4)).toBe(false);
    expect(isInDateRange(d(2027, 1, 1, 0, 0, 0), q4)).toBe(false);
  });
  it('includes dates inside', () => {
    expect(isInDateRange(d(2026, 11, 15), q4)).toBe(true);
    expect(isInDateRange('2026-11-15T09:00:00.000Z', q4)).toBe(true);
  });
  it('treats open ends as unbounded', () => {
    expect(isInDateRange(d(2020, 1, 1), { from: '2026-10-01' })).toBe(false);
    expect(isInDateRange(d(2099, 1, 1), { from: '2026-10-01' })).toBe(true);
    expect(isInDateRange(d(2099, 1, 1), { to: '2026-12-31' })).toBe(false);
    expect(isInDateRange(d(2001, 1, 1), { to: '2026-12-31' })).toBe(true);
  });
  it('lets everything through, even undated records, when no bounds are set', () => {
    expect(isInDateRange(null, {})).toBe(true);
    expect(isInDateRange(d(1999, 1, 1), {})).toBe(true);
  });
  it('excludes undated or invalid records once a bound is set', () => {
    expect(isInDateRange(null, q4)).toBe(false);
    expect(isInDateRange(undefined, q4)).toBe(false);
    expect(isInDateRange('not a date', q4)).toBe(false);
  });
  it('ignores malformed range input rather than throwing', () => {
    expect(isInDateRange(d(2026, 11, 1), { from: 'garbage' })).toBe(true);
  });
  it('handles a single-day range', () => {
    const day = { from: '2026-10-15', to: '2026-10-15' };
    expect(isInDateRange(d(2026, 10, 15, 8), day)).toBe(true);
    expect(isInDateRange(d(2026, 10, 16, 0, 0, 1), day)).toBe(false);
  });
});

describe('isInSelectedPeriod (dashboard period rule)', () => {
  const now = d(2026, 10, 22);
  const none = {};

  it("'all' accepts everything", () => {
    expect(isInSelectedPeriod(d(2000, 1, 1), 'all', none, now)).toBe(true);
    expect(isInSelectedPeriod(null, 'all', none, now)).toBe(true);
  });
  it("'custom' uses the explicit range", () => {
    const range = { from: '2026-10-01', to: '2026-12-31' };
    expect(isInSelectedPeriod(d(2026, 10, 5), 'custom', range, now)).toBe(true);
    expect(isInSelectedPeriod(d(2026, 9, 5), 'custom', range, now)).toBe(false);
    expect(isInSelectedPeriod(null, 'custom', range, now)).toBe(false);
  });
  it.each([
    ['1m', d(2026, 9, 25), d(2026, 9, 1)],
    ['3m', d(2026, 8, 1), d(2026, 6, 1)],
    ['6m', d(2026, 5, 1), d(2026, 3, 1)],
    ['1y', d(2025, 12, 1), d(2025, 6, 1)],
  ])('rolling window %s keeps recent and drops old records', (period, recent, old) => {
    expect(isInSelectedPeriod(recent, period, none, now)).toBe(true);
    expect(isInSelectedPeriod(old, period, none, now)).toBe(false);
  });
  it('drops records dated in the future for rolling windows (not yet happened)', () => {
    expect(isInSelectedPeriod(d(2026, 12, 1), '3m', none, now)).toBe(false);
  });
  it('lets undated records pass rolling windows, and ignores unknown periods', () => {
    expect(isInSelectedPeriod(null, '3m', none, now)).toBe(true);
    expect(isInSelectedPeriod(d(1990, 1, 1), 'weird', none, now)).toBe(true);
  });
  it('applies the same rule to special audit creation dates (ISO strings)', () => {
    expect(isInSelectedPeriod(d(2026, 10, 1).toISOString(), '1m', none, now)).toBe(true);
    expect(isInSelectedPeriod(d(2025, 1, 1).toISOString(), '1m', none, now)).toBe(false);
  });
});

describe('periodPresets / toInputDate / describeRange', () => {
  it('formats local dates as yyyy-MM-dd with zero padding', () => {
    expect(toInputDate(d(2026, 3, 5))).toBe('2026-03-05');
  });
  it('builds this and last quarter plus this year from a fixed date', () => {
    const p = periodPresets(d(2026, 10, 22));
    expect(p[0].range).toEqual({ from: '2026-10-01', to: '2026-12-31' });
    expect(p[1].range).toEqual({ from: '2026-07-01', to: '2026-09-30' });
    expect(p[2].range).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });
  it('describes ranges', () => {
    expect(describeRange({ from: '2026-10-01', to: '2026-12-31' })).toBe('October 1, 2026 to December 31, 2026');
    expect(describeRange({ from: '2026-10-01' })).toBe('from October 1, 2026');
    expect(describeRange({ to: '2026-12-31' })).toBe('up to December 31, 2026');
    expect(describeRange({})).toBe('all periods');
  });
});
