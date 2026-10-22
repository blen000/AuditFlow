'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import * as z from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { AuditHierarchyNode } from '@/types';
import { Badge } from '../ui/badge';
import { ChevronDown, ChevronRight, Plus, Settings2, Trash2 } from 'lucide-react';
import { parseTitleList, suggestNextNumber } from '@/lib/hierarchy';

const customFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Field name is required.'),
  type: z.enum(['text', 'number', 'string']),
});

const formSchema = z.object({
  number: z.string().optional(),
  title: z.string().trim().min(3, 'Title must be at least 3 characters.'),
  customFields: z.array(customFieldSchema).optional(),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Save one level. `number` is empty when the Ref No. should be generated. */
  onSubmit: (data: Omit<AuditHierarchyNode, 'id' | 'number'> & { number?: string }) => void | Promise<void>;
  /** Save several sibling levels from a pasted list of titles. */
  onSubmitMany: (parentId: string | null, titles: string[]) => void | Promise<void>;
  node: AuditHierarchyNode | null;
  parent: AuditHierarchyNode | null;
  /** All existing levels, used to suggest the next Ref No. */
  hierarchy: AuditHierarchyNode[];
};

export function AddEditAuditNodeDialog({ open, onOpenChange, onSubmit, onSubmitMany, node, parent, hierarchy }: Props) {
  const [mode, setMode] = useState<'one' | 'many'>('one');
  const [list, setList] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: '', title: '', customFields: [] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'customFields' });

  const suggested = useMemo(() => suggestNextNumber(hierarchy, parent), [hierarchy, parent]);
  const titles = useMemo(() => parseTitleList(list), [list]);

  useEffect(() => {
    if (!open) return;
    setMode('one');
    setList('');
    setIsSaving(false);
    if (node) {
      form.reset({ number: node.number, title: node.title, customFields: node.customFields || [] });
      setAdvancedOpen(Boolean(node.customFields?.length));
    } else {
      form.reset({ number: '', title: '', customFields: [] });
      setAdvancedOpen(false);
    }
  }, [node, parent, form, open]);

  const handleSingle = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      await onSubmit({
        ...values,
        // Blank on create means "number it for me"; an edit always keeps its number.
        number: values.number?.trim() || (node ? node.number : undefined),
        parentId: parent?.id || null,
        level: parent ? parent.level + 1 : 1,
        customFields: values.customFields,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMany = async () => {
    if (titles.length === 0) return;
    setIsSaving(true);
    try {
      await onSubmitMany(parent?.id || null, titles);
    } finally {
      setIsSaving(false);
    }
  };

  const levelName = parent ? `sub-levels of ${parent.number}` : 'Level 1 missions';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>
            {node ? 'Edit Hierarchy Level' : parent ? `Add Sub-level to ${parent.number}` : 'Add Level 1 Mission'}
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              {parent ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs">Parent:</span>
                  <Badge variant="outline" className="text-[10px]">{parent.number} - {parent.title}</Badge>
                </div>
              ) : node ? null : (
                <span>Establishing a new top-level mission summary.</span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {!node && (
          <div className="px-6 pt-4">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'one' | 'many')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="one">Add one</TabsTrigger>
                <TabsTrigger value="many">Add several at once</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {mode === 'many' && !node ? (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3">
              <Label htmlFor="hierarchy-list">Titles, one per line</Label>
              <Textarea
                id="hierarchy-list"
                autoFocus
                rows={8}
                placeholder={'Cash handling\nVault access control\nATM replenishment'}
                value={list}
                onChange={(e) => setList(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ref numbers are assigned automatically, continuing after the existing {levelName}.
                {titles.length > 0 && <span className="font-medium text-foreground"> {titles.length} level{titles.length === 1 ? '' : 's'} will be added.</span>}
              </p>
            </div>
            <DialogFooter className="p-6 border-t shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
              <Button type="button" onClick={handleMany} disabled={titles.length === 0 || isSaving}>
                {isSaving ? 'Saving...' : titles.length === 0 ? 'Add levels' : `Add ${titles.length} ${titles.length === 1 ? 'level' : 'levels'}`}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSingle)} className="flex-1 flex flex-col min-h-0">
              {/* Native overflow: a Radix ScrollArea inside this flex column never gets a bounded height. */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-6 space-y-5">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl><Input autoFocus placeholder="Functional area description..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ref No. <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                        <FormControl>
                          <Input className="max-w-[10rem] font-mono" placeholder={node ? node.number : suggested} {...field} />
                        </FormControl>
                        {!node && (
                          <FormDescription>Leave blank to use {suggested}.</FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
                        {advancedOpen ? <ChevronDown className="mr-1 h-4 w-4" /> : <ChevronRight className="mr-1 h-4 w-4" />}
                        <Settings2 className="mr-1 h-4 w-4" />
                        Advanced: extra input fields{fields.length > 0 ? ` (${fields.length})` : ''}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-3">
                      <p className="text-xs text-muted-foreground">
                        Only needed if people logging findings under this level must fill in extra details.
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
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="text">Text / Narrative</SelectItem>
                                        <SelectItem value="number">Numeric Value</SelectItem>
                                        <SelectItem value="string">String (Text &amp; Numbers)</SelectItem>
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
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
              <DialogFooter className="p-6 border-t shrink-0">
                <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : node ? 'Save Changes' : 'Add Level'}</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
