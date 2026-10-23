'use client';

import { CalendarRange } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toInputDate, type DateRange } from '@/lib/period';

/** From / To date inputs (inclusive; either end may be left open). */
export function DateRangeFilter({
  value,
  onChange,
  label = 'Filter by Date',
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  label?: string;
}) {
  const today = toInputDate(new Date());
  return (
    <div className="w-full space-y-2 md:flex-[1.4]">
      <label className="ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <CalendarRange className="h-3 w-3" /> {label}
      </label>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          aria-label="From date"
          className="h-11 bg-background"
          value={value.from ?? ''}
          max={value.to || today}
          onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          aria-label="To date"
          className="h-11 bg-background"
          value={value.to ?? ''}
          min={value.from}
          onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
