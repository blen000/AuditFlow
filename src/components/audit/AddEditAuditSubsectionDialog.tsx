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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AuditSubsectionDefinition, AuditMissionDefinition } from '@/types';

const formSchema = z.object({
  missionId: z.string().min(1, 'Please select a parent mission.'),
  number: z.string().min(1, 'Subsection number is required (e.g., 1.1).'),
  title: z.string().min(3, 'Subsection title must be at least 3 characters.'),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<AuditSubsectionDefinition, 'id'>) => void;
  subsection: AuditSubsectionDefinition | null;
  missions: AuditMissionDefinition[];
};

export function AddEditAuditSubsectionDialog({ open, onOpenChange, onSubmit, subsection, missions }: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { missionId: '', number: '', title: '' },
  });

  useEffect(() => {
    if (open) {
      if (subsection) {
        form.reset({ missionId: subsection.missionId, number: subsection.number, title: subsection.title });
      } else {
        form.reset({ missionId: '', number: '', title: '' });
      }
    }
  }, [subsection, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subsection ? 'Edit Subsection Title' : 'Register New Subsection Title'}</DialogTitle>
          <DialogDescription>Define Level 2 functional subsections.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="missionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Mission (Level 1)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent mission" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {missions.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          Case {m.caseNumber}: {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subsection No.</FormLabel>
                  <FormControl><Input placeholder="e.g., 1.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subsection Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Vault Reconciliation" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
              <Button type="submit">{subsection ? 'Save Changes' : 'Register Subsection'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
