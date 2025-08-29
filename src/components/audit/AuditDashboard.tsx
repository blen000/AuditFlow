'use client';
import { useState } from 'react';
import { mockFindings } from '@/lib/mock-data';
import type { AuditFinding, RiskLevel, FindingStatus } from '@/types';
import { AuditFindingCard } from './AuditFindingCard';
import { Button } from '@/components/ui/button';
import { Filter, PlusCircle } from 'lucide-react';
import { LogFindingDialog } from './LogFindingDialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function AuditDashboard() {
  const [findings, setFindings] = useState<AuditFinding[]>(mockFindings);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<AuditFinding | null>(
    null
  );

  const [riskFilter, setRiskFilter] = useState<RiskLevel[]>([]);
  const [statusFilter, setStatusFilter] = useState<FindingStatus[]>([]);

  const handleLogNew = () => {
    setEditingFinding(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (finding: AuditFinding) => {
    setEditingFinding(finding);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setFindings((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<AuditFinding>) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleSave = (finding: AuditFinding) => {
    const exists = findings.some((f) => f.id === finding.id);
    if (exists) {
      setFindings((prev) =>
        prev.map((f) => (f.id === finding.id ? finding : f))
      );
    } else {
      setFindings((prev) => [finding, ...prev]);
    }
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
  
  const filteredFindings = findings.filter(finding => {
    const riskMatch = riskFilter.length === 0 || riskFilter.includes(finding.riskLevel);
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(finding.status);
    return riskMatch && statusMatch;
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Audit Findings</h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
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

              <DropdownMenuLabel className="pt-2">Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['Open', 'In Progress', 'Mitigated', 'Closed'] as FindingStatus[]).map(
                (status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilter.includes(status)}
                    onCheckedChange={() =>
                      toggleFilter(statusFilter, setStatusFilter, status)
                    }
                  >
                    {status}
                  </DropdownMenuCheckboxItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleLogNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Log New Finding
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredFindings.map((finding) => (
          <AuditFindingCard
            key={finding.id}
            finding={finding}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
      <LogFindingDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        finding={editingFinding}
      />
    </>
  );
}
