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
import type { AuditFinding } from '@/types';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import PageHeader from '../layout/PageHeader';
import { branches } from '@/lib/branches';
import { riskLevels } from '@/lib/risk-levels';
import { Paperclip, PlusCircle, Trash2 } from 'lucide-react';

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
  auditCause: z.string().optional(),
  auditEffect: z.string().optional(),
  mitigationPlan: z.string().optional(),
  involvedAmounts: z.array(z.object({
    name: z.string().min(1, 'Name is required.'),
    amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
  })).optional(),
  // We'll handle files separately, not through zod for now
});

export function CreateFindingForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      details: '',
      auditCause: '',
      auditEffect: '',
      mitigationPlan: '',
      involvedAmounts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'involvedAmounts',
  });


  const { register } = form;
  const findingAttachments = form.watch('findingAttachments' as any);
  const auditCauseAttachments = form.watch('auditCauseAttachments' as any);
  const auditEffectAttachments = form.watch('auditEffectAttachments' as any);
  const mitigationAttachments = form.watch('mitigationAttachments' as any);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const findingAttachmentFiles = findingAttachments as FileList | undefined;
    const auditCauseAttachmentFiles =
      auditCauseAttachments as FileList | undefined;
    const auditEffectAttachmentFiles =
      auditEffectAttachments as FileList | undefined;
    const mitigationAttachmentFiles =
      mitigationAttachments as FileList | undefined;

    const newFinding: AuditFinding = {
      id: `FIND-${Date.now()}`,
      status: 'Open',
      auditeeAgreement: 'Pending',
      ...values,
      riskLevel: values.riskLevel,
      mitigationPlan: values.mitigationPlan || '',
      findingAttachments: findingAttachmentFiles
        ? Array.from(findingAttachmentFiles).map((file) => file.name)
        : [],
      auditCauseAttachments: auditCauseAttachmentFiles
        ? Array.from(auditCauseAttachmentFiles).map((file) => file.name)
        : [],
      auditEffectAttachments: auditEffectAttachmentFiles
        ? Array.from(auditEffectAttachmentFiles).map((file) => file.name)
        : [],
      mitigationAttachments: mitigationAttachmentFiles
        ? Array.from(mitigationAttachmentFiles).map((file) => file.name)
        : [],
    };
    // In a real app, you'd save this to a database and upload the files
    console.log('New Finding:', newFinding);
    router.push('/');
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Log New Audit Finding"
        description="Log a new audit finding for your team to address."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Unauthorized Access"
                        {...field}
                      />
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a risk level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {riskLevels.map((level) => (
                            <SelectItem key={level.name} value={level.name}>
                              {level.name}
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
                  name="branchOrDepartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch / Department Audited</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a branch or department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.name} value={branch.name}>
                              {branch.name}
                            </SelectItem>
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
                      <Textarea
                        placeholder="Describe the audit finding in detail..."
                        className="h-24 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Finding Attachments</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    multiple
                    {...register('findingAttachments' as any)}
                  />
                </FormControl>
                <FormDescription>
                  You can upload multiple files.
                </FormDescription>
                {findingAttachments &&
                  Array.from(findingAttachments).map(
                    (file: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>{file.name}</span>
                      </div>
                    )
                  )}
                <FormMessage />
              </FormItem>
              <Separator />
               <div>
                <h3 className="text-lg font-semibold">Amounts Involved</h3>
                  {fields.map((field, index) => (
                    <div key={field.id} className="mt-2 flex items-end gap-2 rounded-md border p-4">
                      <FormField
                        control={form.control}
                        name={`involvedAmounts.${index}.name`}
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Initial Shortage" {...field} />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`involvedAmounts.${index}.amount`}
                        render={({ field }) => (
                           <FormItem className='flex-1'>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 150.00" {...field} />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ name: '', amount: 0 })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Amount
                  </Button>
               </div>

              <Separator />
              <FormField
                control={form.control}
                name="auditCause"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cause of Audit</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the cause of the audit finding..."
                        className="h-24 resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Cause Attachments</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    multiple
                    {...register('auditCauseAttachments' as any)}
                  />
                </FormControl>
                {auditCauseAttachments &&
                  Array.from(auditCauseAttachments).map(
                    (file: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>{file.name}</span>
                      </div>
                    )
                  )}
                <FormMessage />
              </FormItem>
              <Separator />
              <FormField
                control={form.control}
                name="auditEffect"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effect of Audit</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the effect of the audit finding..."
                        className="h-24 resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Effect Attachments</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    multiple
                    {...register('auditEffectAttachments' as any)}
                  />
                </FormControl>
                {auditEffectAttachments &&
                  Array.from(auditEffectAttachments).map(
                    (file: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>{file.name}</span>
                      </div>
                    )
                  )}
                <FormMessage />
              </FormItem>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Mitigation</h3>
              </div>
              <FormField
                control={form.control}
                name="mitigationPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Mitigation Plan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Outline the steps to mitigate this risk..."
                        className="h-32 resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Mitigation Attachments</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    multiple
                    {...register('mitigationAttachments' as any)}
                  />
                </FormControl>
                <FormDescription>
                  You can upload multiple files for the mitigation plan.
                </FormDescription>
                {mitigationAttachments &&
                  Array.from(mitigationAttachments).map(
                    (file: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>{file.name}</span>
                      </div>
                    )
                  )}
                <FormMessage />
              </FormItem>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                >
                  Cancel
                </Button>
                <Button type="submit">Log Finding</Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
