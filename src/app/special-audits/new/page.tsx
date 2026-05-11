'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
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
import { Plus, Trash2, UserPlus, FileText, CircleDollarSign, ShieldAlert, Scale, Loader2, Search, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { submitSpecialAudit, getSpecialAuditFormData } from '@/app/actions/special-audits';
import type { Branch, District, Department } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

export default function NewSpecialAuditPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { permissions } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    async function loadData() {
      try {
        const data = await getSpecialAuditFormData();
        setBranches(data.branches as any);
        setDistricts(data.districts as any);
        setDepartments(data.departments as any);
        setCategories(data.categories as any);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Synchronization Error",
          description: "Could not retrieve organizational metadata."
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await submitSpecialAudit(values);
      if (result.success) {
        toast({
          title: "Mission Committed",
          description: "Special audit finding has been recorded in the live database."
        });
        router.push('/special-audits');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Persistence Failed",
        description: "An error occurred while saving the report."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlacement = form.watch('placement');
  const filteredPlacementOptions = (() => {
    const list = selectedPlacement === 'Branch' ? branches : selectedPlacement === 'District' ? districts : departments;
    if (!searchQuery) return list;
    return list.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  })();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Initializing Special Audit Engine...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Log Special Audit" 
        description="Capture real findings for specialized missions and monetary reconciliation."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="border-t-4 border-t-primary shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Report Overview
                  </CardTitle>
                  <CardDescription>Primary identifiers for the special audit report.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                          <Select onValueChange={(v) => { field.onChange(v); form.setValue('placementValue', ''); }} defaultValue={field.value}>
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                              >
                                {field.value || `Select ${selectedPlacement}...`}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <div className="p-2 border-b">
                              <Input 
                                placeholder="Search..." 
                                className="h-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                            </div>
                            <ScrollArea className="h-48">
                              <div className="p-1">
                                {filteredPlacementOptions.map((item) => (
                                  <div
                                    key={item.id}
                                    className={cn(
                                      "flex items-center px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-muted",
                                      field.value === item.name && "bg-primary/10 font-bold"
                                    )}
                                    onClick={() => {
                                      field.onChange(item.name);
                                      setSearchQuery('');
                                    }}
                                  >
                                    {item.name}
                                  </div>
                                ))}
                                {filteredPlacementOptions.length === 0 && (
                                  <div className="p-4 text-center text-xs text-muted-foreground">No matches found.</div>
                                )}
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-accent shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CircleDollarSign className="h-5 w-5 text-accent" />
                    Monetary Value Tracking
                  </CardTitle>
                  <CardDescription>Reconciliation of involved and recovered amounts (ETB).</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-muted-foreground" />
                    Involved Individuals
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', position: '', tenure: '', age: 0, sex: 'Male' })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Person
                  </Button>
                </div>
                
                {fields.map((field, index) => (
                  <Card key={field.id} className="relative">
                    <CardContent className="pt-6 space-y-4">
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
                              <FormControl><Input placeholder="e.g., 5 years" {...field} /></FormControl>
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-t-4 border-t-primary shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" />
                    Analysis & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="auditCause"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cause of Audit</FormLabel>
                          <FormControl><Textarea placeholder="Explain the root cause..." className="h-24" {...field} /></FormControl>
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
                          <FormControl><Textarea placeholder="Describe the impact..." className="h-24" {...field} /></FormControl>
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
                        <FormControl><Textarea placeholder="Outline necessary actions..." className="h-24" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-destructive shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    Accountability & Corrections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="actionDisciplinary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Disciplinary</FormLabel>
                        <FormControl><Textarea placeholder="List all disciplinary measures..." className="h-24" {...field} /></FormControl>
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
                        <FormControl><Textarea placeholder="Identify internal control gaps..." className="h-24" {...field} /></FormControl>
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
                        <FormControl><Textarea placeholder="Steps taken to prevent recurrence..." className="h-24" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.push('/special-audits')} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Committing...</> : 'Submit Special Audit'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
