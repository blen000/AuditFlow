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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import type { Branch, RiskLevelData, Auditor } from '@/types';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import PageHeader from '../layout/PageHeader';
import { PlusCircle, Trash2, ShieldCheck, ChevronDown, Layers, FileText, CalendarIcon, Timer } from 'lucide-react';
import { useState } from 'react';
import { initialBranches, initialRiskLevels, initialAuditors } from '@/lib/mock-data';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';

const subsectionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  details: z.string().min(20, 'Finding details must be at least 20 characters.'),
  riskLevel: z.string({ required_error: 'Select a risk level.' }),
  branchOrDepartment: z.string({ required_error: 'Select a branch/department.' }),
  teamLeader: z.string({ required_error: 'Assign a team leader.' }),
  teamMembers: z.array(z.string()).min(1, 'Select at least one team member.'),
  auditCause: z.string().optional(),
  auditEffect: z.string().optional(),
  recommendation: z.string().optional(),
  involvedAmounts: z.array(z.object({
    name: z.string().min(1, 'Name is required.'),
    amount: z.coerce.number().min(0, 'Amount must be positive.'),
  })).optional(),
  // KPI Fields
  assignedDate: z.date().optional(),
  finalizationDate: z.date().optional(),
  tatDays: z.coerce.number().min(1, 'TAT must be at least 1 day.').optional(),
});

const formSchema = z.object({
  caseNumber: z.string().min(1, 'Case number is required.'),
  summary: z.string().min(5, 'Summary finding is required.'),
  subsections: z.array(subsectionSchema).min(1, 'At least one subsection is required.'),
});

export function CreateFindingForm() {
  const router = useRouter();
  const [branches] = useState<Branch[]>(initialBranches);
  const [riskLevels] = useState<RiskLevelData[]>(initialRiskLevels);
  const [auditors] = useState<Auditor[]>(initialAuditors);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caseNumber: '',
      summary: '',
      subsections: [{
        title: '',
        details: '',
        teamLeader: '',
        teamMembers: [],
        riskLevel: '',
        branchOrDepartment: '',
        auditCause: '',
        auditEffect: '',
        recommendation: '',
        involvedAmounts: [],
        tatDays: 15,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'subsections',
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Logging hierarchical finding locally', values);
    router.push('/auditee-view');
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Log New Audit"
        description="Establish a hierarchical audit log with multiple subsections."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <Card className="border-t-4 border-t-primary shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Main Audit Details (Parent Level)
                  </CardTitle>
                  <CardDescription>Define the core identity of this audit mission.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name="caseNumber"
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel>Case Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 1, 2, 3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>Main Finding Summary</FormLabel>
                          <FormControl>
                            <Input placeholder="High-level summary of the audit objective..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    Audit Subsections (Child Level)
                  </h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => append({
                      title: '',
                      details: '',
                      teamLeader: '',
                      teamMembers: [],
                      riskLevel: '',
                      branchOrDepartment: '',
                      auditCause: '',
                      auditEffect: '',
                      recommendation: '',
                      involvedAmounts: [],
                      tatDays: 15,
                    })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Subsection
                  </Button>
                </div>

                <Accordion type="multiple" defaultValue={['subsection-0']} className="space-y-4">
                  {fields.map((field, index) => (
                    <AccordionItem key={field.id} value={`subsection-${index}`} className="border rounded-lg bg-card overflow-hidden shadow-sm">
                      <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/30">
                        <div className="flex items-center gap-3 text-left">
                          <Badge variant="outline" className="h-6 w-10 flex justify-center font-mono">
                            {form.watch('caseNumber') || '?'}.{index + 1}
                          </Badge>
                          <span className="font-semibold text-sm">
                            {form.watch(`subsections.${index}.title`) || `New Subsection ${index + 1}`}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-4 space-y-6">
                        
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Team Assignment
                          </h4>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`subsections.${index}.teamLeader`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Team Leader</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger><SelectValue placeholder="Select leader" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {auditors.map((auditor) => (
                                        <SelectItem key={auditor.id} value={auditor.fullName}>{auditor.fullName}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`subsections.${index}.teamMembers`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Team Members</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className={cn("w-full justify-between h-auto min-h-[40px] px-3 py-2", !field.value?.length && "text-muted-foreground")}
                                        >
                                          {field.value?.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                              {field.value.map((val) => (
                                                <Badge key={val} variant="secondary" className="text-[10px]">{val}</Badge>
                                              ))}
                                            </div>
                                          ) : "Select members..."}
                                          <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                      <ScrollArea className="h-64 p-2">
                                        <div className="space-y-2">
                                          {auditors.map((auditor) => (
                                            <div key={auditor.id} className="flex items-center space-x-2 p-1">
                                              <Checkbox
                                                id={`member-${index}-${auditor.id}`}
                                                checked={field.value?.includes(auditor.fullName)}
                                                onCheckedChange={(checked) => {
                                                  const newValue = checked
                                                    ? [...field.value, auditor.fullName]
                                                    : field.value?.filter((v: string) => v !== auditor.fullName);
                                                  field.onChange(newValue);
                                                }}
                                              />
                                              <label htmlFor={`member-${index}-${auditor.id}`} className="text-sm cursor-pointer w-full">{auditor.fullName}</label>
                                            </div>
                                          ))}
                                        </div>
                                      </ScrollArea>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Timer className="h-4 w-4" /> Cycle Scheduling (KPIs)
                          </h4>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <FormField
                              control={form.control}
                              name={`subsections.${index}.assignedDate`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Date Assigned</FormLabel>
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
                              name={`subsections.${index}.finalizationDate`}
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
                              name={`subsections.${index}.tatDays`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>TAT (Standard Days)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="e.g., 15" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Finding Information</h4>
                          <FormField
                            control={form.control}
                            name={`subsections.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Finding Title</FormLabel>
                                <FormControl><Input placeholder="e.g., Unauthorized Access" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`subsections.${index}.riskLevel`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Risk Level</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger><SelectValue placeholder="Select risk" /></SelectTrigger>
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
                              name={`subsections.${index}.branchOrDepartment`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Branch / Department</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
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
                            name={`subsections.${index}.details`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Finding Details</FormLabel>
                                <FormControl><Textarea className="h-24" placeholder="Explain the finding in detail..." {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                           <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Analysis & Recommendations</h4>
                           <FormField
                              control={form.control}
                              name={`subsections.${index}.auditCause`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cause of Audit</FormLabel>
                                  <FormControl><Textarea className="h-16" {...field} /></FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`subsections.${index}.auditEffect`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Effect of Audit</FormLabel>
                                  <FormControl><Textarea className="h-16" {...field} /></FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`subsections.${index}.recommendation`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Proposed Recommendation</FormLabel>
                                  <FormControl><Textarea className="h-20" {...field} /></FormControl>
                                </FormItem>
                              )}
                            />
                        </div>

                        {fields.length > 1 && (
                          <div className="pt-4 flex justify-end">
                            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Subsection
                            </Button>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.push('/')}>Cancel</Button>
                <Button type="submit" size="lg">Log Hierarchical Audit</Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
