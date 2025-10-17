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
import type { District } from '@/lib/districts';

const formSchema = z.object({
  name: z.string().min(3, 'District name must be at least 3 characters.'),
});

type AddEditDistrictDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (district: District) => void;
  district: District | null;
};

export function AddEditDistrictDialog({
  open,
  onOpenChange,
  onSubmit,
  district,
}: AddEditDistrictDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (district) {
      form.reset(district);
    } else {
      form.reset({ name: '' });
    }
  }, [district, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{district ? 'Edit District' : 'Add New District'}</DialogTitle>
          <DialogDescription>
            {district
              ? `Update the details for ${district.name}.`
              : 'Add a new district to your organization.'}
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
                  <FormLabel>District Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Metropolis North"
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
                {district ? 'Save Changes' : 'Add District'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
