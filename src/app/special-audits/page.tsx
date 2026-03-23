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
  Briefcase, 
  Clock, 
  Hash, 
  Users 
} from 'lucide-react';
import { initialSpecialAudits } from '@/lib/mock-data';
import type { SpecialAudit } from '@/types';
import { AddEditSpecialAuditDialog } from '@/components/audit/AddEditSpecialAuditDialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SpecialAuditsPage() {
  const { toast } = useToast();
  const [audits, setAudits] = useState<SpecialAudit[]>(initialSpecialAudits);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<SpecialAudit | null>(null);

  // Filter States
  const [filterName, setFilterName] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterTenure, setFilterTenure] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterSex, setFilterSex] = useState<string>('all');

  const handleAddNew = () => {
    setEditingAudit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (audit: SpecialAudit) => {
    setEditingAudit(audit);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setAudits(prev => prev.filter(a => a.id !== id));
    toast({
      title: "Report Deleted",
      description: "Special audit report has been successfully removed.",
    });
  };

  const clearFilters = () => {
    setFilterName('');
    setFilterPosition('');
    setFilterTenure('');
    setFilterAge('');
    setFilterSex('all');
  };

  const filteredAudits = useMemo(() => {
    return audits.filter(audit => {
      // If no filters are applied, show everything
      if (!filterName && !filterPosition && !filterTenure && !filterAge && filterSex === 'all') {
        return true;
      }

      // Check if ANY individual in the audit matches the criteria
      return audit.individuals.some(person => {
        const nameMatch = person.name.toLowerCase().includes(filterName.toLowerCase());
        const positionMatch = person.position.toLowerCase().includes(filterPosition.toLowerCase());
        const tenureMatch = person.tenure.toLowerCase().includes(filterTenure.toLowerCase());
        const ageMatch = filterAge === '' || person.age.toString() === filterAge;
        const sexMatch = filterSex === 'all' || person.sex === filterSex;

        return nameMatch && positionMatch && tenureMatch && ageMatch && sexMatch;
      });
    });
  }, [audits, filterName, filterPosition, filterTenure, filterAge, filterSex]);

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
          
          {/* Filters Bar */}
          <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Search className="h-4 w-4" />
                Filter by Involved Individuals
              </h3>
              {(filterName || filterPosition || filterTenure || filterAge || filterSex !== 'all') && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs font-semibold text-muted-foreground">
                  <FilterX className="mr-2 h-3 w-3" />
                  Clear Filters
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Individual's Name</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search name..." 
                    className="pl-9 h-9 text-sm"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Position</label>
                <div className="relative">
                  <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search position..." 
                    className="pl-9 h-9 text-sm"
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Tenure</label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g., 5 years" 
                    className="pl-9 h-9 text-sm"
                    value={filterTenure}
                    onChange={(e) => setFilterTenure(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Age</label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number"
                    placeholder="Exact age" 
                    className="pl-9 h-9 text-sm"
                    value={filterAge}
                    onChange={(e) => setFilterAge(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Sex</label>
                <Select value={filterSex} onValueChange={setFilterSex}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Card className="border-t-4 border-t-primary shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[200px] font-bold uppercase text-[10px] tracking-widest">Report Summary</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">Placement</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">Monetary Value</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">Involved Individuals</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">Action & Analysis</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudits.length > 0 ? (
                    filteredAudits.map((audit) => (
                      <TableRow key={audit.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm text-primary">{audit.shortSummary}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">ID: {audit.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <Badge variant="secondary" className="w-fit text-[10px] h-5 mb-1">{audit.placement}</Badge>
                            <span className="font-semibold text-xs">{audit.placementValue}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <p className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Involved:</span>
                              <span className="font-bold">${audit.amountInvolved.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Recovered:</span>
                              <span className="font-bold text-green-600">${audit.recovered.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between gap-4 border-t pt-1">
                              <span className="text-muted-foreground">Pending:</span>
                              <span className="font-bold text-destructive">${audit.pending.toLocaleString()}</span>
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {audit.individuals.map((person, idx) => {
                              // Highlight if matches filters
                              const matchesName = !filterName || person.name.toLowerCase().includes(filterName.toLowerCase());
                              const matchesPos = !filterPosition || person.position.toLowerCase().includes(filterPosition.toLowerCase());
                              const matchesTenure = !filterTenure || person.tenure.toLowerCase().includes(filterTenure.toLowerCase());
                              const matchesAge = !filterAge || person.age.toString() === filterAge;
                              const matchesSex = filterSex === 'all' || person.sex === filterSex;
                              const isMatch = matchesName && matchesPos && matchesTenure && matchesAge && matchesSex && (filterName || filterPosition || filterTenure || filterAge || filterSex !== 'all');

                              return (
                                <div 
                                  key={idx} 
                                  className={cn(
                                    "text-xs p-2 rounded-md border",
                                    isMatch ? "bg-accent/10 border-accent/50 ring-1 ring-accent/20" : "bg-muted/40 border-muted-foreground/10"
                                  )}
                                >
                                  <p className="font-bold flex items-center justify-between">
                                    {person.name} 
                                    <span className="text-[10px] font-normal text-muted-foreground">({person.sex})</span>
                                  </p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{person.position} • {person.age}y • {person.tenure}</p>
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-destructive">Disciplinary Action</p>
                                <p className="text-xs line-clamp-2">{audit.actionDisciplinary}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <BadgeInfo className="h-4 w-4 text-orange-500 shrink-0" />
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-orange-500">Corrective Action</p>
                                <p className="text-xs line-clamp-2">{audit.correctiveActionTaken}</p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(audit)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(audit.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="h-8 w-8 opacity-20" />
                          <p>No special audit reports match your criteria.</p>
                          <Button variant="link" onClick={clearFilters}>Reset all filters</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
    </div>
  );
}
