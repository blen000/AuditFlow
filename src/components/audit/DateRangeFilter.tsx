'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { periodPresets, type DateRange } from '@/lib/period';

type DateRangeFilterProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
};

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const presets = periodPresets();
  return (
    <div className={className}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">From</Label>
          <Input
            type="date"
            className="h-9 w-40"
            value={value.from ?? ''}
            max={value.to || undefined}
            onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">To</Label>
          <Input
            type="date"
            className="h-9 w-40"
            value={value.to ?? ''}
            min={value.from || undefined}
            onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button key={p.label} type="button" variant="outline" size="sm" className="h-9 text-xs" onClick={() => onChange(p.range)}>
              {p.label}
            </Button>
          ))}
          {(value.from || value.to) && (
            <Button type="button" variant="ghost" size="sm" className="h-9 text-xs" onClick={() => onChange({})}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
