'use client';

import { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { initialFindings, initialAuditors } from '@/lib/mock-data';
import type { Auditor } from '@/types';
import { differenceInDays } from 'date-fns';

export default function AssignmentsPage() {
  const [mounted, setMounted] = useState(false);
  const [auditors] = useState<Auditor[]>(initialAuditors);
  const [selectedAuditor, setSelectedAuditor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredFindings = useMemo(() => {
    return initialFindings.filter(finding => {
      const auditorMatch = selectedAuditor === 'all' || 
                           finding.teamLeader === selectedAuditor ||
                           finding.teamMembers.includes(selectedAuditor);
      
      const searchMatch = searchQuery === '' || 
                          finding.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          finding.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          finding.branchOrDepartment.toLowerCase().includes(searchQuery.toLowerCase());
      
      return auditorMatch && searchMatch;
    });
  }, [selectedAuditor, searchQuery]);

  const auditorStats = useMemo(() => {
    if (selectedAuditor === 'all') return null;
    
    const ledCount = initialFindings.filter(f => f.teamLeader === selectedAuditor).length;
    const memberCount = initialFindings.filter(f => f.teamMembers.includes(selectedAuditor)).length;
    
    return { ledCount, memberCount };
  }, [selectedAuditor]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Audit Assignments" 
        description="Official roles, team structures, and KPI performance tracking."
        backHref="/reports"
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          
          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-card p-6 rounded-xl border shadow-sm">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Filter by Auditor</label>
              <Select onValueChange={setSelectedAuditor} defaultValue="all">
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Auditor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Auditors</SelectItem>
                  {auditors.map(a => <SelectItem key={a.id} value={a.fullName}>{a.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-[2] space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Search Audit Cases</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by Case ID, Title, or Branch..." 
                  className="pl-9 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {auditorStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-primary">Team Leader Roles</p>
                      <h4 className="text-3xl font-bold">{auditorStats.ledCount}</h4>
                    </div>
                    <ShieldCheck className="h-8 w-8 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">Team Member Roles</p>
                      <h4 className="text-3xl font-bold">{auditorStats.memberCount}</h4>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-t-4 border-t-primary shadow-xl overflow-hidden">
            <CardHeader className="text-center pb-6 bg-muted/30">
              <CardTitle className="text-2xl font-bold uppercase tracking-widest text-primary">Internal Audit Department</CardTitle>
              <CardDescription className="font-semibold text-lg italic mt-2">Assignment Schedule & Performance Tracking Memo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium border-b pb-4">
                <div className="space-y-2">
                  <p><span className="text-muted-foreground uppercase text-[10px] block">To:</span> {selectedAuditor === 'all' ? 'Assigned Audit Staff' : selectedAuditor}</p>
                  <p><span className="text-muted-foreground uppercase text-[10px] block">From:</span> Audit Management Office</p>
                </div>
                <div className="space-y-2 md:text-right">
                  <p>
                    <span className="text-muted-foreground uppercase text-[10px] block">Date:</span> 
                    {mounted ? new Date().toLocaleDateString() : '--/--/----'}
                  </p>
                  <p><span className="text-muted-foreground uppercase text-[10px] block">Subject:</span> Role Finalization & Cycle Efficiency Tracking</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-12 text-center font-bold text-xs uppercase">S.No</TableHead>
                        <TableHead className="font-bold text-xs uppercase">Name of Auditor</TableHead>
                        <TableHead className="font-bold text-xs uppercase">Auditable Area</TableHead>
                        <TableHead className="font-bold text-xs uppercase">Role</TableHead>
                        <TableHead className="font-bold text-xs uppercase">Date Assigned</TableHead>
                        <TableHead className="font-bold text-xs uppercase">Finalization Date</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-center">Time Taken</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-center">TAT</TableHead>
                        <TableHead className="font-bold text-xs uppercase">Deviation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFindings.length > 0 ? (
                        filteredFindings.map((finding, index) => {
                          const isLeader = finding.teamLeader === (selectedAuditor === 'all' ? finding.teamLeader : selectedAuditor);
                          
                          const assignedDate = finding.assignedDate ? new Date(finding.assignedDate as any) : null;
                          const finalizedDate = finding.finalizationDate ? new Date(finding.finalizationDate as any) : null;
                          const standardTAT = finding.tatDays || 0;

                          const timeTakenDays = (finalizedDate && assignedDate) 
                            ? differenceInDays(finalizedDate, assignedDate)
                            : null;

                          const deviation = (timeTakenDays !== null && standardTAT > 0) 
                            ? timeTakenDays - standardTAT
                            : null;
                          
                          return (
                            <TableRow key={finding.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="text-center font-mono text-xs">{index + 1}</TableCell>
                              <TableCell className="font-medium text-sm">
                                {selectedAuditor === 'all' ? finding.teamLeader : selectedAuditor}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm">{finding.branchOrDepartment}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Ref: {finding.id}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={isLeader ? "default" : "secondary"} className="text-[10px] h-5">
                                  {isLeader ? 'Leader' : 'Member'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-[10px] font-mono whitespace-nowrap">
                                {mounted && assignedDate ? assignedDate.toLocaleDateString() : (mounted ? 'Not Assigned' : '...')}
                              </TableCell>
                              <TableCell className="text-[10px] font-mono whitespace-nowrap">
                                {mounted && finalizedDate ? finalizedDate.toLocaleDateString() : 'In Progress'}
                              </TableCell>
                              <TableCell className="text-center text-xs font-semibold">
                                {timeTakenDays !== null ? `${timeTakenDays} Days` : '--'}
                              </TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">
                                {standardTAT > 0 ? `${standardTAT} Days` : '--'}
                              </TableCell>
                              <TableCell>
                                {deviation !== null ? (
                                  deviation > 0 ? (
                                    <div className="flex items-center gap-1 text-[10px] text-destructive font-bold italic">
                                      <AlertCircle className="h-3 w-3" />
                                      +{deviation} Days Over
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                                      {deviation < 0 ? `${Math.abs(deviation)} Days Early` : 'On Time'}
                                    </div>
                                  )
                                ) : (
                                  <div className="flex items-center gap-1 text-[10px] text-orange-500 italic">
                                    <Clock className="h-3 w-3" />
                                    Active Cycle
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                            No assignments found for the selected criteria.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="mt-8 p-6 bg-muted/20 border-l-4 border-primary rounded-r-lg">
                <p className="text-sm leading-relaxed text-foreground">
                  <strong>Standard Operating Note:</strong> Turnaround Time (TAT) metrics are computed from the date of field-work assignment to the final report submission. All deviations must be justified in writing to the Audit Management Office within 24 hours of cycle expiry.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
