'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { AuditFinding, Branch, RiskLevelData, Auditor } from '@/types';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import PageHeader from '../layout/PageHeader';
import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ShieldCheck, ChevronDown, CalendarIcon, Timer, Lock, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { getFindingFormData, updateFinding } from '@/app/actions/findings';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }),
  details: z.string().min(20, {
    message: 'Finding details must be at least 20 characters.',
  }),
  riskLevel: z.string({
    required_error: 'You need to select a risk level.',
  }),
  branchOrDepartment: z.string({
    required_error: 'You need to select a branch/department.',
  }),
  teamLeader: z.string({
    required_error: 'You need to assign a team leader.',
  }),
  teamMembers: z.array(z.string()).min(1, 'Select at least one team member.'),
  auditCause: z.string().optional(),
  auditEffect: z.string().optional(),
  recommendation: z.string().optional(),
  involvedAmounts: z
    .array(
      z.object({
        name: z.string().min(1, 'Name is required.'),
        amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
      })
    )
    .optional(),
  involvedCases: z
    .array(
      z.object({
        id: z.string(),
        ownerName: z.string().min(1, 'Owner name is required.'),
        status: z.enum(['Open', 'Resolved']),
      })
    )
    .optional(),
  // KPI Fields
  assignedDate: z.date().optional(),
  finalizationDate: z.date().optional(),
  tatDays: z.coerce.number().min(1).optional(),
});

type EditFindingFormProps = {
  finding: AuditFinding;
};

export function EditFindingForm({ finding }: EditFindingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [riskLevels, setRiskLevels] = useState<RiskLevelData[]>([]);
  const [auditors, setAuditors] = useState<Auditor[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: finding.title,
      details: finding.details,
      riskLevel: finding.riskLevel,
      branchOrDepartment: finding.branchOrDepartment,
      teamLeader: finding.teamLeader || '',
      teamMembers: finding.teamMembers || [],
      auditCause: finding.auditCause || '',
      auditEffect: finding.auditEffect || '',
      recommendation: finding.recommendation || '',
      involvedAmounts: finding.involvedAmounts || [],
      involvedCases: finding.involvedCases || [],
      assignedDate: finding.assignedDate ? new Date(finding.assignedDate as any) : undefined,
      finalizationDate: finding.finalizationDate ? new Date(finding.finalizationDate as any) : undefined,
      tatDays: finding.tatDays || 15,
    },
  });

  const {
    fields: amountFields,
    append: appendAmount,
    remove: removeAmount,
  } = useFieldArray({
    control: form.control,
    name: 'involvedAmounts',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFindingFormData();
        setBranches(data.branches as any);
        setRiskLevels(data.riskLevels as any);
        setAuditors(data.auditors as any);
      } catch (error) {
        console.error('Error loading edit form metadata:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const result = await updateFinding(finding.id, values);
      if (result.success) {
        toast({
          title: "Changes Saved",
          description: "The audit finding has been successfully updated in the database."
        });
        router.push('/auditee-view');
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: result.error || "An unexpected error occurred while saving."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Persistence Error",
        description: "Could not connect to the database to save changes."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isAssignedDateLocked = !!finding.assignedDate;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Metadata...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Edit Audit Finding"
        description="Update team structure and finding details."
        backHref="/auditee-view"
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Audit Team Assignment
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="teamLeader"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Leader</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select leader" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {auditors.map((auditor) => (
                              <SelectItem key={auditor.id} value={auditor.fullName}>
                                <div className="flex flex-col items-start text-left">
                                  <span className="font-medium">{auditor.fullName}</span>
                                  <span className="text-[9px] text-muted-foreground uppercase leading-none">{auditor.role}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>The supervisor overseeing the overall audit mission quality.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teamMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Members</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between h-auto min-h-[40px] px-3 py-2",
                                  !field.value?.length && "text-muted-foreground"
                                )}
                              >
                                {field.value?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {field.value.map((val) => (
                                      <Badge key={val} variant="secondary" className="font-normal text-[10px] py-0">
                                        {val}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  "Select members..."
                                )}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <ScrollArea className="h-64 p-2">
                              <div className="space-y-2">
                                {auditors.map((auditor) => (
                                  <div key={auditor.id} className="flex items-center space-x-2 p-1 hover:bg-muted rounded cursor-pointer">
                                    <Checkbox
                                      id={`edit-member-${auditor.id}`}
                                      checked={field.value?.includes(auditor.fullName)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...field.value, auditor.fullName]
                                          : field.value?.filter((v: string) => v !== auditor.fullName);
                                        field.onChange(newValue);
                                      }}
                                    />
                                    <label
                                      htmlFor={`edit-member-${auditor.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full flex flex-col"
                                    >
                                      <span className="font-semibold">{auditor.fullName}</span>
                                      <span className="text-[9px] text-muted-foreground uppercase">{auditor.role}</span>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>Select all members participating in this audit.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-bold flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" /> Cycle Scheduling (KPIs)
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="assignedDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-2">
                          Date Assigned
                          {isAssignedDateLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                disabled={isAssignedDateLocked}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                  isAssignedDateLocked && "bg-muted cursor-not-allowed opacity-100"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {isAssignedDateLocked && (
                          <FormDescription className="text-[10px] italic">
                            Assignment date is locked once established.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="finalizationDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Finalization Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tatDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TAT (Standard Days)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-bold">Finding Details</h3>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Unauthorized Access" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a risk level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {riskLevels.map((level) => (
                              <SelectItem key={level.id} value={level.name}>{level.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="branchOrDepartment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch / Department Audited</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
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
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Finding Details</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the audit finding..." className="h-24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Involved Amounts</h3>
                <div className="space-y-4">
                  {amountFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2 rounded-md border p-4">
                      <FormField
                        control={form.control}
                        name={`involvedAmounts.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`involvedAmounts.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Amount</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="destructive" size="icon" onClick={() => removeAmount(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendAmount({ name: '', amount: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Amount
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recommendations & Root Cause</h3>
                <FormField
                  control={form.control}
                  name="auditCause"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cause of Audit</FormLabel>
                      <FormControl><Textarea className="h-20" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="auditEffect"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effect of Audit</FormLabel>
                      <FormControl><Textarea className="h-20" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recommendation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposed Recommendation</FormLabel>
                      <FormControl><Textarea className="h-24" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4 pb-8">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="font-bold" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save All Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
