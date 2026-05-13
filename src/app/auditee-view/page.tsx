'use client';
import { useState, useMemo, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, PlusCircle, Search, ShieldCheck, ChevronRight, ChevronDown, Building2, Briefcase, FilterX, Loader2, ListTree } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type { AuditFinding, Branch, RiskLevelData, StatusData, RiskLevel, FindingStatus, Department, AuditHierarchyNode } from '@/types';
import { CaseReportDialog } from '@/components/audit/CaseReportDialog';
import { getAuditeeViewData } from '@/app/actions/auditee-view';
import { updateFinding } from '@/app/actions/findings';

export default function AuditeeViewPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [hierarchy, setHierarchy] = useState<AuditHierarchyNode[]>([]);
  const [allRiskLevels, setAllRiskLevels] = useState<RiskLevelData[]>([]);
  const [allStatuses, setAllStatuses] = useState<StatusData[]>([]);
  
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel[]>([]);
  const [statusFilter, setStatusFilter] = useState<FindingStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditorSearch, setAuditorSearch] = useState('');

  // Expansion State
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAuditeeViewData();
        setFindings(data.findings as any);
        setHierarchy(data.hierarchy as any);
        setBranches(data.branches as any);
        setDepartments(data.departments as any);
        setAllRiskLevels(data.riskLevels as any);
        setAllStatuses(data.statuses as any);
      } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') return;
        console.error('Error loading auditee view data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleCase = (caseId: string) => {
    const next = new Set(expandedCases);
    if (next.has(caseId)) {
      next.delete(caseId);
    } else {
      next.add(caseId);
    }
    setExpandedCases(next);
  };

  const toggleSubsection = (caseId: string, subId: string) => {
    const key = `${caseId}-${subId}`;
    const next = new Set(expandedSubsections);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedSubsections(next);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/findings/${id}`, { method: 'DELETE' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Failed to delete finding:', payload);
        return;
      }
      // Only update client state after successful server deletion
      setFindings(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error deleting finding:', error);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<AuditFinding>) => {
    try {
      const result = await updateFinding(id, updates);
      if (result.success) {
        setFindings(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      } else {
        console.error('Failed to save finding update:', result.error);
      }
    } catch (error) {
      console.error('Error saving finding update:', error);
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

  const clearGlobalFilters = () => {
    setSelectedBranch('all');
    setSelectedDepartment('all');
    setRiskFilter([]);
    setStatusFilter([]);
    setSearchQuery('');
    setAuditorSearch('');
  };

  const filteredFindings = findings.filter((finding) => {
    const branchMatch = selectedBranch === 'all' || finding.branchOrDepartment === selectedBranch;
    const deptMatch = selectedDepartment === 'all' || finding.branchOrDepartment === selectedDepartment;
    const riskMatch = riskFilter.length === 0 || riskFilter.includes(finding.riskLevel);
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(finding.status);
    const searchMatch = searchQuery === '' ||
      String(finding.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (finding.title || '').toLowerCase().includes(searchQuery.toLowerCase());

    const auditorMatch = auditorSearch === '' || 
      (finding.teamLeader || '').toLowerCase().includes(auditorSearch.toLowerCase()) ||
      (finding.teamMembers || []).some(m => m.toLowerCase().includes(auditorSearch.toLowerCase()));

    return branchMatch && deptMatch && riskMatch && statusMatch && searchMatch && auditorMatch;
  });

  const hierarchicalData = useMemo(() => {
    if (hierarchy.length === 0) return [];

    const nodesWithFindings = new Map<string, AuditFinding[]>();
    filteredFindings.forEach(f => {
      const list = nodesWithFindings.get(f.hierarchyNodeId) || [];
      list.push(f);
      nodesWithFindings.set(f.hierarchyNodeId, list);
    });

    const level1Nodes = hierarchy.filter(n => n.level === 1);

    return level1Nodes.map(mission => {
      const missionFindings: AuditFinding[] = [];
      const subsections: Record<string, { id: string; title: string; number?: number; findings: AuditFinding[] }> = {};

      // Find all findings that belong to this Level 1 tree
      hierarchy.forEach(node => {
        let isDescendant = false;
        let current: AuditHierarchyNode | undefined = node;
        const visited = new Set<string>();
        while (current && !visited.has(current.id)) {
          visited.add(current.id);
          if (current.id === mission.id) {
            isDescendant = true;
            break;
          }
          current = hierarchy.find(h => h.id === current?.parentId);
        }

        if (isDescendant) {
          const findingsAtNode = nodesWithFindings.get(node.id) || [];
          if (findingsAtNode.length > 0) {
            missionFindings.push(...findingsAtNode);

            if (node.level >= 2) {
              if (!subsections[node.id]) {
                subsections[node.id] = {
                  id: node.id,
                  title: node.title || 'Untitled',
                  number: node.number,
                  findings: [],
                };
              }
              subsections[node.id].findings.push(...findingsAtNode);
            }
          }
        }
      });

      // If the mission itself has direct findings, expose them as a root subsection.
      const missionRootFindings = nodesWithFindings.get(mission.id) || [];
      if (missionRootFindings.length > 0) {
        subsections[mission.id] = {
          id: mission.id,
          title: mission.title || 'Mission Overview',
          number: mission.number,
          findings: missionRootFindings,
        };
      }

      return {
        id: mission.id,
        number: mission.number,
        title: mission.title,
        allFindings: missionFindings,
        subsections: Object.values(subsections).sort((a, b) => {
          if (a.number !== undefined && b.number !== undefined) {
            return a.number - b.number;
          }
          return String(a.title).localeCompare(String(b.title));
        }),
      };
    }).filter(m => m.allFindings.length > 0);
  }, [filteredFindings, hierarchy]);

  const hasActiveFilters = selectedBranch !== 'all' || selectedDepartment !== 'all' || riskFilter.length > 0 || statusFilter.length > 0 || searchQuery !== '' || auditorSearch !== '';

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Mission Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Auditee Mission Control"
        description="Dynamic hierarchical management of audit findings from the live database."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          
          <div className="mb-8 bg-card p-6 rounded-xl border shadow-sm">
            <div className="flex flex-col md:flex-row items-end gap-6">
              <div className="w-full md:flex-1 space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
                  <Building2 className="h-3 w-3" /> Filter by Bank Branch
                </label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="h-11 bg-background">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:flex-1 space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
                  <Briefcase className="h-3 w-3" /> Filter by Department
                </label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="h-11 bg-background">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearGlobalFilters} className="h-11 w-11 text-muted-foreground shrink-0" title="Reset all filters">
                  <FilterX className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-12">
            <div className="flex flex-col items-start gap-4 border-t pt-8">
              <div className="flex w-full flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Mission Oversight</h2>
                  <p className="text-sm text-muted-foreground">
                    Hierarchical findings grouped by Level 1 Missions defined in System Settings.
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
                    placeholder="Search Reference or Title..."
                    className="pl-8 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative flex-1">
                  <ShieldCheck className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Filter by Auditor..."
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

            <div className="space-y-8">
              {hierarchicalData.length > 0 ? (
                hierarchicalData.map((mission) => {
                  const isCaseExpanded = expandedCases.has(mission.id);
                  
                  return (
                    <div key={mission.id} className="space-y-4">
                      {/* Level 1 Header: Mission */}
                      <div 
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-4 rounded-xl border border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer group" 
                        onClick={() => toggleCase(mission.id)}
                      >
                        <div className="flex items-center gap-4">
                          {isCaseExpanded ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-primary" />}
                          <Badge className="h-10 w-14 rounded-lg flex items-center justify-center text-xl font-bold bg-primary text-primary-foreground font-mono">
                            {mission.number}
                          </Badge>
                          <div className="flex flex-col">
                            <h3 className="text-xl font-black tracking-tight text-foreground uppercase">{mission.title}</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Main Mission Taxonomy #{mission.number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <CaseReportDialog 
                            caseNum={mission.number} 
                            caseSummary={mission.title} 
                            findings={mission.allFindings} 
                          />
                        </div>
                      </div>

                      {/* Level 2: Subsections & Findings */}
                      {isCaseExpanded && (
                        <div className="space-y-6 pl-4 border-l-2 border-dashed border-muted ml-7 overflow-hidden animate-in slide-in-from-top-2 duration-200 ease-out">
                          {mission.subsections.map((subGroup) => {
                            const subKey = `${mission.id}-${subGroup.id}`;
                            const isSubExpanded = expandedSubsections.has(subKey);
                            
                            return (
                              <div key={subGroup.id} className="space-y-4">
                                <div 
                                  className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity"
                                  onClick={() => toggleSubsection(mission.id, subGroup.id)}
                                >
                                  {isSubExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                  <Badge variant="secondary" className="px-3 py-0.5 text-xs font-bold font-mono">
                                    {subGroup.number ?? subGroup.id}
                                  </Badge>
                                  <h4 className="text-lg font-bold text-muted-foreground uppercase tracking-tight">
                                    {subGroup.title}
                                  </h4>
                                </div>
                                
                                {/* Level 3: Detailed Finding Cards */}
                                {isSubExpanded && (
                                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pl-7 animate-in fade-in zoom-in-95 duration-200 items-stretch" style={{ gridAutoRows: '1fr' }}>
                                    {subGroup.findings.map(finding => (
                                      <AuditFindingCard
                                        key={finding.id}
                                        finding={finding}
                                        onDelete={handleDelete}
                                        onUpdate={handleUpdate}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-24 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <ListTree className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">No missions found</h3>
                  <p className="text-muted-foreground">Logged findings will automatically appear here grouped by their institutional hierarchy titles.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
