'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, UserRound, Trash2, Edit } from 'lucide-react';
import { AddEditChiefDialog } from '@/components/audit/AddEditChiefDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { Chief } from '@/types';
import { initialChiefs } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export default function ChiefsPage() {
  const { toast } = useToast();
  const [chiefs, setChiefs] = useState<Chief[]>(initialChiefs);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingChief, setEditingChief] = useState<Chief | null>(null);

  const handleAddNew = () => {
    setEditingChief(null);
    setDialogOpen(true);
  };

  const handleEdit = (chief: Chief) => {
    setEditingChief(chief);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setChiefs(prev => prev.filter(c => c.id !== id));
    toast({
      title: "Chief removed",
      description: "The chief role has been successfully deleted.",
    });
  };

  const handleSubmit = (chiefData: Omit<Chief, 'id'>) => {
    if (editingChief && editingChief.id) {
      setChiefs(prev => prev.map(c => c.id === editingChief.id ? { ...c, ...chiefData } : c));
      toast({
        title: "Chief updated",
        description: `${chiefData.name} has been updated.`,
      });
    } else {
      const newChief = { ...chiefData, id: `CHIEF-${Date.now()}` };
      setChiefs(prev => [...prev, newChief]);
      toast({
        title: "Chief added",
        description: `${chiefData.name} is now registered.`,
      });
    }
    setEditingChief(null);
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PageHeader
          title="Chiefs Management"
          description="Register and manage organizational Chief roles and offices."
        >
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Chief
          </Button>
        </PageHeader>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Chiefs List</CardTitle>
                </div>
                <UserRound className="h-5 w-5 text-muted-foreground opacity-50" />
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {chiefs.length > 0 ? (
                    chiefs.map((chief) => (
                      <li
                        key={chief.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <span className="font-bold text-foreground">{chief.name}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(chief)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => chief.id && handleDelete(chief.id)}
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
                      No Chiefs registered yet.
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <AddEditChiefDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        chief={editingChief}
      />
    </>
  );
}
