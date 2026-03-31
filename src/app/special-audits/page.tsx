'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Search, 
  FilterX, 
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  History,
  Loader2
} from 'lucide-react';
import type { SpecialAudit } from '@/types';
import { AddEditSpecialAuditDialog } from '@/components/audit/AddEditSpecialAuditDialog';
import { ViewSpecialAuditDialog } from '@/components/audit/ViewSpecialAuditDialog';
import { useToast } from '@/hooks/use-toast';
import { getMonth, getQuarter, getYear, format } from 'date-fns';
import { getSpecialAudits, deleteSpecialAudit, submitSpecialAudit } from '@/app/actions/special-audits';

type SortConfig = {
  key: 'dateCreated' | 'amountInvolved' | 'id';
  direction: 'asc' | 'desc' | null;
};

export default function SpecialAuditsPage() {
  const { toast } = useToast();
  const [audits, setAudits] = useState<SpecialAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

  useEffect(() => {
    async function loadAudits() {
      try {
        const data = await getSpecialAudits();
        setAudits(data as any);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Synchronization Error",
          description: "Could not retrieve special audit history from the live database."
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadAudits();
  }, [toast]);

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

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteSpecialAudit(id);
      if (result.success) {
        setAudits(prev => prev.filter(a => a.id !== id));
        toast({
          title: "Report Deleted",
          description: "Special audit report has been successfully removed from the database.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: "An error occurred while deleting from the server."
      });
    }
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
      
      const searchMatch = searchQuery === '' || 
        audit.shortSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.placementValue.toLowerCase().includes(searchQuery.toLowerCase());

      const monthMatch = filterMonth === 'all' || (getMonth(date) + 1).toString() === filterMonth;
      const quarterMatch = filterQuarter === 'all' || `Q${getQuarter(date)}` === filterQuarter;
      const yearMatch = filterYear === 'all' || getYear(date).toString() === filterYear;

      return searchMatch && monthMatch && quarterMatch && yearMatch;
    });

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

  const handleSubmit = async (formData: Omit<SpecialAudit, 'id' | 'dateCreated'>) => {
    try {
      const result = await submitSpecialAudit(formData);
      if (result.success) {
        toast({ title: "Report Created", description: "New special audit has been logged to the live database." });
        // Hard refresh to show new data
        window.location.reload();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Persistence Failed",
        description: "Could not save the special audit to the database."
      });
    }
  };

  const SortIcon = ({ column }: { column: SortConfig['key'] }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-3 w-3" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Records...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Special Audit Reports"
        description="Formal tracking of specialized internal audit missions and monetary reconciliation from live database."
        backHref="/reports"
      >
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Log Special Audit
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-full space-y-6">
          
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

          {/* Formal Structured Audit Table */}
          <div className="rounded-sm border-2 border-black overflow-hidden shadow-sm bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/80 hover:bg-muted/80 border-b-2 border-black divide-x-2 divide-black">
                  <TableHead className="w-16 text-center font-black text-black uppercase text-xs">S.No</TableHead>
                  <TableHead className="min-w-[200px] font-black text-black uppercase text-xs">Concise explanation</TableHead>
                  <TableHead className="w-32 text-center font-black text-black uppercase text-xs cursor-pointer" onClick={() => requestSort('amountInvolved')}>
                    <div className="flex items-center justify-center">
                      Amount incurred <SortIcon column="amountInvolved" />
                    </div>
                  </TableHead>
                  <TableHead className="w-32 text-center font-black text-black uppercase text-xs">recovered</TableHead>
                  <TableHead className="w-32 text-center font-black text-black uppercase text-xs">pending</TableHead>
                  <TableHead className="min-w-[180px] font-black text-black uppercase text-xs">Responsible individual</TableHead>
                  <TableHead className="min-w-[180px] font-black text-black uppercase text-xs">Action taken disciplinary</TableHead>
                  <TableHead className="min-w-[180px] font-black text-black uppercase text-xs">Gap witnessed</TableHead>
                  <TableHead className="w-[50px] border-l-2 border-black"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y-2 divide-black">
                {filteredAndSortedAudits.length > 0 ? (
                  filteredAndSortedAudits.map((audit, index) => (
                    <TableRow 
                      key={audit.id} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer divide-x-2 divide-black"
                      onClick={() => handleView(audit)}
                    >
                      <TableCell className="text-center font-bold text-black">{index + 1}.</TableCell>
                      <TableCell className="text-black leading-snug py-4 align-top">
                        <div className="space-y-1">
                          <p className="font-bold">{audit.shortSummary}</p>
                          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground tracking-tighter">
                            <span>ID: {audit.id}</span>
                            <span className="flex items-center gap-1"><History className="h-2 w-2" /> {format(new Date(audit.dateCreated), 'dd/MM/yyyy')}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-black align-top py-4">
                        ETB {audit.amountInvolved.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center font-bold text-green-700 align-top py-4">
                        ETB {audit.recovered.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center font-bold text-destructive align-top py-4">
                        ETB {audit.pending.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-black text-xs align-top py-4">
                        <ul className="list-disc pl-4 space-y-1">
                          {audit.individuals.map((person, idx) => (
                            <li key={idx} className="font-medium">
                              {person.name} <span className="text-[10px] text-muted-foreground">({person.position})</span>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="text-black text-xs leading-relaxed align-top py-4">
                        {audit.actionDisciplinary}
                      </TableCell>
                      <TableCell className="text-black text-xs leading-relaxed align-top py-4">
                        {audit.gapWitnessed}
                      </TableCell>
                      <TableCell className="text-center border-l-2 border-black" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleView(audit)}>
                              <Eye className="mr-2 h-4 w-4" /> View Report
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
                    <TableCell colSpan={9} className="h-48 text-center text-muted-foreground bg-muted/5">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-10 w-10 opacity-20" />
                        <p className="font-bold text-black uppercase text-xs">No records found for the selected criteria</p>
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2 h-8 text-[10px] font-bold uppercase border-black">
                          Reset Data Filter
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
