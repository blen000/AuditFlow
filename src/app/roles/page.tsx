'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  PlusCircle, 
  MoreHorizontal, 
  Trash2, 
  CheckCircle, 
  Info,
  Lock,
  Pencil,
  Star,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Role, Permission } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddEditRoleDialog } from '@/components/audit/AddEditRoleDialog';
import { getRoles, createRole, updateRole, deleteRole } from '@/app/actions/users';

const permissionLabels: Record<string, { label: string, color: string }> = {
  audit_read: { label: 'Read Audits', color: 'bg-blue-100 text-blue-800' },
  audit_write: { label: 'Manage Audits', color: 'bg-purple-100 text-purple-800' },
  reports_read: { label: 'Access Reports', color: 'bg-green-100 text-green-800' },
  settings_manage: { label: 'System Settings', color: 'bg-orange-100 text-orange-800' },
};

export default function RoleManagementPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await getRoles();
        setRoles(data as any);
      } catch (error) {
        console.error('Error loading roles:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRoles();
  }, []);

  const handleAddNew = () => {
    setEditingRole(null);
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (roles.find(r => r.id === id)?.name === 'Admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "The primary administrator role cannot be deleted." });
      return;
    }
    try {
      const result = await deleteRole(id);
      if (result.success) {
        setRoles(prev => prev.filter(r => r.id !== id));
        toast({ title: "Role Removed", description: "The organizational role has been successfully deleted." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove role." });
    }
  };

  const handleSubmit = async (roleData: Omit<Role, 'id'>) => {
    try {
      if (editingRole) {
        const result = await updateRole(editingRole.id, roleData);
        if (result.success) {
          setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...roleData } : r));
          toast({ title: "Role Updated", description: `${roleData.name} permissions have been updated.` });
        }
      } else {
        const result = await createRole(roleData);
        if (result.success) {
          // Re-fetch roles to get the ID
          const data = await getRoles();
          setRoles(data as any);
          toast({ title: "Role Created", description: `${roleData.name} is now available for user assignment.` });
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save role." });
    }
    setEditingRole(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Retrieving Access Profiles...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Role Management" 
        description="Define and configure system permission profiles in the live database."
        backHref="/settings"
      >
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          
          <div className="grid grid-cols-1 gap-6">
            {roles.length > 0 ? (
              roles.map((role) => (
                <Card key={role.id} className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  {role.isSpecial && (
                    <div className="absolute top-0 right-0 h-16 w-16">
                      <div className="absolute transform rotate-45 bg-amber-500 text-amber-950 text-[8px] font-bold py-1 px-10 right-[-35px] top-[15px] shadow-sm text-center uppercase tracking-tighter">
                        Special
                      </div>
                    </div>
                  )}
                  <CardHeader className="flex flex-row items-start justify-between pb-2 bg-muted/10 border-b">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-bold">{role.name}</CardTitle>
                        {role.name === 'Admin' && <Lock className="h-4 w-4 text-primary opacity-50" />}
                        {role.isSpecial && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 gap-1 h-5 py-0">
                            <Star className="h-2.5 w-2.5 fill-amber-800" /> Executive
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{role.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(role)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit Role
                        </DropdownMenuItem>
                        {role.name !== 'Admin' && (
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(role.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        Assigned System Capabilities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((perm) => (
                          <Badge 
                            key={perm} 
                            variant="outline" 
                            className={`flex items-center gap-1.5 py-1 px-2.5 font-semibold text-xs border-none ${permissionLabels[perm]?.color || 'bg-gray-100'}`}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {permissionLabels[perm]?.label || perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold">No Roles Defined</h3>
                <p className="text-muted-foreground">Click "Create Role" to establish your organizational access hierarchy.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AddEditRoleDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        role={editingRole}
      />
    </div>
  );
}
