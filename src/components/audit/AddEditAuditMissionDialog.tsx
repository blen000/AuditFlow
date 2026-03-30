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
import type { AuditMissionDefinition } from '@/types';

const formSchema = z.object({
  caseNumber: z.string().min(1, 'Case number is required.'),
  title: z.string().min(3, 'Summary must be at least 3 characters.'),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<AuditMissionDefinition, 'id'>) => void;
  mission: AuditMissionDefinition | null;
};

export function AddEditAuditMissionDialog({ open, onOpenChange, onSubmit, mission }: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { caseNumber: '', title: '' },
  });

  useEffect(() => {
    if (open) {
      if (mission) {
        form.reset({ caseNumber: mission.caseNumber, title: mission.title });
      } else {
        form.reset({ caseNumber: '', title: '' });
      }
    }
  }, [mission, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mission ? 'Edit Mission Title' : 'Register New Mission Title'}</DialogTitle>
          <DialogDescription>Define Level 1 audit mission parameters.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="caseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Number</FormLabel>
                  <FormControl><Input placeholder="e.g., 1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mission Summary / Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Cash Management Audit" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
              <Button type="submit">{mission ? 'Save Changes' : 'Register Title'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
