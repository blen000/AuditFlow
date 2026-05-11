'use client';

import { useEffect, useState } from 'react';
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
import { Plus, Trash2, UserPlus, FileText, CircleDollarSign, ShieldAlert, Scale } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SpecialAudit } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Settings } from 'lucide-react';

import { getSpecialAuditFormData } from '@/app/actions/special-audits';

const individualSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  position: z.string().min(2, 'Position is required'),
  tenure: z.string().min(1, 'Tenure is required'),
  age: z.coerce.number().min(18, 'Must be at least 18'),
  sex: z.enum(['Male', 'Female']),
});

const formSchema = z.object({
  shortSummary: z.string().min(5, 'Summary must be at least 5 characters'),
  placement: z.enum(['Branch', 'District', 'H.O']),
  placementValue: z.string().min(2, 'Placement detail is required'),
  categoryId: z.string().optional(),
  amountInvolved: z.coerce.number().min(0),
  recovered: z.coerce.number().min(0),
  pending: z.coerce.number().min(0),
  individuals: z.array(individualSchema).min(1, 'At least one individual must be listed'),
  actionDisciplinary: z.string().min(2, 'Action is required'),
  gapWitnessed: z.string().min(2, 'Gap description is required'),
  correctiveActionTaken: z.string().min(2, 'Corrective action is required'),
  auditCause: z.string().optional(),
  auditEffect: z.string().optional(),
  recommendation: z.string().optional(),
});

type AddEditSpecialAuditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<SpecialAudit, 'id' | 'dateCreated'>) => void;
  audit: SpecialAudit | null;
};

export function AddEditSpecialAuditDialog({
  open,
  onOpenChange,
  onSubmit,
  audit,
}: AddEditSpecialAuditDialogProps) {
  const { permissions } = useAuth();
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shortSummary: '',
      placement: 'Branch',
      placementValue: '',
      categoryId: '',
      amountInvolved: 0,
      recovered: 0,
      pending: 0,
      individuals: [{ name: '', position: '', tenure: '', age: 0, sex: 'Male' }],
      actionDisciplinary: '',
      gapWitnessed: '',
      correctiveActionTaken: '',
      auditCause: '',
      auditEffect: '',
      recommendation: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'individuals',
  });

  useEffect(() => {
    async function loadFormData() {
      try {
        const data = await getSpecialAuditFormData();
        setCategories(data.categories as any);
      } catch (error) {
        console.error('Failed to load form data:', error);
      }
    }
    if (open) {
      loadFormData();
      if (audit) {
        form.reset({
          shortSummary: audit.shortSummary,
          placement: audit.placement,
          placementValue: audit.placementValue,
          categoryId: audit.categoryId || '',
          amountInvolved: audit.amountInvolved,
          recovered: audit.recovered,
          pending: audit.pending,
          individuals: audit.individuals,
          actionDisciplinary: audit.actionDisciplinary,
          gapWitnessed: audit.gapWitnessed,
          correctiveActionTaken: audit.correctiveActionTaken,
          auditCause: audit.auditCause || '',
          auditEffect: audit.auditEffect || '',
          recommendation: audit.recommendation || '',
        });
      } else {
        form.reset({
          shortSummary: '',
          placement: 'Branch',
          placementValue: '',
          categoryId: '',
          amountInvolved: 0,
          recovered: 0,
          pending: 0,
          individuals: [{ name: '', position: '', tenure: '', age: 0, sex: 'Male' }],
          actionDisciplinary: '',
          gapWitnessed: '',
          correctiveActionTaken: '',
          auditCause: '',
          auditEffect: '',
          recommendation: '',
        });
      }
    }
  }, [audit, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background">
          <DialogTitle>{audit ? 'Edit Special Audit' : 'New Special Audit Report'}</DialogTitle>
          <DialogDescription>Fill out the pertinent details for the special audit report.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-6 space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                    <FileText className="h-4 w-4" /> Report Overview
                  </div>
                  <FormField
                    control={form.control}
                    name="shortSummary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Summary of the Report</FormLabel>
                        <FormControl><Input placeholder="Brief title/summary..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="placement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Placement Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select placement" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Branch">Branch</SelectItem>
                              <SelectItem value="District">District</SelectItem>
                              <SelectItem value="H.O">H.O (Head Office)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Special Finding Category</FormLabel>
                            {permissions.includes('settings_special_finding_categories_access') && (
                              <Link 
                                href="/settings/special-finding-categories" 
                                className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                                target="_blank"
                              >
                                <Settings className="h-2.5 w-2.5" />
                                Manage
                              </Link>
                            )}
                          </div>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="placementValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placement Detail (Name)</FormLabel>
                        <FormControl><Input placeholder="Enter branch/district name..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Monetary Values */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                    <CircleDollarSign className="h-4 w-4" /> Monetary Value tracking
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="amountInvolved"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Involved</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recovered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recovered</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pending"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pending's</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Involved Individuals */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                      <UserPlus className="h-4 w-4" /> Involved Individuals
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', position: '', tenure: '', age: 0, sex: 'Male' })}>
                      <Plus className="h-3 w-3 mr-1" /> Add Person
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 rounded-lg border bg-muted/20 relative space-y-4">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-7 w-7 text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`individuals.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl><Input placeholder="Full Name" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`individuals.${index}.position`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position</FormLabel>
                                <FormControl><Input placeholder="Job Title" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`individuals.${index}.tenure`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tenure</FormLabel>
                                <FormControl><Input placeholder="Years of service" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`individuals.${index}.age`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`individuals.${index}.sex`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sex</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Analysis & Recommendations */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                    <Scale className="h-4 w-4" /> Analysis & Recommendations
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="auditCause"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cause of Audit</FormLabel>
                          <FormControl><Textarea placeholder="Explain the root cause..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="auditEffect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effect of Audit</FormLabel>
                          <FormControl><Textarea placeholder="Describe the impact..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="recommendation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed Recommendation</FormLabel>
                        <FormControl><Textarea placeholder="Outline necessary actions..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Accountability */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                    <ShieldAlert className="h-4 w-4" /> Accountability & Actions
                  </div>
                  <FormField
                    control={form.control}
                    name="actionDisciplinary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Disciplinary</FormLabel>
                        <FormControl><Textarea placeholder="Describe disciplinary actions taken..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gapWitnessed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gap Witnessed</FormLabel>
                        <FormControl><Textarea placeholder="Internal control gaps identified..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="correctiveActionTaken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Corrective Action Taken</FormLabel>
                        <FormControl><Textarea placeholder="Steps taken to address the gap..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t bg-muted/10 shrink-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{audit ? 'Update Report' : 'Create Special Audit'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
