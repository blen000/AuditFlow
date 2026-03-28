'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  PlusCircle, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ShieldAlert, 
  BadgeInfo, 
  Search, 
  FilterX, 
  User, 
  Calendar,
  Eye,
  History,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { initialSpecialAudits } from '@/lib/mock-data';
import type { SpecialAudit } from '@/types';
import { AddEditSpecialAuditDialog } from '@/components/audit/AddEditSpecialAuditDialog';
import { ViewSpecialAuditDialog } from '@/components/audit/ViewSpecialAuditDialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getMonth, getQuarter, getYear, format } from 'date-fns';

type SortConfig = {
  key: 'dateCreated' | 'amountInvolved' | 'id';
  direction: 'asc' | 'desc' | null;
};

export default function SpecialAuditsPage() {
  const { toast } = useToast();
  const [audits, setAudits] = useState<SpecialAudit[]>(initialSpecialAudits);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<SpecialAudit | null>(null);
  const [viewingAudit, setViewingAudit] = useState<SpecialAudit | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterQuarter, setFilterQuarter] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dateCreated', direction: 'desc' });

  const handleAddNew = () => {
    setEditingAudit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (audit: SpecialAudit) => {
    setEditingAudit(audit);
    setIsDialogOpen(true);
  };

  const handleView = (audit: SpecialAudit) => {
    setViewingAudit(audit);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setAudits(prev => prev.filter(a => a.id !== id));
    toast({
      title: "Report Deleted",
      description: "Special audit report has been successfully removed.",
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterMonth('all');
    setFilterQuarter('all');
    setFilterYear('all');
  };

  const requestSort = (key: SortConfig['key']) => {
    let direction: SortConfig['direction'] = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedAudits = useMemo(() => {
    let result = audits.filter(audit => {
      const date = new Date(audit.dateCreated);
      
      // 1. Search Query
      const searchMatch = searchQuery === '' || 
        audit.shortSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.placementValue.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Month Filter
      const monthMatch = filterMonth === 'all' || (getMonth(date) + 1).toString() === filterMonth;

      // 3. Quarter Filter
      const quarterMatch = filterQuarter === 'all' || `Q${getQuarter(date)}` === filterQuarter;

      // 4. Year Filter
      const yearMatch = filterYear === 'all' || getYear(date).toString() === filterYear;

      return searchMatch && monthMatch && quarterMatch && yearMatch;
    });

    // Sorting
    if (sortConfig.direction) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [audits, searchQuery, filterMonth, filterQuarter, filterYear, sortConfig]);

  const handleSubmit = (formData: Omit<SpecialAudit, 'id' | 'dateCreated'>) => {
    if (editingAudit) {
      setAudits(prev => prev.map(a => a.id === editingAudit.id ? { ...a, ...formData } : a));
      toast({ title: "Report Updated", description: "Audit details have been modified." });
    } else {
      const newAudit: SpecialAudit = {
        ...formData,
        id: `SA-${Date.now()}`,
        dateCreated: new Date().toISOString(),
      };
      setAudits(prev => [newAudit, ...prev]);
      toast({ title: "Report Created", description: "New special audit has been logged." });
    }
  };

  const SortIcon = ({ column }: { column: SortConfig['key'] }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-3 w-3" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Special Audit Reports"
        description="Pertinent findings included in specialized internal audit missions."
        backHref="/reports"
      >
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Log Special Audit
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          
          {/* Advanced Search & Date Filters */}
          <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Search className="h-4 w-4" />
                Filter Missions
              </h3>
              {(searchQuery || filterMonth !== 'all' || filterQuarter !== 'all' || filterYear !== 'all') && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs font-semibold text-muted-foreground">
                  <FilterX className="mr-2 h-3 w-3" />
                  Clear Filters
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Search Audit Summary or ID</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by mission title, ID, or location..." 
                    className="pl-9 h-10 bg-muted/20 border-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Year</label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="h-10 border-none bg-muted/20">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Quarter</label>
                <Select value={filterQuarter} onValueChange={setFilterQuarter}>
                  <SelectTrigger className="h-10 border-none bg-muted/20">
                    <SelectValue placeholder="All Quarters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Quarters</SelectItem>
                    <SelectItem value="Q1">Q1 (Jan - Mar)</SelectItem>
                    <SelectItem value="Q2">Q2 (Apr - Jun)</SelectItem>
                    <SelectItem value="Q3">Q3 (Jul - Sep)</SelectItem>
                    <SelectItem value="Q4">Q4 (Oct - Dec)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Month</label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="h-10 border-none bg-muted/20">
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {format(new Date(2024, i, 1), 'MMMM')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Structured Audit Table */}
          <Card className="border shadow-lg overflow-hidden border-t-4 border-t-primary">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead 
                        className="w-[250px] font-bold uppercase text-[10px] tracking-widest py-4 cursor-pointer"
                        onClick={() => requestSort('id')}
                      >
                        <div className="flex items-center">
                          Report Summary <SortIcon column="id" />
                        </div>
                      </TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Placement</TableHead>
                      <TableHead 
                        className="font-bold uppercase text-[10px] tracking-widest py-4 cursor-pointer"
                        onClick={() => requestSort('amountInvolved')}
                      >
                        <div className="flex items-center">
                          Monetary Value <SortIcon column="amountInvolved" />
                        </div>
                      </TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Involved Individuals</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Action & Analysis</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedAudits.length > 0 ? (
                      filteredAndSortedAudits.map((audit) => (
                        <TableRow 
                          key={audit.id} 
                          className="hover:bg-muted/20 transition-colors cursor-pointer group border-b"
                          onClick={() => handleView(audit)}
                        >
                          <TableCell className="align-top py-6">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                                {audit.shortSummary}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-muted-foreground uppercase font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                                  ID: {audit.id}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <History className="h-3 w-3" /> 
                                  {format(new Date(audit.dateCreated), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top py-6">
                            <div className="flex flex-col gap-1">
                              <Badge variant="secondary" className="w-fit text-[10px] h-5 font-bold uppercase tracking-tight">{audit.placement}</Badge>
                              <span className="font-semibold text-xs text-muted-foreground">{audit.placementValue}</span>
                            </div>
                          </TableCell>
                          <TableCell className="align-top py-6">
                            <div className="space-y-1 text-[11px] bg-muted/10 p-2 rounded-lg border border-dashed">
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground uppercase text-[9px] font-bold">Involved:</span>
                                <span className="font-black text-foreground">${audit.amountInvolved.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground uppercase text-[9px] font-bold">Recovered:</span>
                                <span className="font-black text-green-600">${audit.recovered.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between gap-4 border-t border-muted pt-1 mt-1">
                                <span className="text-muted-foreground uppercase text-[9px] font-bold">Pending:</span>
                                <span className="font-black text-destructive">${audit.pending.toLocaleString()}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top py-6">
                            <div className="space-y-2">
                              {audit.individuals.map((person, idx) => (
                                <div 
                                  key={idx} 
                                  className="text-xs p-2.5 rounded-lg border bg-background shadow-sm space-y-1"
                                >
                                  <div className="flex items-center justify-between font-bold text-foreground">
                                    <span>{person.name}</span>
                                    <span className="text-[9px] font-normal text-muted-foreground px-1.5 py-0.5 bg-muted rounded">({person.sex})</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-tight leading-none">
                                    {person.position} • {person.age}y • {person.tenure}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="align-top py-6">
                            <div className="space-y-4">
                              <div className="flex gap-2">
                                <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-black uppercase text-destructive tracking-widest">Disciplinary Action</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{audit.actionDisciplinary}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <BadgeInfo className="h-4 w-4 text-accent shrink-0" />
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-black uppercase text-accent tracking-widest">Corrective Action</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{audit.correctiveActionTaken}</p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top py-6" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted-foreground/10">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => handleView(audit)}>
                                  <Eye className="mr-2 h-4 w-4" /> View Report
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(audit)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(audit.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                              <Search className="h-6 w-6 opacity-30" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-foreground">No reports found</p>
                              <p className="text-sm">Adjust your filters or search terms to find specialized audit records.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                              Reset all filters
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AddEditSpecialAuditDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        audit={editingAudit}
      />

      <ViewSpecialAuditDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        audit={viewingAudit}
      />
    </div>
  );
}
