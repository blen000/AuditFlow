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
import type { Department } from '@/types';

const formSchema = z.object({
  name: z.string().min(3, 'Department name must be at least 3 characters.'),
});

type AddEditDepartmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (department: Omit<Department, 'id'>) => void;
  department: Department | null;
};

export function AddEditDepartmentDialog({
  open,
  onOpenChange,
  onSubmit,
  department,
}: AddEditDepartmentDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (department) {
        form.reset({
          name: department.name,
        });
      } else {
        form.reset({ name: '' });
      }
    }
  }, [department, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{department ? 'Edit Department' : 'Add New Department'}</DialogTitle>
          <DialogDescription>
            {department
              ? `Update the details for ${department.name}.`
              : 'Add a new headquarters or support department to your organization.'}
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
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Risk Management" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit">
                {department ? 'Save Changes' : 'Add Department'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
