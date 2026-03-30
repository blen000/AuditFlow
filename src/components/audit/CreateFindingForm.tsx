'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Control, UseFormReturn } from 'react-hook-form';
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
import type { Branch, RiskLevelData, Auditor, AuditMissionDefinition, AuditSubsectionDefinition } from '@/types';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import PageHeader from '../layout/PageHeader';
import { PlusCircle, Trash2, ShieldCheck, ChevronDown, Layers, FileText, CalendarIcon, Timer, Plus, Info } from 'lucide-react';
import { useState } from 'react';
import { initialBranches, initialRiskLevels, initialAuditors, initialAuditMissions, initialAuditSubsections } from '@/lib/mock-data';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';

const leafDetailSchema = z.object({
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
  assignedDate: z.date().optional(),
  finalizationDate: z.date().optional(),
  tatDays: z.coerce.number().min(1).optional(),
});

const subsectionSchema = z.object({
  title: z.string().min(1, 'Please select a predefined subsection title.'),
  subSubsections: z.array(leafDetailSchema).optional(),
  // Fields if user enters data directly into L2 (acting as a leaf)
  details: z.string().optional(),
  riskLevel: z.string().optional(),
  branchOrDepartment: z.string().optional(),
  teamLeader: z.string().optional(),
  teamMembers: z.array(z.string()).optional(),
  auditCause: z.string().optional(),
  auditEffect: z.string().optional(),
  recommendation: z.string().optional(),
  involvedAmounts: z.array(z.object({
    name: z.string().min(1, 'Name is required.'),
    amount: z.coerce.number().min(0, 'Amount must be positive.'),
  })).optional(),
  assignedDate: z.date().optional(),
  finalizationDate: z.date().optional(),
  tatDays: z.coerce.number().optional(),
});

const formSchema = z.object({
  missionId: z.string().min(1, 'Please select a predefined mission.'),
  subsections: z.array(subsectionSchema).min(1, 'At least one subsection is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateFindingForm() {
  const router = useRouter();
  const [branches] = useState<Branch[]>(initialBranches);
  const [riskLevels] = useState<RiskLevelData[]>(initialRiskLevels);
  const [auditors] = useState<Auditor[]>(initialAuditors);
  const [missions] = useState<AuditMissionDefinition[]>(initialAuditMissions);
  const [allSubsections] = useState<AuditSubsectionDefinition[]>(initialAuditSubsections);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      missionId: '',
      subsections: [{
        title: '',
        details: '',
        subSubsections: [],
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

  const selectedMissionId = form.watch('missionId');
  const availableSubsections = allSubsections.filter(s => s.missionId === selectedMissionId);
  const selectedMission = missions.find(m => m.id === selectedMissionId);

  const { fields: subsectionFields, append: appendSubsection, remove: removeSubsection } = useFieldArray({
    control: form.control,
    name: 'subsections',
  });

  function onSubmit(values: FormValues) {
    console.log('Logging complex hierarchical finding locally', values);
    router.push('/auditee-view');
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Hierarchical Audit Log"
        description="Select predefined mission levels and document findings."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Level 1: Main Mission Selection */}
              <Card className="border-t-4 border-t-primary shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Main Audit Mission (Level 1)
                  </CardTitle>
                  <CardDescription>Select from predefined missions managed in System Settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="missionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Predefined Mission Summary</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-muted/20">
                              <SelectValue placeholder="Choose a Mission..." />
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
                        <FormDescription>The Mission Title and Case Number are predefined in settings.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Level 2 & 3 */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    Sub-Sections & Findings
                  </h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    disabled={!selectedMissionId}
                    onClick={() => appendSubsection({
                      title: '',
                      details: '',
                      subSubsections: [],
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

                {!selectedMissionId ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
                    <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground font-medium">Please select a Main Mission first.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {subsectionFields.map((subsectionField, subIndex) => (
                      <SubsectionCard
                        key={subsectionField.id}
                        subIndex={subIndex}
                        control={form.control}
                        form={form}
                        removeSubsection={removeSubsection}
                        branches={branches}
                        riskLevels={riskLevels}
                        auditors={auditors}
                        availableSubsections={availableSubsections}
                        missionCaseNumber={selectedMission?.caseNumber || '?'}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.push('/')}>Cancel</Button>
                <Button type="submit" size="lg" disabled={!selectedMissionId}>Submit Hierarchical Audit</Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}

function SubsectionCard({ 
  subIndex, 
  control, 
  form, 
  removeSubsection, 
  branches, 
  riskLevels, 
  auditors,
  availableSubsections,
  missionCaseNumber
}: { 
  subIndex: number; 
  control: Control<FormValues>;
  form: UseFormReturn<FormValues>;
  removeSubsection: (index: number) => void;
  branches: Branch[];
  riskLevels: RiskLevelData[];
  auditors: Auditor[];
  availableSubsections: AuditSubsectionDefinition[];
  missionCaseNumber: string;
}) {
  const { fields: subSubsectionFields, append: appendSubSubsection, remove: removeSubSubsection } = useFieldArray({
    control,
    name: `subsections.${subIndex}.subSubsections`,
  });

  const hasSubSubsections = subSubsectionFields.length > 0;
  const subTitle = form.watch(`subsections.${subIndex}.title`);

  return (
    <Card className="border shadow-sm overflow-hidden bg-card/50">
      <CardHeader className="bg-muted/30 border-b py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-7 w-12 flex justify-center font-mono text-lg font-bold">
              {missionCaseNumber}.{subIndex + 1}
            </Badge>
            <FormField
              control={control}
              name={`subsections.${subIndex}.title`}
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 font-bold bg-white border-dashed focus:border-solid w-[300px]">
                        <SelectValue placeholder="Select Predefined Subsection..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableSubsections.map(s => (
                        <SelectItem key={s.id} value={s.title}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            {!hasSubSubsections && (
               <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                className="h-8 text-xs font-bold"
                onClick={() => appendSubSubsection({
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
                <Plus className="mr-1 h-3 w-3" /> Add Finding (L3)
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSubsection(subIndex)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {!hasSubSubsections ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/20 p-2 rounded w-fit">
              <Info className="h-3 w-3" /> Direct Subsection Entry
            </div>
            <LeafDetailFields 
              prefix={`subsections.${subIndex}`} 
              control={control} 
              branches={branches} 
              riskLevels={riskLevels} 
              auditors={auditors} 
            />
          </div>
        ) : (
          <div className="bg-muted/10">
            <div className="p-4 border-b flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
              <Layers className="h-3 w-3" /> Nested Findings Structure
            </div>
            <div className="p-4 space-y-4">
              {subSubsectionFields.map((subSubField, subSubIndex) => (
                <Card key={subSubField.id} className="border bg-background shadow-sm overflow-hidden">
                   <div className="p-3 bg-muted/20 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="h-5 w-12 flex justify-center text-[10px] font-bold font-mono">
                        {missionCaseNumber}.{subIndex + 1}.{subSubIndex + 1}
                      </Badge>
                      <FormField
                        control={control}
                        name={`subsections.${subIndex}.subSubsections.${subSubIndex}.title`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input 
                                placeholder="Finding Title (e.g., Dual Control Violation)" 
                                className="h-7 text-xs font-bold bg-transparent border-none w-[350px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-[9px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-destructive" 
                      onClick={() => removeSubSubsection(subSubIndex)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="p-6">
                    <LeafDetailFields 
                      prefix={`subsections.${subIndex}.subSubsections.${subSubIndex}`} 
                      control={control} 
                      branches={branches} 
                      riskLevels={riskLevels} 
                      auditors={auditors} 
                    />
                  </div>
                </Card>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full border-dashed py-6 hover:bg-primary/5" 
                onClick={() => appendSubSubsection({
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
                <Plus className="mr-2 h-4 w-4" /> Add Another Finding to "{subTitle || `Subsection ${subIndex + 1}`}"
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeafDetailFields({ 
  prefix, 
  control, 
  branches, 
  riskLevels, 
  auditors 
}: { 
  prefix: string; 
  control: Control<FormValues>;
  branches: Branch[];
  riskLevels: RiskLevelData[];
  auditors: Auditor[];
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Team Assignment
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name={`${prefix}.teamLeader` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Leader</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select leader" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {auditors.map(a => <SelectItem key={a.id} value={a.fullName}>{a.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${prefix}.teamMembers` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Members</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full justify-between h-9 px-3 py-2", !field.value?.length && "text-muted-foreground")}>
                          <span className="truncate">
                            {field.value?.length > 0 ? `${field.value.length} assigned` : "Select members..."}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <ScrollArea className="h-64 p-2">
                        <div className="space-y-2">
                          {auditors.map(a => (
                            <div key={a.id} className="flex items-center space-x-2 p-1">
                              <Checkbox 
                                id={`member-${prefix}-${a.id}`} 
                                checked={field.value?.includes(a.fullName)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked ? [...(field.value || []), a.fullName] : field.value?.filter((v: string) => v !== a.fullName);
                                  field.onChange(newValue);
                                }}
                              />
                              <label htmlFor={`member-${prefix}-${a.id}`} className="text-sm cursor-pointer w-full">{a.fullName}</label>
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

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Timer className="h-4 w-4" /> Cycle Schedule
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name={`${prefix}.assignedDate` as any}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Assigned</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full h-9 pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "MMM d, yyyy") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${prefix}.tatDays` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TAT (Days)</FormLabel>
                  <FormControl><Input type="number" className="h-9" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Finding Information</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name={`${prefix}.riskLevel` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select risk" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {riskLevels.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.branchOrDepartment` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch / Department</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select branch" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {branches.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name={`${prefix}.details` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Description</FormLabel>
              <FormControl><Textarea className="h-24 resize-none" placeholder="Explain the detailed finding here..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      <div className="space-y-4">
         <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Analysis & Recommendations</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
              control={control}
              name={`${prefix}.auditCause` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cause of Audit</FormLabel>
                  <FormControl><Textarea className="h-20 resize-none" {...field} /></FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${prefix}.auditEffect` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effect of Audit</FormLabel>
                  <FormControl><Textarea className="h-20 resize-none" {...field} /></FormControl>
                </FormItem>
              )}
            />
         </div>
         <FormField
            control={control}
            name={`${prefix}.recommendation` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proposed Recommendation</FormLabel>
                <FormControl><Textarea className="h-24 resize-none" {...field} /></FormControl>
              </FormItem>
            )}
          />
      </div>
    </div>
  );
}
