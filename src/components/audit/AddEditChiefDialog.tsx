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
import type { Chief } from '@/types';

const formSchema = z.object({
  name: z.string().min(3, 'Chief name must be at least 3 characters.'),
});

type AddEditChiefDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (chief: Omit<Chief, 'id'>) => void;
  chief: Chief | null;
};

export function AddEditChiefDialog({
  open,
  onOpenChange,
  onSubmit,
  chief,
}: AddEditChiefDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (chief) {
        form.reset({
          name: chief.name,
        });
      } else {
        form.reset({ name: '' });
      }
    }
  }, [chief, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{chief ? 'Edit Chief' : 'Add New Chief'}</DialogTitle>
          <DialogDescription>
            {chief
              ? `Update the details for ${chief.name}.`
              : 'Add a new Chief role or office to your organization.'}
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
                  <FormLabel>Chief Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Chief Audit Executive" {...field} />
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
                {chief ? 'Save Changes' : 'Add Chief'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
