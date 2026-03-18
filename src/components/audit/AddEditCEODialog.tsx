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
import type { CEO } from '@/types';

const formSchema = z.object({
  name: z.string().min(3, 'CEO name must be at least 3 characters.'),
});

type AddEditCEODialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (ceo: Omit<CEO, 'id'>) => void;
  ceo: CEO | null;
};

export function AddEditCEODialog({
  open,
  onOpenChange,
  onSubmit,
  ceo,
}: AddEditCEODialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (ceo) {
        form.reset({
          name: ceo.name,
        });
      } else {
        form.reset({ name: '' });
      }
    }
  }, [ceo, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{ceo ? 'Edit CEO' : 'Add New CEO'}</DialogTitle>
          <DialogDescription>
            {ceo
              ? `Update the details for ${ceo.name}.`
              : 'Add a new CEO office or position to your organization.'}
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
                  <FormLabel>CEO Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Group CEO" {...field} />
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
                {ceo ? 'Save Changes' : 'Add CEO'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
