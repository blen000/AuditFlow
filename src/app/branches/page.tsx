'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MapPin, Trash2, Edit } from 'lucide-react';
import { AddEditBranchDialog } from '@/components/audit/AddEditBranchDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { Branch, District } from '@/types';
import { initialBranches, initialDistricts } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export default function BranchesPage() {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [districts] = useState<District[]>(initialDistricts);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const handleAddNew = () => {
    setEditingBranch(null);
    setDialogOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setBranches(prev => prev.filter(b => b.id !== id));
    toast({
      title: "Branch removed",
      description: "The branch has been successfully deleted.",
    });
  };

  const handleSubmit = (branchData: Omit<Branch, 'id'>) => {
    if (editingBranch && editingBranch.id) {
      setBranches(prev => prev.map(b => b.id === editingBranch.id ? { ...b, ...branchData } : b));
      toast({
        title: "Branch updated",
        description: `${branchData.name} has been updated.`,
      });
    } else {
      const newBranch = { ...branchData, id: `BR-${Date.now()}` };
      setBranches(prev => [...prev, newBranch]);
      toast({
        title: "Branch added",
        description: `${branchData.name} is now registered.`,
      });
    }
    setEditingBranch(null);
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PageHeader
          title="Branches Management"
          description="View and manage your organization's physical bank branches."
          backHref="/settings"
        >
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Branch
          </Button>
        </PageHeader>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Branch List</CardTitle>
                </div>
                <MapPin className="h-5 w-5 text-muted-foreground opacity-50" />
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {branches.length > 0 ? (
                    branches.map((branch) => (
                      <li
                        key={branch.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <span className="font-bold text-foreground">{branch.name}</span>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            {branch.district}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(branch)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => branch.id && handleDelete(branch.id)}
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
                      No branches registered yet.
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <AddEditBranchDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        branch={editingBranch}
        districtList={districts}
      />
    </>
  );
}
