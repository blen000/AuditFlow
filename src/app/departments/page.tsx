'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Building2, Trash2, Edit } from 'lucide-react';
import { AddEditDepartmentDialog } from '@/components/audit/AddEditDepartmentDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { Department } from '@/types';
import { initialDepartments } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const handleAddNew = () => {
    setEditingDepartment(null);
    setDialogOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    toast({
      title: "Department removed",
      description: "The department has been successfully deleted.",
    });
  };

  const handleSubmit = (departmentData: Omit<Department, 'id'>) => {
    if (editingDepartment && editingDepartment.id) {
      setDepartments(prev => prev.map(d => d.id === editingDepartment.id ? { ...d, ...departmentData } : d));
      toast({
        title: "Department updated",
        description: `${departmentData.name} has been updated.`,
      });
    } else {
      const newDepartment = { ...departmentData, id: `DEPT-${Date.now()}` };
      setDepartments(prev => [...prev, newDepartment]);
      toast({
        title: "Department added",
        description: `${departmentData.name} is now registered.`,
      });
    }
    setEditingDepartment(null);
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PageHeader
          title="Departments Management"
          description="Register and manage organizational headquarters and support departments."
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
                      No departments registered yet.
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
