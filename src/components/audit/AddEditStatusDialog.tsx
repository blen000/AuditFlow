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
import type { StatusData } from '@/lib/statuses';

const formSchema = z.object({
  name: z.string().min(3, 'Status name must be at least 3 characters.'),
});

type AddEditStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (status: StatusData) => void;
  status: StatusData | null;
};

export function AddEditStatusDialog({
  open,
  onOpenChange,
  onSubmit,
  status,
}: AddEditStatusDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (status) {
      form.reset(status);
    } else {
      form.reset({ name: '' });
    }
  }, [status, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{status ? 'Edit Status' : 'Add New Status'}</DialogTitle>
          <DialogDescription>
            {status
              ? `Update the details for ${status.name}.`
              : 'Add a new status to your organization.'}
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
                  <FormLabel>Status Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Awaiting Review"
                      {...field}
                    />
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
                {status ? 'Save Changes' : 'Add Status'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
