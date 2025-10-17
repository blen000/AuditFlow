'use client';
import { useState } from 'react';
import Link from 'next/link';
import { mockFindings } from '@/lib/mock-data';
import type { AuditFinding, FindingStatus } from '@/types';
import { AuditFindingCard } from './AuditFindingCard';
import { Button } from '@/components/ui/button';
import { Filter, PlusCircle, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { riskLevels as allRiskLevels } from '@/lib/risk-levels';
import { statuses as allStatuses } from '@/lib/statuses';
import type { RiskLevel } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

export default function AuditDashboard() {
  const [findings, setFindings] = useState<AuditFinding[]>(mockFindings);
  const [riskFilter, setRiskFilter] = useState<RiskLevel[]>([]);
  const [statusFilter, setStatusFilter] = useState<FindingStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleDelete = (id: string) => {
    setFindings((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<AuditFinding>) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const toggleFilter = <T extends string>(
    filter: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    value: T
  ) => {
    if (filter.includes(value)) {
      setter(filter.filter((item) => item !== value));
    } else {
      setter([...filter, value]);
    }
  };

  const filteredFindings = findings.filter((finding) => {
    const riskMatch =
      riskFilter.length === 0 || riskFilter.includes(finding.riskLevel);
    const statusMatch =
      statusFilter.length === 0 || statusFilter.includes(finding.status);
    const searchMatch =
      searchQuery === '' ||
      finding.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const dateMatch = (() => {
      if (!dateRange || (!dateRange.from && !dateRange.to)) return true;

      const from = dateRange.from;
      const to = dateRange.to;
      const targetDate = finding.revalidationDate || finding.mitigationDueDate;

      if (!targetDate) return false;

      if (from && !to) {
        return targetDate >= from;
      }
      if (!from && to) {
        return targetDate <= to;
      }
      if (from && to) {
        return targetDate >= from && targetDate <= to;
      }
      return true;
    })();

    return riskMatch && statusMatch && searchMatch && dateMatch;
  });

  return (
    <>
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Audit Findings</h2>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by Case No..."
              className="pl-8 sm:w-[200px] md:w-[250px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dateRange && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'LLL dd, y')} -{' '}
                              {format(dateRange.to, 'LLL dd, y')}
                            </>
                          ) : (
                            format(dateRange.from, 'LLL dd, y')
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
              </div>

              <DropdownMenuLabel className="pt-2">Filter by Risk</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allRiskLevels.map((level) => (
                <DropdownMenuCheckboxItem
                  key={level.name}
                  checked={riskFilter.includes(level.name)}
                  onCheckedChange={() =>
                    toggleFilter(riskFilter, setRiskFilter, level.name)
                  }
                >
                  {level.name}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuLabel className="pt-2">
                Filter by Status
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allStatuses.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status.name}
                  checked={statusFilter.includes(status.name)}
                  onCheckedChange={() =>
                    toggleFilter(statusFilter, setStatusFilter, status.name)
                  }
                >
                  {status.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild>
            <Link href="/findings/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Log New
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredFindings.map((finding) => (
          <AuditFindingCard
            key={finding.id}
            finding={finding}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </>
  );
}
