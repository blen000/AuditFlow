'use client';

import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Users, Calendar, Activity, CheckCircle2 } from 'lucide-react';

export default function AssignmentsPage() {
  const auditCycle = ['Planning', 'Execution', 'Reporting', 'Follow-up'];
  
  const assignments = [
    {
      area: 'Branch Operations - North',
      role: 'Leader',
      assignedTo: 'Abebe Shirega',
      dateAssigned: '2024-01-10',
      finalization: '2024-02-15',
      timeTaken: '36 days',
      tat: '30 days',
      deviation: 'Delayed due to unexpected system outage at branch.'
    },
    {
      area: 'District Management - South',
      role: 'Member',
      assignedTo: 'Fikre Tollossa',
      dateAssigned: '2024-01-15',
      finalization: '2024-02-10',
      timeTaken: '26 days',
      tat: '30 days',
      deviation: 'None'
    },
    {
      area: 'Head Office - CEO Unit',
      role: 'Member',
      assignedTo: 'Ze',
      dateAssigned: '2024-02-01',
      finalization: '2024-02-28',
      timeTaken: '27 days',
      tat: '25 days',
      deviation: 'Extensive documentation review required.'
    },
    {
      area: 'Department of Chief Information Officer',
      role: 'Leader',
      assignedTo: 'Abebe Shirega',
      dateAssigned: '2024-02-15',
      finalization: 'In Progress',
      timeTaken: 'Ongoing',
      tat: '20 days',
      deviation: 'None'
    },
    {
      area: 'Board Audit Committee Review',
      role: 'Member',
      assignedTo: 'Fikre Tollossa',
      dateAssigned: '2024-03-01',
      finalization: 'Pending',
      timeTaken: 'Scheduled',
      tat: '15 days',
      deviation: 'None'
    }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Audit Assignments" 
        description="Official auditor roles, assignment areas, and performance tracking." 
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Memo Style Container */}
          <Card className="border-t-4 border-t-primary shadow-xl overflow-hidden">
            <CardHeader className="text-center pb-6 bg-muted/30">
              <div className="flex justify-center mb-4">
                <FileText className="h-16 w-16 text-primary opacity-20" />
              </div>
              <CardTitle className="text-3xl font-bold uppercase tracking-widest text-primary">Internal Audit Department</CardTitle>
              <CardDescription className="font-semibold text-lg italic mt-2">Official Assignment & KPI Tracking Memo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              {/* Memo Meta Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium border-b pb-4">
                <div className="space-y-2">
                  <p><span className="text-muted-foreground uppercase text-xs block">To:</span> Assigned Audit Staff Members</p>
                  <p><span className="text-muted-foreground uppercase text-xs block">From:</span> Internal Audit Management Office</p>
                </div>
                <div className="space-y-2 md:text-right">
                  <p><span className="text-muted-foreground uppercase text-xs block">Date:</span> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p><span className="text-muted-foreground uppercase text-xs block">Subject:</span> Commencement of Audit Assignments & KPI Baseline</p>
                </div>
              </div>

              {/* Top Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                {/* Team Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-bold uppercase text-sm tracking-tight">Audit Team Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs font-bold text-primary uppercase mb-1">Team Leader</p>
                      <p className="font-bold text-lg">Abebe Shirega</p>
                      <p className="text-xs text-muted-foreground italic mt-1 leading-relaxed">Responsible for specifying audit types, resource allocation, and specific assignments.</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Team Members</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Fikre Tollossa
                        </li>
                        <li className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Ze
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Audit Scope */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <h3 className="font-bold uppercase text-sm tracking-tight">Scope & Levels</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Branch', 'District', 'Department', 'Chief', 'CEO', 'Board'].map(scope => (
                      <div key={scope} className="flex items-center gap-2 p-3 bg-muted/20 rounded-md border">
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">{scope}</Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground italic px-1">
                    Coverage includes all administrative and operational levels as defined in the master plan.
                  </p>
                </div>

                {/* Audit Cycle */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="font-bold uppercase text-sm tracking-tight">Standard Audit Cycle</h3>
                  </div>
                  <div className="relative border-l-2 border-primary/20 ml-3 space-y-6 py-2">
                    {auditCycle.map((step, idx) => (
                      <div key={step} className="ml-6 relative">
                        <div className="absolute w-4 h-4 bg-primary rounded-full -left-[33px] border-4 border-background" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Phase 0{idx + 1}</span>
                        <h4 className="text-sm font-bold text-foreground leading-tight">{step}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Assignment Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xl text-primary">Assignment Schedule & KPI Tracking</h3>
                  <Badge variant="outline" className="font-mono text-xs">CONFIDENTIAL</Badge>
                </div>
                <div className="rounded-xl border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted hover:bg-muted">
                        <TableHead className="font-bold uppercase text-xs">Auditable Area</TableHead>
                        <TableHead className="font-bold uppercase text-xs">Assignment & Role</TableHead>
                        <TableHead className="font-bold uppercase text-xs">Assigned</TableHead>
                        <TableHead className="font-bold uppercase text-xs">Finalization</TableHead>
                        <TableHead className="font-bold uppercase text-xs text-center">Time Taken</TableHead>
                        <TableHead className="font-bold uppercase text-xs text-center">TAT</TableHead>
                        <TableHead className="font-bold uppercase text-xs">Deviation Tracking</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-bold text-sm text-foreground">{item.area}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-semibold">{item.assignedTo}</span>
                              <Badge 
                                variant={item.role === 'Leader' ? 'default' : 'outline'} 
                                className={`w-fit text-[9px] h-4 uppercase px-1.5 ${item.role === 'Leader' ? 'bg-primary' : ''}`}
                              >
                                {item.role}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium">{item.dateAssigned}</TableCell>
                          <TableCell className="text-xs">
                            {item.finalization === 'Pending' || item.finalization === 'In Progress' ? (
                              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">{item.finalization}</Badge>
                            ) : (
                              item.finalization
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs font-mono">{item.timeTaken}</TableCell>
                          <TableCell className="text-center font-bold text-xs text-primary">{item.tat}</TableCell>
                          <TableCell className="text-xs text-muted-foreground italic max-w-[180px]">
                            {item.deviation}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="mt-8 p-6 bg-muted/20 border-l-4 border-primary rounded-r-lg">
                <p className="text-sm leading-relaxed text-foreground">
                  <strong>Managerial Note:</strong> Staff are officially directed to commence assignments immediately. Performance will be measured against the defined TAT. Any significant deviation must be reported to the Team Leader, <strong>Abebe Shirega</strong>, within 24 hours.
                </p>
                <div className="mt-4 flex justify-end">
                  <div className="text-center">
                    <div className="w-32 h-1 border-b-2 border-muted-foreground mb-1 mx-auto" />
                    <p className="text-xs font-bold uppercase">Internal Audit Management</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
