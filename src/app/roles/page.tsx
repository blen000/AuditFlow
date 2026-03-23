'use client';

import { useState } from 'react';
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
  Pencil
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { initialRoles } from '@/lib/mock-data';
import type { Role, Permission } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddEditRoleDialog } from '@/components/audit/AddEditRoleDialog';

const permissionLabels: Record<string, { label: string, color: string }> = {
  audit_read: { label: 'Read Audits', color: 'bg-blue-100 text-blue-800' },
  audit_write: { label: 'Manage Audits', color: 'bg-purple-100 text-purple-800' },
  reports_read: { label: 'Access Reports', color: 'bg-green-100 text-green-800' },
  settings_manage: { label: 'System Settings', color: 'bg-orange-100 text-orange-800' },
};

export default function RoleManagementPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleAddNew = () => {
    setEditingRole(null);
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (id === 'ROL-1') {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "The primary administrator role cannot be deleted.",
      });
      return;
    }
    setRoles(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Role Removed",
      description: "The organizational role has been successfully deleted.",
    });
  };

  const handleSubmit = (roleData: Omit<Role, 'id'>) => {
    if (editingRole) {
      setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...roleData } : r));
      toast({
        title: "Role Updated",
        description: `${roleData.name} permissions have been updated.`,
      });
    } else {
      const newRole = { ...roleData, id: `ROL-${Date.now()}` };
      setRoles(prev => [...prev, newRole]);
      toast({
        title: "Role Created",
        description: `${roleData.name} is now available for user assignment.`,
      });
    }
    setEditingRole(null);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Role Management" 
        description="Define and configure system permission profiles."
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
                <Card key={role.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between pb-2 bg-muted/10 border-b">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-bold">{role.name}</CardTitle>
                        {role.name === 'Admin' && <Lock className="h-4 w-4 text-primary opacity-50" />}
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
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(role.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                        </DropdownMenuItem>
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

          <div className="p-6 bg-muted/20 border-l-4 border-primary rounded-r-lg">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed text-foreground">
                <strong>Access Control Policy:</strong> System roles define the functional boundaries for users. Changes to a role's permissions will immediately affect all users assigned to that role. Use the <strong>User Management</strong> page to associate these roles with individual personnel.
              </p>
            </div>
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
