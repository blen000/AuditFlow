'use client';
import { useState, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, PlusCircle, Search, CalendarIcon, ShieldCheck, Layers, ChevronRight, FileText } from 'lucide-react';
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
import { CaseReportDialog } from '@/components/audit/CaseReportDialog';

export default function AuditeeViewPage() {
  const [branches] = useState<Branch[]>(initialBranches);
  const [findings, setFindings] = useState<AuditFinding[]>(initialFindings);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  
  const [allRiskLevels] = useState<RiskLevelData[]>(initialRiskLevels);
  const [allStatuses] = useState<StatusData[]>(initialStatuses);
  const [riskFilter, setRiskFilter] = useState<RiskLevel[]>([]);
  const [statusFilter, setStatusFilter] = useState<FindingStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditorSearch, setAuditorSearch] = useState('');

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
    if (!selectedBranch) return false;
    if (selectedBranch !== 'all' && finding.branchOrDepartment !== selectedBranch) return false;

    const riskMatch = riskFilter.length === 0 || riskFilter.includes(finding.riskLevel);
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(finding.status);
    const searchMatch = searchQuery === '' ||
      finding.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.parentSummary.toLowerCase().includes(searchQuery.toLowerCase());

    const auditorMatch = auditorSearch === '' || 
      finding.teamLeader.toLowerCase().includes(auditorSearch.toLowerCase()) ||
      finding.teamMembers.some(m => m.toLowerCase().includes(auditorSearch.toLowerCase()));

    return riskMatch && statusMatch && searchMatch && auditorMatch;
  });

  // Grouped Rendering: Case -> Subsection -> Findings
  const hierarchicalData = useMemo(() => {
    const cases: Record<string, { summary: string, allFindings: AuditFinding[], subsections: Record<string, { title: string, findings: AuditFinding[] }> }> = {};
    
    filteredFindings.forEach(f => {
      if (!cases[f.parentCaseNumber]) {
        cases[f.parentCaseNumber] = { summary: f.parentSummary, allFindings: [], subsections: {} };
      }
      
      cases[f.parentCaseNumber].allFindings.push(f);
      
      const subKey = f.subsectionId || 'default';
      const subTitle = f.subsectionTitle || 'General Subsection';
      
      if (!cases[f.parentCaseNumber].subsections[subKey]) {
        cases[f.parentCaseNumber].subsections[subKey] = { title: subTitle, findings: [] };
      }
      
      cases[f.parentCaseNumber].subsections[subKey].findings.push(f);
    });
    
    return Object.entries(cases).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredFindings]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Auditee Mission Control"
        description="Select your branch to manage hierarchical audit findings."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:w-80">
              <label className="mb-1.5 block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Current Branch/Department
              </label>
              <Select onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a branch/department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedBranch ? (
            <div className="space-y-12">
              <div className="flex flex-col items-start gap-4 border-t pt-8">
                <div className="flex w-full flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Mission Oversight</h2>
                    <p className="text-sm text-muted-foreground">
                      Hierarchical management for {selectedBranch === 'all' ? 'All Branches' : selectedBranch}.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/findings/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Log Hierarchical Audit
                    </Link>
                  </Button>
                </div>

                <div className="flex w-full flex-col gap-3 rounded-lg border bg-muted/30 p-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search Case ID, Parent Summary or Title..."
                      className="pl-8 bg-background"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="relative flex-1">
                    <ShieldCheck className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Filter by Team Leader or Member..."
                      className="pl-8 bg-background"
                      value={auditorSearch}
                      onChange={(e) => setAuditorSearch(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shrink-0 bg-background">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>Risk Severity</DropdownMenuLabel>
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
                      <DropdownMenuLabel className="pt-2">Workflow Status</DropdownMenuLabel>
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
                </div>
              </div>

              {/* Grouped Rendering */}
              <div className="space-y-16">
                {hierarchicalData.length > 0 ? (
                  hierarchicalData.map(([caseNum, caseGroup]) => (
                    <div key={caseNum} className="space-y-8">
                      {/* Case Level (L1) */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
                        <div className="flex items-center gap-4">
                          <Badge className="h-10 w-12 rounded-lg flex items-center justify-center text-xl font-bold bg-primary text-primary-foreground">
                            {caseNum}
                          </Badge>
                          <div className="flex flex-col">
                            <h3 className="text-2xl font-black tracking-tight text-foreground uppercase">{caseGroup.summary}</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Main Audit Mission #{caseNum}</p>
                          </div>
                        </div>
                        <CaseReportDialog 
                          caseNum={caseNum} 
                          caseSummary={caseGroup.summary} 
                          findings={caseGroup.allFindings} 
                        />
                      </div>

                      {/* Subsection Level (L2) */}
                      <div className="space-y-10 pl-4 border-l-2 border-dashed border-muted ml-6">
                        {Object.entries(caseGroup.subsections).map(([subId, subGroup]) => (
                          <div key={subId} className="space-y-4">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="px-2 py-0.5 text-xs font-bold">
                                {subId === 'default' ? `${caseNum}.X` : subId}
                              </Badge>
                              <h4 className="text-lg font-bold text-muted-foreground flex items-center gap-2">
                                {subGroup.title}
                                <ChevronRight className="h-4 w-4 opacity-50" />
                              </h4>
                            </div>
                            
                            {/* Finding/Leaf Level (L3) */}
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {subGroup.findings.map(finding => (
                                <AuditFindingCard
                                  key={finding.id}
                                  finding={finding}
                                  onDelete={handleDelete}
                                  onUpdate={handleUpdate}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold">No missions found</h3>
                    <p className="text-muted-foreground">Adjust your filters to view hierarchical audit results.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Card className="border-dashed bg-muted/10 py-24">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <CardTitle className="mb-2">Awaiting Selection</CardTitle>
                <p className="max-w-xs text-muted-foreground text-sm">
                  Please select a branch or department from the top selector to view organized audit missions and nested sub-findings.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
