'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Role, Permission } from '@/types';
import { ShieldAlert, Star } from 'lucide-react';

const permissionOptions: { value: Permission; label: string; description: string }[] = [
  { value: 'audit_read', label: 'Read Audits', description: 'Can view audit findings and case details.' },
  { value: 'audit_write', label: 'Manage Audits', description: 'Can create, edit, and delete audit findings.' },
  { value: 'reports_read', label: 'Access Reports', description: 'Can view high-level reports and KPI metrics.' },
  { value: 'settings_manage', label: 'System Settings', description: 'Can configure organizational structure and users.' },
];

const formSchema = z.object({
  name: z.string().min(2, 'Role name is required.'),
  description: z.string().min(5, 'Description is required.'),
  permissions: z.array(z.string()).min(1, 'Select at least one permission.'),
  isSpecial: z.boolean().default(false),
});

type AddEditRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (role: Omit<Role, 'id'>) => void;
  role: Role | null;
};

export function AddEditRoleDialog({
  open,
  onOpenChange,
  onSubmit,
  role,
}: AddEditRoleDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
      isSpecial: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (role) {
        form.reset({
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isSpecial: role.isSpecial || false,
        });
      } else {
        form.reset({ name: '', description: '', permissions: [], isSpecial: false });
      }
    }
  }, [role, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values as any);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background">
          <DialogTitle>
            {role ? 'Edit Organizational Role' : 'Create New Role'}
          </DialogTitle>
          <DialogDescription>
            Define the functional boundaries and system access levels.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="flex-1 flex flex-col min-h-0"
          >
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-50/30 border-amber-100">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                      Special (Executive) Role
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Mark this as an executive role for special onboarding.
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="isSpecial"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Compliance Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Explain the purpose of this role..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-primary">Assigned System Capabilities</FormLabel>
                  <div className="grid gap-4">
                    {permissionOptions.map((option) => (
                      <FormField
                        key={option.value}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(option.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, option.value])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== option.value
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-bold cursor-pointer">
                                {option.label}
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 border-t bg-muted/10 shrink-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit">
                {role ? 'Save Role Changes' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
