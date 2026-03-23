'use client';

import { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MessageSquare, Calendar, Link as LinkIcon, History, FilterX } from 'lucide-react';
import { initialFindings } from '@/lib/mock-data';
import type { AuditFinding, AuditTypeCategory } from '@/types';
import { format } from 'date-fns';
import { AgreementBadge } from '@/components/audit/AgreementBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const auditTypes: AuditTypeCategory[] = ['Branch', 'District', 'Division', 'Department', 'Chief', 'CEO', 'Board'];

export default function CommunicationsPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredFindings = useMemo(() => {
    return initialFindings.filter(finding => {
      const typeMatch = selectedType === 'all' || finding.auditType === selectedType;
      const searchMatch = searchQuery === '' || 
                          finding.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          finding.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          finding.branchOrDepartment.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && searchMatch;
    });
  }, [selectedType, searchQuery]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Audit report Communications" 
        description="Track formal interactions, responses, and rectification agreements across all organizational levels."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          
          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-card p-6 rounded-xl border shadow-sm items-end">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Hierarchy Level</label>
              <Select onValueChange={setSelectedType} value={selectedType}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Audit Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audit Types</SelectItem>
                  {auditTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-[2] space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Search Reference or Entity</label>
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
            { (selectedType !== 'all' || searchQuery) && (
              <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => { setSelectedType('all'); setSearchQuery(''); }}>
                <FilterX className="h-5 w-5" />
              </Button>
            )}
          </div>

          <Card className="border-t-4 border-t-primary shadow-xl overflow-hidden">
            <CardHeader className="border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold uppercase tracking-tight">Official Communication Log</CardTitle>
                  <CardDescription>Consolidated registry of audit reporting and response timelines.</CardDescription>
                </div>
                <MessageSquare className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16 text-center font-bold text-[10px] uppercase tracking-widest">S.No</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Audit Types</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Reference</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date of Report</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date Communicated</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Time set for rectification</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Response Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFindings.length > 0 ? (
                      filteredFindings.map((finding, index) => (
                        <TableRow key={finding.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold">
                              {finding.auditType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{finding.branchOrDepartment}</span>
                              <span className="text-[10px] text-muted-foreground uppercase font-mono">Ref: {finding.id}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {mounted && finding.assignedDate ? format(finding.assignedDate as Date, 'MMM d, yyyy') : '--'}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-muted-foreground">
                            {mounted && finding.dateCommunicated ? format(finding.dateCommunicated as Date, 'MMM d, yyyy') : 'Pending Dispatch'}
                          </TableCell>
                          <TableCell>
                            {mounted && finding.mitigationDueDate ? (
                              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                <Calendar className="h-3 w-3 text-accent" />
                                {format(finding.mitigationDueDate as Date, 'MMM d, yyyy')}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Not established</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <AgreementBadge agreement={finding.auditeeAgreement} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <History className="h-8 w-8 opacity-20" />
                            <p className="font-medium">No communication records found for the selected criteria.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-accent/5 border-l-4 border-accent rounded-r-lg">
            <div className="flex gap-3">
              <LinkIcon className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed text-foreground">
                <strong>Tracking Protocol:</strong> Communication timelines are monitored against established Service Level Agreements (SLAs). Rectification dates are binding commitments once agreed upon by the auditee.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
