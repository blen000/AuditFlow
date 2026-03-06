
'use client';
import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuditFindingCard } from '@/components/audit/AuditFindingCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, PlusCircle, Search, CalendarIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import type { AuditFinding, Branch, RiskLevelData, StatusData, RiskLevel, FindingStatus } from '@/types';
import { initialBranches, initialFindings, initialRiskLevels, initialStatuses } from '@/lib/mock-data';

export default function AuditeeViewPage() {
  const [branches] = useState<Branch[]>(initialBranches);
  const [findings, setFindings] = useState<AuditFinding[]>(initialFindings);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  
  // Filtering states moved from dashboard
  const [allRiskLevels] = useState<RiskLevelData[]>(initialRiskLevels);
  const [allStatuses] = useState<StatusData[]>(initialStatuses);
  const [riskFilter, setRiskFilter] = useState<RiskLevel[]>([]);
  const [statusFilter, setStatusFilter] = useState<FindingStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleDelete = (id: string) => {
    setFindings(prev => prev.filter(f => f.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<AuditFinding>) => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
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
    // 1. Mandatory Branch Filter
    if (!selectedBranch || finding.branchOrDepartment !== selectedBranch) return false;

    // 2. Risk Filter
    const riskMatch = riskFilter.length === 0 || riskFilter.includes(finding.riskLevel);
    
    // 3. Status Filter
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(finding.status);
    
    // 4. Search Match
    const searchMatch =
      searchQuery === '' ||
      finding.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.title.toLowerCase().includes(searchQuery.toLowerCase());

    // 5. Date Match
    const dateMatch = (() => {
      if (!dateRange || (!dateRange.from && !dateRange.to)) return true;
      const from = dateRange.from;
      const to = dateRange.to;
      const targetDate = finding.revalidationDate || finding.mitigationDueDate;
      if (!targetDate) return false;
      const targetDateTime = new Date(targetDate as Date).getTime();
      if (from && !to) return targetDateTime >= new Date(from).getTime();
      if (!from && to) return targetDateTime <= new Date(to).getTime();
      if (from && to) return targetDateTime >= new Date(from).getTime() && targetDateTime <= new Date(to).getTime();
      return true;
    })();

    return riskMatch && statusMatch && searchMatch && dateMatch;
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Auditee Response View"
        description="Select your branch/department to view and respond to findings."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:w-80">
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Current Branch/Department
              </label>
              <Select onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a branch/department" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedBranch ? (
            <div className="space-y-6">
              {/* Finding Details Section Header with Actions */}
              <div className="flex flex-col items-start gap-4 border-t pt-8 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Finding Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Detailed list of individual audit cases for {selectedBranch}.
                  </p>
                </div>
                <div className="flex w-full items-center gap-2 md:w-auto">
                  <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Case No or Title..."
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
                              ) : dateRange?.to ? (
                                `Before ${format(dateRange.to, 'LLL dd, y')}`
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
                          key={level.id}
                          checked={riskFilter.includes(level.name)}
                          onCheckedChange={() => toggleFilter(riskFilter, setRiskFilter, level.name)}
                        >
                          {level.name}
                        </DropdownMenuCheckboxItem>
                      ))}

                      <DropdownMenuLabel className="pt-2">Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {allStatuses.map((status) => (
                        <DropdownMenuCheckboxItem
                          key={status.id}
                          checked={statusFilter.includes(status.name)}
                          onCheckedChange={() => toggleFilter(statusFilter, setStatusFilter, status.name)}
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

              {/* Grid of Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredFindings.length > 0 ? (
                  filteredFindings.map((finding) => (
                    <AuditFindingCard
                      key={finding.id}
                      finding={finding}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    No findings match your current branch and filters.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="mb-2">No Branch Selected</CardTitle>
                <p className="max-w-xs text-muted-foreground">
                  Please select a branch or department from the dropdown above to view associated audit findings.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
