'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, UserPlus, Mail, Phone, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { AddEditAuditorDialog } from '@/components/audit/AddEditAuditorDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { Auditor } from '@/types';
import { initialAuditors } from '@/lib/mock-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function AuditorsPage() {
  const { toast } = useToast();
  const [auditors, setAuditors] = useState<Auditor[]>(initialAuditors);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingAuditor, setEditingAuditor] = useState<Auditor | null>(null);

  const handleAddNew = () => {
    setEditingAuditor(null);
    setDialogOpen(true);
  };

  const handleEdit = (auditor: Auditor) => {
    setEditingAuditor(auditor);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setAuditors(prev => prev.filter(a => a.id !== id));
    toast({
      title: "Auditor removed",
      description: "The auditor has been successfully deleted from the system.",
    });
  };

  const handleSubmit = (auditorData: Omit<Auditor, 'id'>) => {
    // Check for duplicate email
    const isDuplicate = auditors.some(a => 
      a.email.toLowerCase() === auditorData.email.toLowerCase() && 
      (!editingAuditor || a.id !== editingAuditor.id)
    );

    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: "An auditor with this email address is already registered.",
      });
      return;
    }

    if (editingAuditor && editingAuditor.id) {
      setAuditors(prev => prev.map(a => a.id === editingAuditor.id ? { ...a, ...auditorData } : a));
      toast({
        title: "Auditor updated",
        description: `${auditorData.fullName}'s profile has been updated.`,
      });
    } else {
      const newAuditor = { ...auditorData, id: `AUD-${Date.now()}` };
      setAuditors(prev => [...prev, newAuditor]);
      toast({
        title: "Registration successful",
        description: `${auditorData.fullName} is now available for assignments.`,
      });
    }
    setEditingAuditor(null);
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PageHeader
          title="Auditor Management"
          description="Register and manage authorized audit personnel."
          backHref="/settings"
        >
          <Button onClick={handleAddNew}>
            <UserPlus className="mr-2 h-4 w-4" />
            Register Auditor
          </Button>
        </PageHeader>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {auditors.map((auditor) => (
                <Card key={auditor.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold">{auditor.fullName}</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{auditor.id}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(auditor)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => auditor.id && handleDelete(auditor.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="truncate">{auditor.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>{auditor.phone}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                className="h-full min-h-[140px] border-dashed flex flex-col gap-2 hover:bg-muted/50"
                onClick={handleAddNew}
              >
                <PlusCircle className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Register New Auditor</span>
              </Button>
            </div>
          </div>
        </main>
      </div>
      <AddEditAuditorDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        auditor={editingAuditor}
      />
    </>
  );
}
