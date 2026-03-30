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
import type { AuditHierarchyNode } from '@/types';
import { Badge } from '../ui/badge';

const formSchema = z.object({
  number: z.string().min(1, 'Reference number is required.'),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<AuditHierarchyNode, 'id'>) => void;
  node: AuditHierarchyNode | null;
  parent: AuditHierarchyNode | null;
};

export function AddEditAuditNodeDialog({ open, onOpenChange, onSubmit, node, parent }: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: '', title: '' },
  });

  useEffect(() => {
    if (open) {
      if (node) {
        form.reset({ number: node.number, title: node.title });
      } else {
        // Suggest next number if parent exists
        const suggestedPrefix = parent ? `${parent.number}.` : '';
        form.reset({ number: suggestedPrefix, title: '' });
      }
    }
  }, [node, parent, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      ...values,
      parentId: parent?.id || null,
      level: parent ? parent.level + 1 : 1
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {node ? 'Edit Hierarchy Level' : parent ? `Add Sub-level to ${parent.number}` : 'Add Level 1 Mission'}
          </DialogTitle>
          <DialogDescription>
            {parent ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs">Parent:</span>
                <Badge variant="outline" className="text-[10px]">{parent.number} - {parent.title}</Badge>
              </div>
            ) : 'Establishing a new top-level mission summary.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hierarchical Reference Number</FormLabel>
                  <FormControl><Input placeholder="e.g., 1.1 or 1.1.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level Descriptor / Title</FormLabel>
                  <FormControl><Input placeholder="Functional area description..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
              <Button type="submit">{node ? 'Save Changes' : 'Register Level'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
