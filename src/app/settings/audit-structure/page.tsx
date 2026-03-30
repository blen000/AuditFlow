'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Layers, Trash2, Edit, ListTree } from 'lucide-react';
import { initialAuditMissions, initialAuditSubsections } from '@/lib/mock-data';
import type { AuditMissionDefinition, AuditSubsectionDefinition } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddEditAuditMissionDialog } from '@/components/audit/AddEditAuditMissionDialog';
import { AddEditAuditSubsectionDialog } from '@/components/audit/AddEditAuditSubsectionDialog';
import { Badge } from '@/components/ui/badge';

export default function AuditStructurePage() {
  const { toast } = useToast();
  const [missions, setMissions] = useState<AuditMissionDefinition[]>(initialAuditMissions);
  const [subsections, setSubsections] = useState<AuditSubsectionDefinition[]>(initialAuditSubsections);

  // Mission Dialog State
  const [isMissionDialogOpen, setIsMissionDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<AuditMissionDefinition | null>(null);

  // Subsection Dialog State
  const [isSubsectionDialogOpen, setIsSubsectionDialogOpen] = useState(false);
  const [editingSubsection, setEditingSubsection] = useState<AuditSubsectionDefinition | null>(null);

  const handleAddMission = () => {
    setEditingMission(null);
    setIsMissionDialogOpen(true);
  };

  const handleEditMission = (mission: AuditMissionDefinition) => {
    setEditingMission(mission);
    setIsMissionDialogOpen(true);
  };

  const handleDeleteMission = (id: string) => {
    setMissions(prev => prev.filter(m => m.id !== id));
    setSubsections(prev => prev.filter(s => s.missionId !== id));
    toast({ title: 'Mission Deleted', description: 'The audit mission and its subsections have been removed.' });
  };

  const handleMissionSubmit = (data: Omit<AuditMissionDefinition, 'id'>) => {
    // Check for duplicate Case Number
    const isDuplicate = missions.some(m => 
      m.caseNumber === data.caseNumber && (!editingMission || m.id !== editingMission.id)
    );

    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: `Case Number ${data.caseNumber} is already assigned to another mission.`,
      });
      return;
    }

    if (editingMission) {
      setMissions(prev => prev.map(m => m.id === editingMission.id ? { ...m, ...data } : m));
      toast({ title: 'Mission Updated' });
    } else {
      const newMission = { ...data, id: `MISS-${Date.now()}` };
      setMissions(prev => [...prev, newMission]);
      toast({ title: 'Mission Registered' });
    }
    setIsMissionDialogOpen(false);
  };

  const handleAddSubsection = () => {
    setEditingSubsection(null);
    setIsSubsectionDialogOpen(true);
  };

  const handleEditSubsection = (sub: AuditSubsectionDefinition) => {
    setEditingSubsection(sub);
    setIsSubsectionDialogOpen(true);
  };

  const handleDeleteSubsection = (id: string) => {
    setSubsections(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Subsection Deleted' });
  };

  const handleSubsectionSubmit = (data: Omit<AuditSubsectionDefinition, 'id'>) => {
    // Check for duplicate subsection number within the SAME parent mission
    const isDuplicate = subsections.some(s => 
      s.missionId === data.missionId && 
      s.number === data.number && 
      (!editingSubsection || s.id !== editingSubsection.id)
    );

    if (isDuplicate) {
      const parent = missions.find(m => m.id === data.missionId);
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: `Subsection No. ${data.number} is already registered under ${parent?.title || 'this mission'}.`,
      });
      return;
    }

    if (editingSubsection) {
      setSubsections(prev => prev.map(s => s.id === editingSubsection.id ? { ...s, ...data } : s));
      toast({ title: 'Subsection Updated' });
    } else {
      const newSub = { ...data, id: `SUB-${Date.now()}` };
      setSubsections(prev => [...prev, newSub]);
      toast({ title: 'Subsection Registered' });
    }
    setIsSubsectionDialogOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Hierarchy & Titles" 
        description="Predefine Level 1 Mission Summaries and Level 2 Subsection Titles."
        backHref="/settings"
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          
          {/* Level 1: Missions */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Main Audit Missions (Level 1)
                </CardTitle>
                <CardDescription>Register Case Numbers and their primary summaries.</CardDescription>
              </div>
              <Button onClick={handleAddMission} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Mission
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Case No.</TableHead>
                    <TableHead>Mission Summary / Title</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missions.length > 0 ? (
                    missions.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-bold">{m.caseNumber}</TableCell>
                        <TableCell>{m.title}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditMission(m)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteMission(m.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No missions defined.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Level 2: Subsections */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ListTree className="h-5 w-5 text-primary" />
                  Subsection Titles (Level 2)
                </CardTitle>
                <CardDescription>Define functional subsections linked to Level 1 missions.</CardDescription>
              </div>
              <Button onClick={handleAddSubsection} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Subsection
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Parent Mission</TableHead>
                    <TableHead className="w-24">No.</TableHead>
                    <TableHead>Subsection Title</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subsections.length > 0 ? (
                    subsections.map((s) => {
                      const parent = missions.find(m => m.id === s.missionId);
                      return (
                        <TableRow key={s.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              Case {parent?.caseNumber || '?'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold">{s.number}</TableCell>
                          <TableCell className="font-medium">{s.title}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSubsection(s)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteSubsection(s.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No subsections defined.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      <AddEditAuditMissionDialog 
        open={isMissionDialogOpen} 
        onOpenChange={setIsMissionDialogOpen}
        onSubmit={handleMissionSubmit}
        mission={editingMission}
      />

      <AddEditAuditSubsectionDialog
        open={isSubsectionDialogOpen}
        onOpenChange={setIsSubsectionDialogOpen}
        onSubmit={handleSubsectionSubmit}
        subsection={editingSubsection}
        missions={missions}
      />
    </div>
  );
}
