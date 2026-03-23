'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, UserCog, Trash2, Edit } from 'lucide-react';
import { AddEditCEODialog } from '@/components/audit/AddEditCEODialog';
import PageHeader from '@/components/layout/PageHeader';
import type { CEO } from '@/types';
import { initialCEOs } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export default function CEOsPage() {
  const { toast } = useToast();
  const [ceos, setCEOs] = useState<CEO[]>(initialCEOs);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingCEO, setEditingCEO] = useState<CEO | null>(null);

  const handleAddNew = () => {
    setEditingCEO(null);
    setDialogOpen(true);
  };

  const handleEdit = (ceo: CEO) => {
    setEditingCEO(ceo);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCEOs(prev => prev.filter(c => c.id !== id));
    toast({
      title: "CEO removed",
      description: "The CEO office has been successfully deleted.",
    });
  };

  const handleSubmit = (ceoData: Omit<CEO, 'id'>) => {
    if (editingCEO && editingCEO.id) {
      setCEOs(prev => prev.map(c => c.id === editingCEO.id ? { ...c, ...ceoData } : c));
      toast({
        title: "CEO updated",
        description: `${ceoData.name} has been updated.`,
      });
    } else {
      const newCEO = { ...ceoData, id: `CEO-${Date.now()}` };
      setCEOs(prev => [...prev, newCEO]);
      toast({
        title: "CEO added",
        description: `${ceoData.name} is now registered.`,
      });
    }
    setEditingCEO(null);
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PageHeader
          title="CEOs Management"
          description="Register and manage organizational CEO offices."
          backHref="/settings"
        >
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add CEO
          </Button>
        </PageHeader>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>CEOs List</CardTitle>
                </div>
                <UserCog className="h-5 w-5 text-muted-foreground opacity-50" />
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {ceos.length > 0 ? (
                    ceos.map((ceo) => (
                      <li
                        key={ceo.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <span className="font-bold text-foreground">{ceo.name}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(ceo)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => ceo.id && handleDelete(ceo.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    ))
                  ) : (
                    <li className="p-8 text-center text-muted-foreground">
                      No CEOs registered yet.
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <AddEditCEODialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        ceo={editingCEO}
      />
    </>
  );
}
