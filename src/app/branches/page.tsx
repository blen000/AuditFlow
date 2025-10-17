'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { branches as initialBranches, type Branch } from '@/lib/branches';
import { PlusCircle } from 'lucide-react';
import { AddEditBranchDialog } from '@/components/audit/AddEditBranchDialog';

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
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

  const handleSubmit = (branchData: Branch) => {
    if (editingBranch) {
      // Update existing branch
      setBranches(
        branches.map((b) =>
          b.name === editingBranch.name ? { ...b, ...branchData } : b
        )
      );
    } else {
      // Add new branch
      setBranches([...branches, branchData]);
    }
    setEditingBranch(null);
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Branches & Departments
                </h2>
                <p className="text-muted-foreground">
                  View and manage your organization's branches and departments.
                </p>
              </div>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Branch/Department List</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {branches.map((branch) => (
                    <li
                      key={branch.name}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <span className="font-medium">{branch.name}</span>
                        <p className="text-sm text-muted-foreground">
                          {branch.district}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(branch)}
                      >
                        Edit
                      </Button>
                    </li>
                  ))}
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
      />
    </>
  );
}
