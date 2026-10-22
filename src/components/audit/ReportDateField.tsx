'use client';

import type { Control, FieldValues, Path } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toInputDate } from '@/lib/period';

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Date the special audit actually took place. Leaving it empty records today; a past
 * date lets cases from earlier periods be entered under the period they belong to.
 * A native date input is used so any earlier year can be typed or picked directly.
 */
export function ReportDateField<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: Path<T>;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Report Date</FormLabel>
          <FormControl>
            <Input
              type="date"
              max={toInputDate(new Date())}
              value={isValidDate(field.value) ? toInputDate(field.value) : ''}
              onChange={(e) => {
                const [y, m, d] = e.target.value.split('-').map(Number);
                field.onChange(y && m && d ? new Date(y, m - 1, d, 12) : undefined);
              }}
            />
          </FormControl>
          <FormDescription>Leave empty for today. Pick an earlier date when recording a case from a previous period.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
