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
import type { Role } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddEditRoleDialog } from '@/components/audit/AddEditRoleDialog';
import { getRoles, createRole, updateRole, deleteRole } from '@/app/actions/users';
import { getPermissionLabel } from '@/lib/permissions';

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
        toast({ variant: "destructive", title: "Sync Error", description: "Could not retrieve role registry from database." });
      } finally {
        setIsLoading(false);
      }
    }
    loadRoles();
  }, [toast]);

  const handleAddNew = () => {
    setEditingRole(null);
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const roleToDelete = roles.find(r => r.id === id);
    if (roleToDelete?.name === 'Admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "The primary administrator role is locked and cannot be deleted." });
      return;
    }
    
    try {
      const result = await deleteRole(id);
      if (result.success) {
        setRoles(prev => prev.filter(r => r.id !== id));
        toast({ title: "Role Removed", description: "The organizational access profile has been deleted." });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: "Ensure no users are currently assigned to this role before deletion." });
    }
  };

  const handleSubmit = async (roleData: Omit<Role, 'id'>): Promise<boolean> => {
    try {
      if (editingRole) {
        const result = await updateRole(editingRole.id, roleData);
        if (result.success) {
          setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...roleData } : r));
          toast({ title: "Profile Updated", description: `${roleData.name} capabilities have been modified in the database.` });
          return true;
        } else {
          toast({ variant: "destructive", title: "Update Failed", description: result.error || "Failed to update role." });
          return false;
        }
      } else {
        const result = await createRole(roleData);
        if (result.success) {
          const data = await getRoles();
          setRoles(data as any);
          toast({ title: "Role Defined", description: `New profile "${roleData.name}" is now active for personnel assignment.` });
          return true;
        } else {
          toast({ variant: "destructive", title: "Creation Failed", description: result.error || "Failed to create role." });
          return false;
        }
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({ variant: "destructive", title: "Persistence Error", description: "An error occurred while communicating with the database." });
      return false;
    } finally {
      setEditingRole(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Access Profiles...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Role & Permission Management" 
        description="Establish standardized access levels and functional boundaries in the live database."
        backHref="/settings"
      >
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Define New Role
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          
          <div className="grid grid-cols-1 gap-6">
            {roles.length > 0 ? (
              roles.map((role) => (
                <Card key={role.id} className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-primary/20">
                  {role.isSpecial && (
                    <div className="absolute top-0 right-0 h-16 w-16">
                      <div className="absolute transform rotate-45 bg-amber-500 text-amber-950 text-[8px] font-bold py-1 px-10 right-[-35px] top-[15px] shadow-sm text-center uppercase tracking-tighter">
                        Special
                      </div>
                    </div>
                  )}
                  <CardHeader className="flex flex-row items-start justify-between pb-2 bg-muted/5 border-b">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-black text-primary tracking-tight">{role.name}</CardTitle>
                        {role.name === 'Admin' && <Lock className="h-4 w-4 text-primary opacity-50" />}
                        {role.isSpecial && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 gap-1 h-5 py-0 font-bold uppercase text-[9px]">
                            <Star className="h-2.5 w-2.5 fill-amber-800" /> Executive
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs font-medium leading-relaxed max-w-2xl">{role.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleEdit(role)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit Permissions
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
                        Authorized System Capabilities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((perm) => (
                          <Badge 
                            key={perm} 
                            variant="outline" 
                            className={`flex items-center gap-1.5 py-1 px-3 font-bold text-[10px] border-none shadow-sm uppercase tracking-tighter bg-gray-100`}
                          >
                            <CheckCircle className="h-3 w-3" />
                            {getPermissionLabel(perm)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-muted/5">
                <ShieldCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
                <h3 className="text-xl font-bold">No Roles Found</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Establish your organizational access hierarchy by defining the first functional role.</p>
                <Button onClick={handleAddNew} className="mt-6">
                  <PlusCircle className="mr-2 h-4 w-4" /> Define Initial Role
                </Button>
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
