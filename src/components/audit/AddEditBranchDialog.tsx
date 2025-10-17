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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import type { Branch } from '@/lib/branches';

const formSchema = z.object({
  name: z.string().min(3, 'Branch name must be at least 3 characters.'),
  district: z.string().min(3, 'District name must be at least 3 characters.'),
});

type AddEditBranchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (branch: Branch) => void;
  branch: Branch | null;
};

export function AddEditBranchDialog({
  open,
  onOpenChange,
  onSubmit,
  branch,
}: AddEditBranchDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      district: '',
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset(branch);
    } else {
      form.reset({ name: '', district: '' });
    }
  }, [branch, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{branch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
          <DialogDescription>
            {branch
              ? `Update the details for ${branch.name}.`
              : 'Add a new branch or department to your organization.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch / Department Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Downtown Main"
                      {...field}
                      disabled={!!branch} // Disable editing name for existing branches to preserve key
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Metropolis North" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                Cancel
              </Button>
              <Button type="submit">
                {branch ? 'Save Changes' : 'Add Branch'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
