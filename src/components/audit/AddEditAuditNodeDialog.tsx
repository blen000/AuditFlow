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
import { useForm, useFieldArray } from 'react-hook-form';
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
import type { AuditHierarchyNode } from '@/types';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Plus, Trash2, Settings2 } from 'lucide-react';

const customFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Field name is required.'),
  type: z.enum(['text', 'number']),
});

const formSchema = z.object({
  number: z.string().min(1, 'Reference number is required.'),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  customFields: z.array(customFieldSchema).optional(),
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
    defaultValues: { number: '', title: '', customFields: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customFields',
  });

  useEffect(() => {
    if (open) {
      if (node) {
        form.reset({ 
          number: node.number, 
          title: node.title, 
          customFields: node.customFields || [] 
        });
      } else {
        const suggestedPrefix = parent ? `${parent.number}.` : '';
        form.reset({ number: suggestedPrefix, title: '', customFields: [] });
      }
    }
  }, [node, parent, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      ...values,
      parentId: parent?.id || null,
      level: parent ? parent.level + 1 : 1,
      customFields: values.customFields
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
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
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ref No.</FormLabel>
                        <FormControl><Input placeholder="e.g., 1.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
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
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                      <Settings2 className="h-4 w-4" />
                      Dynamic Input Fields
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => append({ id: `field-${Date.now()}`, name: '', type: 'text' })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Field
                    </Button>
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground italic">
                    Define custom fields that will appear during logging for this specific hierarchy node.
                  </p>

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/20">
                        <div className="flex-1 space-y-3">
                          <FormField
                            control={form.control}
                            name={`customFields.${index}.name`}
                            render={({ field: nameField }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] font-bold uppercase">Field Label</FormLabel>
                                <FormControl><Input placeholder="e.g., Involved Cash" className="h-8 text-xs" {...nameField} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`customFields.${index}.type`}
                            render={({ field: typeField }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] font-bold uppercase">Data Type</FormLabel>
                                <Select onValueChange={typeField.onChange} value={typeField.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="text">Text / Narrative</SelectItem>
                                    <SelectItem value="number">Numeric Value</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive shrink-0 mt-6" 
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/5">
                        <p className="text-xs text-muted-foreground">No custom fields defined for this node.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 border-t shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
              <Button type="submit">{node ? 'Save Changes' : 'Register Level'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
