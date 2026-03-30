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
import type { Branch, RiskLevelData, Auditor, AuditHierarchyNode } from '@/types';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import PageHeader from '../layout/PageHeader';
import { PlusCircle, Trash2, ShieldCheck, ChevronDown, Layers, FileText, CalendarIcon, Timer, Plus, Info, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { initialBranches, initialRiskLevels, initialAuditors, initialHierarchy } from '@/lib/mock-data';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';

const leafFindingSchema = z.object({
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
  tatDays: z.coerce.number().min(1).optional(),
});

const formSchema = z.object({
  hierarchyNodeId: z.string().min(1, 'Please select a predefined location from the audit hierarchy.'),
  findings: z.array(leafFindingSchema).min(1, 'At least one specific finding is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateFindingForm() {
  const router = useRouter();
  const [branches] = useState<Branch[]>(initialBranches);
  const [riskLevels] = useState<RiskLevelData[]>(initialRiskLevels);
  const [auditors] = useState<Auditor[]>(initialAuditors);
  const [hierarchy] = useState<AuditHierarchyNode[]>(initialHierarchy);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hierarchyNodeId: '',
      findings: [{
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

  const { fields: findingFields, append: appendFinding, remove: removeFinding } = useFieldArray({
    control: form.control,
    name: 'findings',
  });

  const selectedNodeId = form.watch('hierarchyNodeId');
  const selectedNode = hierarchy.find(n => n.id === selectedNodeId);

  const filteredHierarchy = useMemo(() => {
    if (!searchQuery) return hierarchy;
    return hierarchy.filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.number.includes(searchQuery)
    );
  }, [hierarchy, searchQuery]);

  function onSubmit(values: FormValues) {
    console.log('Logging findings under predefined node locally', values);
    router.push('/auditee-view');
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Institutional Audit Log"
        description="Select from the official organizational hierarchy to document findings."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Predefined Hierarchy Selection */}
              <Card className="border-t-4 border-t-primary shadow-lg overflow-hidden">
                <CardHeader className="bg-muted/10">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Hierarchical Audit Path
                  </CardTitle>
                  <CardDescription>Pick the standardized node defined in System Settings.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="hierarchyNodeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Predefined Taxonomy Selection</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn("w-full h-14 justify-between bg-muted/20 border-2 border-dashed border-primary/20 hover:border-primary/50", !field.value && "text-muted-foreground")}
                              >
                                {selectedNode ? (
                                  <div className="flex items-center gap-3">
                                    <Badge className="font-mono h-8 w-12 flex justify-center text-base">{selectedNode.number}</Badge>
                                    <div className="text-left">
                                      <p className="font-bold text-foreground leading-none">{selectedNode.title}</p>
                                      <p className="text-[10px] text-muted-foreground uppercase mt-1">Level {selectedNode.level} Official Node</p>
                                    </div>
                                  </div>
                                ) : "Select official audit node..."}
                                <ChevronDown className="h-5 w-5 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <div className="p-2 border-b bg-muted/30">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Search hierarchy by title or number..." 
                                  className="pl-8 h-9" 
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                />
                              </div>
                            </div>
                            <ScrollArea className="h-[350px]">
                              <div className="p-1">
                                {filteredHierarchy.map((node) => (
                                  <div 
                                    key={node.id} 
                                    className={cn(
                                      "flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-primary/5 transition-colors",
                                      field.value === node.id && "bg-primary/10"
                                    )}
                                    onClick={() => {
                                      field.onChange(node.id);
                                      setSearchQuery('');
                                    }}
                                  >
                                    <div className="flex items-center">
                                      {Array.from({ length: node.level - 1 }).map((_, i) => (
                                        <div key={i} className="w-3 border-l h-4 ml-1" />
                                      ))}
                                      <Badge variant="outline" className="font-mono text-[10px] h-5 py-0 min-w-8 flex justify-center">{node.number}</Badge>
                                    </div>
                                    <span className={cn("text-sm", node.level === 1 ? "font-bold" : "font-medium text-muted-foreground")}>{node.title}</span>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>All titles and levels are pre-configured in Settings > Hierarchy & Titles.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Findings Under the Node */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    Findings & Observations
                  </h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    disabled={!selectedNodeId}
                    onClick={() => appendFinding({
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
                    Add Another Finding
                  </Button>
                </div>

                {!selectedNodeId ? (
                  <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/5">
                    <Info className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground font-semibold">Identify the institutional node first to start documenting.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {findingFields.map((field, index) => (
                      <Card key={field.id} className="border-2 shadow-sm overflow-hidden bg-background">
                        <div className="p-4 bg-muted/20 border-b flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono font-bold">
                              {selectedNode?.number}.{index + 1}
                            </Badge>
                            <FormField
                              control={form.control}
                              name={`findings.${index}.title`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input 
                                      placeholder="Irregularity Title (e.g., Policy Non-Compliance)" 
                                      className="h-8 text-sm font-bold bg-transparent border-none w-[400px] focus-visible:ring-0" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                          </div>
                          {findingFields.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive" 
                              onClick={() => removeFinding(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <CardContent className="p-6">
                          <LeafDetailFields 
                            prefix={`findings.${index}`} 
                            control={form.control} 
                            branches={branches} 
                            riskLevels={riskLevels} 
                            auditors={auditors} 
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.push('/')}>Cancel</Button>
                <Button type="submit" size="lg" disabled={!selectedNodeId}>Log Standardized Audit Findings</Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
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
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Resource Allocation
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name={`${prefix}.teamLeader` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Leader</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Leader" /></SelectTrigger></FormControl>
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
                            <div key={a.id} className="flex items-center space-x-2 p-1 hover:bg-muted rounded">
                              <Checkbox 
                                id={`member-${prefix}-${a.id}`} 
                                checked={field.value?.includes(a.fullName)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked ? [...(field.value || []), a.fullName] : field.value?.filter((v: string) => v !== a.fullName);
                                  field.onChange(newValue);
                                }}
                              />
                              <label htmlFor={`member-${prefix}-${a.id}`} className="text-xs cursor-pointer w-full">{a.fullName}</label>
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
              control={control}
              name={`${prefix}.assignedDate` as any}
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
              control={control}
              name={`${prefix}.tatDays` as any}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name={`${prefix}.riskLevel` as any}
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
            control={control}
            name={`${prefix}.branchOrDepartment` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audited Entity</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Branch / Dept" /></SelectTrigger></FormControl>
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
              control={control}
              name={`${prefix}.auditCause` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Root Cause</FormLabel>
                  <FormControl><Textarea className="h-20 resize-none text-xs" {...field} /></FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`${prefix}.auditEffect` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Effect</FormLabel>
                  <FormControl><Textarea className="h-20 resize-none text-xs" {...field} /></FormControl>
                </FormItem>
              )}
            />
         </div>
         <FormField
            control={control}
            name={`${prefix}.recommendation` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Auditor's Recommendation</FormLabel>
                <FormControl><Textarea className="h-20 resize-none text-xs" placeholder="Suggested remedial measures..." {...field} /></FormControl>
              </FormItem>
            )}
          />
      </div>
    </div>
  );
}
