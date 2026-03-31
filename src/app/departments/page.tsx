'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Building2, Trash2, Edit, Loader2 } from 'lucide-react';
import { AddEditDepartmentDialog } from '@/components/audit/AddEditDepartmentDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { Department } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/app/actions/settings';

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDepartments();
        setDepartments(data as any);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Sync Error' });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const handleAddNew = () => {
    setEditingDepartment(null);
    setDialogOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
      toast({ title: "Department removed" });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  const handleSubmit = async (departmentData: Omit<Department, 'id'>) => {
    try {
      if (editingDepartment && editingDepartment.id) {
        await updateDepartment(editingDepartment.id, departmentData);
        toast({ title: "Department updated" });
      } else {
        await createDepartment(departmentData);
        toast({ title: "Department added" });
      }
      const freshData = await getDepartments();
      setDepartments(freshData as any);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save failed' });
    }
    setEditingDepartment(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PageHeader
          title="Departments Management"
          description="Register and manage organizational headquarters and support departments in the live database."
          backHref="/settings"
        >
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        </PageHeader>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Departments List</CardTitle>
                </div>
                <Building2 className="h-5 w-5 text-muted-foreground opacity-50" />
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {departments.length > 0 ? (
                    departments.map((department) => (
                      <li
                        key={department.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <span className="font-bold text-foreground">{department.name}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(department)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => department.id && handleDelete(department.id)}
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
                      No departments registered in database.
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <AddEditDepartmentDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        department={editingDepartment}
      />
    </>
  );
}
