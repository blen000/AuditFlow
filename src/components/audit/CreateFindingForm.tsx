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
import type { AuditFinding, RiskLevel } from '@/types';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import PageHeader from '../layout/PageHeader';
import { branches } from '@/lib/branches';
import { riskLevels } from '@/lib/risk-levels';
import { Paperclip } from 'lucide-react';

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
  mitigationPlan: z.string().optional(),
  // We'll handle files separately, not through zod for now
});

export function CreateFindingForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      details: '',
      mitigationPlan: '',
    },
  });

  const { register } = form;
  const findingAttachments = form.watch('findingAttachments' as any);
  const mitigationAttachments = form.watch('mitigationAttachments' as any);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const findingAttachmentFiles = findingAttachments as FileList | undefined;
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
                          {riskLevels.map(
                            (level) => (
                              <SelectItem key={level.name} value={level.name}>
                                {level.name}
                              </SelectItem>
                            )
                          )}
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
                  Array.from(findingAttachments).map((file: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span>{file.name}</span>
                    </div>
                  ))}
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
