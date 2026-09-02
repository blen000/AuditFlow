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
import type { Role } from '@/types';
import { ShieldAlert, Star } from 'lucide-react';
import { PERMISSION_DEFINITIONS, AUDITEE_VIEW_CHILD_PERMISSIONS } from '@/lib/permissions';

const formSchema = z.object({
  name: z.string().min(2, 'Role name is required.'),
  description: z.string().min(5, 'Description is required.'),
  permissions: z.array(z.string()),
  isSpecial: z.boolean().default(false),
});

type AddEditRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (role: Omit<Role, 'id'>) => Promise<boolean>;
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
        // If the role holds the Auditee View parent toggle, surface every child
        // as checked too (the parent implies them at runtime).
        const stored = new Set(role.permissions);
        if (stored.has('auditee_view_access')) {
          AUDITEE_VIEW_CHILD_PERMISSIONS.forEach((c) => stored.add(c));
        }
        form.reset({
          name: role.name,
          description: role.description,
          permissions: Array.from(stored),
          isSpecial: role.isSpecial || false,
        });
      } else {
        form.reset({ name: '', description: '', permissions: [], isSpecial: false });
      }
    }
  }, [role, form, open]);

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    const success = await onSubmit(values as any);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-5xl h-[95vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none gap-0">
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
            <ScrollArea className="flex-1 px-2 md:px-8 py-2">
              <div className="space-y-8">
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
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-primary">
                    Granular Permissions
                  </FormLabel>
                  <div className="space-y-4">
                    {Array.from(new Set(PERMISSION_DEFINITIONS.map((p) => p.group))).map((group) => {
                      const isAuditeeViewGroup = group === 'Core Actions → Auditee View';
                      return (
                      <div
                        key={group}
                        className={
                          isAuditeeViewGroup
                            ? 'rounded-xl border-2 border-primary/50 bg-primary/[0.04] p-4 shadow-sm ring-1 ring-primary/10'
                            : undefined
                        }
                      >
                        <div
                          className={
                            isAuditeeViewGroup
                              ? 'mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary'
                              : 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2'
                          }
                        >
                          {isAuditeeViewGroup && <ShieldAlert className="h-4 w-4" />}
                          {group}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                          {PERMISSION_DEFINITIONS.filter((p) => p.group === group).map((p) => (
                            <FormField
                              key={p.key}
                              control={form.control}
                              name="permissions"
                              render={({ field }) => {
                                const current = field.value || [];
                                const isParent = 'isParent' in p && p.isParent;
                                // The Auditee View parent toggle reads as checked when
                                // every child action is granted, and ticking it grants
                                // them all; unticking removes the parent + all children.
                                const isChecked = isParent
                                  ? current.includes(p.key) &&
                                    AUDITEE_VIEW_CHILD_PERMISSIONS.every((c) => current.includes(c))
                                  : current.includes(p.key);

                                const handleChange = (checked: boolean | 'indeterminate') => {
                                  if (isParent) {
                                    if (checked) {
                                      field.onChange(
                                        Array.from(new Set([...current, p.key, ...AUDITEE_VIEW_CHILD_PERMISSIONS]))
                                      );
                                    } else {
                                      const strip = new Set<string>([p.key, ...AUDITEE_VIEW_CHILD_PERMISSIONS]);
                                      field.onChange(current.filter((v) => !strip.has(v)));
                                    }
                                    return;
                                  }
                                  checked
                                    ? field.onChange(Array.from(new Set([...current, p.key])))
                                    : field.onChange(current.filter((value) => value !== p.key));
                                };

                                return (
                                  <FormItem
                                    className={
                                      'flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 transition-colors cursor-pointer' +
                                      (isParent
                                        ? ' border-primary bg-primary/10 hover:bg-primary/15 sm:col-span-2 md:col-span-3 shadow-sm'
                                        : ' hover:bg-muted/30')
                                    }
                                  >
                                    <FormControl>
                                      <Checkbox checked={isChecked} onCheckedChange={handleChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel
                                        className={
                                          'cursor-pointer ' +
                                          (isParent ? 'text-sm font-black text-primary' : 'text-sm font-bold')
                                        }
                                      >
                                        {p.label}
                                      </FormLabel>
                                      <p className="text-xs text-muted-foreground">{p.description}</p>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      );
                    })}
                  </div>
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
