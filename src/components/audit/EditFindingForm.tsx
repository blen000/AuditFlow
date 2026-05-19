'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import type { AuditFinding, Branch, RiskLevelData, Auditor, Department, District } from '@/types';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import PageHeader from '../layout/PageHeader';
import { useState, useEffect } from 'react';
import { ShieldCheck, ChevronDown, CalendarIcon, Timer, Loader2, Settings2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { getFindingFormData, updateFinding } from '@/app/actions/findings';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string(),
  details: z.string().min(20, 'Finding details must be at least 20 characters.'),
  riskLevel: z.string({ required_error: 'Select a risk level.' }),
  branch: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
  branchOrDepartment: z.string().optional(),
  teamLeader: z.string({ required_error: 'Assign a team leader.' }),
  teamMembers: z.array(z.string()).min(1, 'Select at least one team member.'),
  auditCause: z.string().optional(),
  auditEffect: z.string().optional(),
  recommendation: z.string().optional(),
  assignedDate: z.date().optional(),
  tatDays: z.coerce.number().min(1).optional(),
  dynamicValues: z.record(z.any()).optional(),
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [riskLevels, setRiskLevels] = useState<RiskLevelData[]>([]);
  const [auditors, setAuditors] = useState<Auditor[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: finding.title,
      details: finding.details,
      riskLevel: finding.riskLevel,
      branch: finding.branch || '',
      department: finding.department || '',
      district: finding.district || '',
      branchOrDepartment: finding.branchOrDepartment,
      teamLeader: finding.teamLeader || '',
      teamMembers: finding.teamMembers || [],
      auditCause: finding.auditCause || '',
      auditEffect: finding.auditEffect || '',
      recommendation: finding.recommendation || '',
      assignedDate: finding.assignedDate ? new Date(finding.assignedDate as any) : undefined,
      tatDays: finding.tatDays || 15,
      dynamicValues: finding.dynamicValues || {},
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFindingFormData();
        setBranches(data.branches as any);
        setDepartments(data.departments as any);
        setDistricts(data.districts as any);
        setRiskLevels(data.riskLevels as any);
        setAuditors(data.auditors as any);
        
        form.reset({
          title: finding.title,
          details: finding.details,
          riskLevel: finding.riskLevel,
          branch: finding.branch || '',
          department: finding.department || '',
          district: finding.district || '',
          branchOrDepartment: finding.branchOrDepartment,
          teamLeader: finding.teamLeader || '',
          teamMembers: finding.teamMembers || [],
          auditCause: finding.auditCause || '',
          auditEffect: finding.auditEffect || '',
          recommendation: finding.recommendation || '',
          assignedDate: finding.assignedDate ? new Date(finding.assignedDate as any) : undefined,
          tatDays: finding.tatDays || 15,
          dynamicValues: finding.dynamicValues || {},
        });
      } catch (error) {
        console.error('Error loading edit form metadata:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [finding, form]);

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
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Audit Taxonomy...</p>
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
        <div className="mx-auto max-w-5xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" /> Resource Allocation
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="teamLeader"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Leader</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Leader" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {auditors.map(a => (
                                  <SelectItem key={a.id} value={a.fullName}>
                                    <div className="flex flex-col items-start text-left">
                                      <span className="font-medium">{a.fullName}</span>
                                      <span className="text-[9px] text-muted-foreground uppercase leading-none">{a.role}</span>
                                    </div>
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
                        name="teamMembers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Members</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className={cn("w-full justify-between h-9 px-3 text-xs", !field.value?.length && "text-muted-foreground")}>
                                    <span className="truncate">
                                      {field.value?.length > 0 ? `${field.value.length} assigned` : "Select..."}
                                    </span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[250px] p-0" align="start">
                                <ScrollArea className="h-48 p-2">
                                  <div className="space-y-1">
                                    {auditors.map(a => (
                                      <div key={a.id} className="flex items-center space-x-2 p-1 hover:bg-muted rounded group">
                                        <Checkbox 
                                          id={`edit-member-${a.id}`} 
                                          checked={field.value?.includes(a.fullName)}
                                          onCheckedChange={(checked) => {
                                            const newValue = checked ? [...(field.value || []), a.fullName] : field.value?.filter((v: string) => v !== a.fullName);
                                            field.onChange(newValue);
                                          }}
                                        />
                                        <label htmlFor={`edit-member-${a.id}`} className="text-xs cursor-pointer w-full flex flex-col">
                                          <span className="font-semibold">{a.fullName}</span>
                                          <span className="text-[9px] text-muted-foreground uppercase">{a.role}</span>
                                        </label>
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
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Timer className="h-3.5 w-3.5" /> Performance Cycle
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="assignedDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Assignment Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant={"outline"} className={cn("w-full h-9 pl-3 text-left font-normal text-xs", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "MMM d, yyyy") : <span>Date</span>}
                                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
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
                        control={form.control}
                        name="tatDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>TAT Goal (Days)</FormLabel>
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
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detailed Observation</h4>
                  
                  {/* Dynamic Custom Fields Section */}
                  {finding.dynamicValues && Object.keys(finding.dynamicValues).length > 0 && (
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-primary tracking-widest">
                        <Settings2 className="h-3.5 w-3.5" /> Dynamic Node-Specific Fields
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(finding.dynamicValues).map(([key, value]) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name={`dynamicValues.${key}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">{key}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="text" 
                                    className="h-9" 
                                    placeholder={`Enter ${key.toLowerCase()}...`}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="riskLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inherent Risk</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Severity" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {riskLevels.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select Branch" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {branches.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select Department" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select District" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {districts.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
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
                        <FormLabel>Narrative Explanation</FormLabel>
                        <FormControl><Textarea className="h-24 resize-none" placeholder="Elaborate on the control gap or discrepancy observed..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Impact & Resolution</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="auditCause"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Root Cause</FormLabel>
                            <FormControl><Textarea className="h-20 resize-none text-xs" {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="auditEffect"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Effect</FormLabel>
                            <FormControl><Textarea className="h-20 resize-none text-xs" {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                   </div>
                   <FormField
                      control={form.control}
                      name="recommendation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auditor's Recommendation</FormLabel>
                          <FormControl><Textarea className="h-20 resize-none text-xs" placeholder="Suggested remedial measures..." {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" size="lg" disabled={isSubmitting}>
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
