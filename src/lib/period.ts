import { addMonths, endOfDay, isWithinInterval, startOfDay, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths } from 'date-fns';

export type DateRange = { from?: string; to?: string };

/** Parses a yyyy-MM-dd input value as a local-time day boundary. */
function parseDay(value: string | undefined, boundary: 'start' | 'end'): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return boundary === 'start' ? startOfDay(date) : endOfDay(date);
}

/** True when `value` falls inside the inclusive [from, to] range. Open ends are unbounded. */
export function isInDateRange(value: Date | string | null | undefined, range: DateRange): boolean {
  const start = parseDay(range.from, 'start');
  const end = parseDay(range.to, 'end');
  if (!start && !end) return true;
  if (!value) return false;
  const date = new Date(value);
  if (isNaN(date.getTime())) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

export function toInputDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Calendar-quarter and year shortcuts for the range pickers. */
export function periodPresets(now: Date = new Date()): { label: string; range: DateRange }[] {
  const q = (d: Date) => ({ from: toInputDate(startOfQuarter(d)), to: toInputDate(endOfQuarter(d)) });
  const quarterLabel = (d: Date) => `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
  const prev = addMonths(now, -3);
  return [
    { label: `This quarter (${quarterLabel(now)})`, range: q(now) },
    { label: `Last quarter (${quarterLabel(prev)})`, range: q(prev) },
    { label: `This year (${now.getFullYear()})`, range: { from: toInputDate(startOfYear(now)), to: toInputDate(endOfYear(now)) } },
  ];
}

export function describeRange(range: DateRange): string {
  const fmt = (v?: string) => {
    const d = parseDay(v, 'start');
    return d ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;
  };
  const from = fmt(range.from);
  const to = fmt(range.to);
  if (from && to) return `${from} to ${to}`;
  if (from) return `from ${from}`;
  if (to) return `up to ${to}`;
  return 'all periods';
}

const ROLLING_PERIOD_MONTHS: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };

/**
 * Dashboard period rule shared by findings and special audits: 'all', 'custom'
 * (an explicit range), or a rolling window of N months ending `now`. Records
 * without a date pass the rolling windows, as they always have for findings.
 */
export function isInSelectedPeriod(
  value: Date | string | null | undefined,
  period: string,
  customRange: DateRange,
  now: Date = new Date()
): boolean {
  if (period === 'all') return true;
  if (period === 'custom') return isInDateRange(value, customRange);
  const months = ROLLING_PERIOD_MONTHS[period];
  if (!months || !value) return true;
  const date = new Date(value);
  if (isNaN(date.getTime())) return true;
  return isWithinInterval(date, { start: subMonths(now, months), end: now });
}
