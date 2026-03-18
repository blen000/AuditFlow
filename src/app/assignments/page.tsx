'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Users, Calendar, Activity, CheckCircle2, Search, UserCheck, ShieldCheck } from 'lucide-react';
import { initialFindings } from '@/lib/mock-data';
import type { AuditFinding } from '@/types';

export default function AssignmentsPage() {
  const auditCycle = ['Planning', 'Execution', 'Reporting', 'Follow-up'];
  const auditors = ['Abebe Shirega', 'Fikre Tollossa', 'Ze'];
  
  const [selectedAuditor, setSelectedAuditor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFindings = useMemo(() => {
    return initialFindings.filter(finding => {
      const auditorMatch = selectedAuditor === 'all' || 
                           finding.assignedAuditor === selectedAuditor ||
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
    const assignedCount = initialFindings.filter(f => f.assignedAuditor === selectedAuditor).length;
    
    return { ledCount, memberCount, assignedCount };
  }, [selectedAuditor]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Audit Assignments" 
        description="Official roles, team structures, and KPI tracking." 
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          
          {/* Filtering Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-card p-6 rounded-xl border shadow-sm">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Filter by Auditor</label>
              <Select onValueChange={setSelectedAuditor} defaultValue="all">
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Auditor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Auditors</SelectItem>
                  {auditors.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-[2] space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Search Audits</label>
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

          {/* Auditor Performance Insights */}
          {auditorStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-primary">Leader Roles</p>
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
                      <p className="text-xs font-bold uppercase text-muted-foreground">Member Roles</p>
                      <h4 className="text-3xl font-bold">{auditorStats.memberCount}</h4>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50/50 border-orange-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-orange-600">Primary Assigned</p>
                      <h4 className="text-3xl font-bold">{auditorStats.assignedCount}</h4>
                    </div>
                    <UserCheck className="h-8 w-8 text-orange-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Memo Style Container */}
          <Card className="border-t-4 border-t-primary shadow-xl overflow-hidden">
            <CardHeader className="text-center pb-6 bg-muted/30">
              <CardTitle className="text-3xl font-bold uppercase tracking-widest text-primary">Internal Audit Department</CardTitle>
              <CardDescription className="font-semibold text-lg italic mt-2">Assignment Schedule & Role Tracking Memo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              {/* Memo Meta Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium border-b pb-4">
                <div className="space-y-2">
                  <p><span className="text-muted-foreground uppercase text-xs block">To:</span> {selectedAuditor === 'all' ? 'Assigned Audit Staff' : selectedAuditor}</p>
                  <p><span className="text-muted-foreground uppercase text-xs block">From:</span> Audit Management Office</p>
                </div>
                <div className="space-y-2 md:text-right">
                  <p><span className="text-muted-foreground uppercase text-xs block">Date:</span> {new Date().toLocaleDateString()}</p>
                  <p><span className="text-muted-foreground uppercase text-xs block">Subject:</span> Role Finalization & Cycle Tracking</p>
                </div>
              </div>

              {/* Assignment Table */}
              <div className="space-y-4">
                <div className="rounded-xl border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted hover:bg-muted">
                        <TableHead className="font-bold uppercase text-xs">ID & Title</TableHead>
                        <TableHead className="font-bold uppercase text-xs">Primary Assigned</TableHead>
                        <TableHead className="font-bold uppercase text-xs">Team Structure</TableHead>
                        <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                        <TableHead className="font-bold uppercase text-xs">Due Date</TableHead>
                        <TableHead className="font-bold uppercase text-xs">Team Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFindings.map((finding) => (
                        <TableRow key={finding.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-[10px] text-muted-foreground">{finding.id}</span>
                              <span className="font-bold text-sm">{finding.title}</span>
                              <span className="text-[10px] italic text-muted-foreground">{finding.branchOrDepartment}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{finding.assignedAuditor}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-[10px]">
                                <Badge variant="secondary" className="h-4 px-1 text-[8px] bg-orange-100 text-orange-700">LEADER</Badge>
                                <span>{finding.teamLeader}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Badge variant="outline" className="h-4 px-1 text-[8px]">MEMBERS</Badge>
                                <span className="truncate max-w-[120px]">{finding.teamMembers.join(', ')}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{finding.status}</Badge>
                          </TableCell>
                          <TableCell className="text-[10px] font-mono">
                            {finding.mitigationDueDate ? new Date(finding.mitigationDueDate as any).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {selectedAuditor !== 'all' && (
                              <Badge className={finding.teamLeader === selectedAuditor ? "bg-primary" : "bg-muted text-muted-foreground"}>
                                {finding.teamLeader === selectedAuditor ? 'Leader' : 'Member'}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="mt-8 p-6 bg-muted/20 border-l-4 border-primary rounded-r-lg">
                <p className="text-sm leading-relaxed text-foreground">
                  <strong>Managerial Note:</strong> Staff listed in this schedule are officially authorized to perform audit procedures in the specified areas. Performance metrics (TAT) will be tracked against report finalization dates.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
