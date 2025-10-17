'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { branches as initialBranches, type Branch } from '@/lib/branches';
import { districts as initialDistricts, type District } from '@/lib/districts';
import { PlusCircle } from 'lucide-react';
import { AddEditBranchDialog } from '@/components/audit/AddEditBranchDialog';
import PageHeader from '@/components/layout/PageHeader';

export default function BranchesPage() {
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
        <PageHeader
          title="Branches & Departments"
          description="View and manage your organization's branches and departments."
        >
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </PageHeader>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
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
        districtList={districts}
      />
    </>
  );
}
