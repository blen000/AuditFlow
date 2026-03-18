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
import type { AuditFinding, Branch, RiskLevelData } from '@/types';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import PageHeader from '../layout/PageHeader';
import { useEffect, useState } from 'react';
import { Paperclip, PlusCircle, Trash2, UserCheck, ShieldCheck, Users } from 'lucide-react';
import { initialBranches, initialRiskLevels } from '@/lib/mock-data';

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
  assignedAuditor: z.string({
    required_error: 'You need to assign a designated auditor.',
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
});

type EditFindingFormProps = {
  finding: AuditFinding;
};

export function EditFindingForm({ finding }: EditFindingFormProps) {
  const router = useRouter();
  const [branches] = useState<Branch[]>(initialBranches);
  const [riskLevels] = useState<RiskLevelData[]>(initialRiskLevels);
  const auditors = ['Abebe Shirega', 'Fikre Tollossa', 'Ze'];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: finding.title,
      details: finding.details,
      riskLevel: finding.riskLevel,
      branchOrDepartment: finding.branchOrDepartment,
      assignedAuditor: finding.assignedAuditor || '',
      teamLeader: finding.teamLeader || '',
      teamMembers: finding.teamMembers || [],
      auditCause: finding.auditCause,
      auditEffect: finding.auditEffect,
      recommendation: finding.recommendation,
      involvedAmounts: finding.involvedAmounts || [],
      involvedCases: finding.involvedCases || [],
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

  const {
    fields: caseFields,
    append: appendCase,
    remove: removeCase,
  } = useFieldArray({
    control: form.control,
    name: 'involvedCases',
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Saving changes locally', values);
    router.push('/auditee-view');
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Edit Audit Finding"
        description="Update team structure and finding details."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Audit Team Assignment
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="assignedAuditor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designated Auditor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select auditor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {auditors.map((auditor) => (
                              <SelectItem key={auditor} value={auditor}>{auditor}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                              <SelectItem key={auditor} value={auditor}>{auditor}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teamMembers"
                    render={() => (
                      <FormItem className="md:col-span-2">
                        <div className="mb-4">
                          <FormLabel className="text-base">Team Members</FormLabel>
                          <FormDescription>Select all members participating in this audit.</FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {auditors.map((auditor) => (
                            <FormField
                              key={auditor}
                              control={form.control}
                              name="teamMembers"
                              render={({ field }) => {
                                return (
                                  <FormItem key={auditor} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(auditor)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, auditor])
                                            : field.onChange(field.value?.filter((value) => value !== auditor));
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{auditor}</FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
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
                <h3 className="text-lg font-semibold mb-4">Involved Amounts & Cases</h3>
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

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push('/auditee-view')}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
