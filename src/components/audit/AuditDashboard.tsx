'use client';
import { useState } from 'react';
import Link from 'next/link';
import { mockFindings } from '@/lib/mock-data';
import type { AuditFinding, RiskLevel, FindingStatus } from '@/types';
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

export default function AuditDashboard() {
  const [findings, setFindings] = useState<AuditFinding[]>(mockFindings);
  const [riskFilter, setRiskFilter] = useState<RiskLevel[]>([]);
  const [statusFilter, setStatusFilter] = useState<FindingStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    return riskMatch && statusMatch && searchMatch;
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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Risk</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['High', 'Medium', 'Low'] as RiskLevel[]).map((level) => (
                <DropdownMenuCheckboxItem
                  key={level}
                  checked={riskFilter.includes(level)}
                  onCheckedChange={() =>
                    toggleFilter(riskFilter, setRiskFilter, level)
                  }
                >
                  {level}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuLabel className="pt-2">
                Filter by Status
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(
                ['Open', 'In Progress', 'Mitigated', 'Closed'] as FindingStatus[]
              ).map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={() =>
                    toggleFilter(statusFilter, setStatusFilter, status)
                  }
                >
                  {status}
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
