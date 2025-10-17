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
import type { AuditFinding, Branch, RiskLevelData } from '@/types';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import PageHeader from '../layout/PageHeader';
import { Paperclip, PlusCircle, Trash2 } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection } from 'firebase/firestore';

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
        ownerName: z.string().min(1, 'Owner name is required.'),
      })
    )
    .optional(),
  // We'll handle files separately, not through zod for now
});

export function CreateFindingForm() {
  const router = useRouter();
  const firestore = useFirestore();

  const branchesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'branches') : null),
    [firestore]
  );
  const { data: branches } = useCollection<Branch>(branchesQuery);

  const riskLevelsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'riskLevels') : null),
    [firestore]
  );
  const { data: riskLevels } = useCollection<RiskLevelData>(riskLevelsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      details: '',
      auditCause: '',
      auditEffect: '',
      recommendation: '',
      involvedAmounts: [],
      involvedCases: [],
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

  const { register } = form;
  const findingAttachments = form.watch('findingAttachments' as any);
  const auditCauseAttachments = form.watch('auditCauseAttachments' as any);
  const auditEffectAttachments = form.watch('auditEffectAttachments' as any);
  const recommendationAttachments = form.watch(
    'recommendationAttachments' as any
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    const findingAttachmentFiles = findingAttachments as FileList | undefined;
    const auditCauseAttachmentFiles =
      auditCauseAttachments as FileList | undefined;
    const auditEffectAttachmentFiles =
      auditEffectAttachments as FileList | undefined;
    const recommendationAttachmentFiles =
      recommendationAttachments as FileList | undefined;

    const newFinding: Omit<AuditFinding, 'id'> = {
      status: 'Open',
      auditeeAgreement: 'Pending',
      ...values,
      riskLevel: values.riskLevel,
      recommendation: values.recommendation || '',
      involvedCases:
        values.involvedCases?.map((c) => ({
          ...c,
          id: `CASE-${Date.now()}-${Math.random()}`,
          status: 'Open',
        })) || [],
      findingAttachments: findingAttachmentFiles
        ? Array.from(findingAttachmentFiles).map((file) => file.name)
        : [],
      auditCauseAttachments: auditCauseAttachmentFiles
        ? Array.from(auditCauseAttachmentFiles).map((file) => file.name)
        : [],
      auditEffectAttachments: auditEffectAttachmentFiles
        ? Array.from(auditEffectAttachmentFiles).map((file) => file.name)
        : [],
      recommendationAttachments: recommendationAttachmentFiles
        ? Array.from(recommendationAttachmentFiles).map((file) => file.name)
        : [],
    };

    const findingsCollection = collection(firestore, 'findings');
    addDocumentNonBlocking(findingsCollection, newFinding);

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
                          {riskLevels?.map((level) => (
                            <SelectItem key={level.id} value={level.name}>
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
                          {branches?.map((branch) => (
                            <SelectItem key={branch.id} value={branch.name}>
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
                {amountFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="mt-2 flex items-end gap-2 rounded-md border p-4"
                  >
                    <FormField
                      control={form.control}
                      name={`involvedAmounts.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Initial Shortage"
                              {...field}
                            />
                          </FormControl>
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
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 150.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeAmount(index)}
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
                  onClick={() => appendAmount({ name: '', amount: 0 })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Amount
                </Button>
              </div>

              <Separator />
              <div>
                <h3 className="text-lg font-semibold">Involved Cases</h3>
                {caseFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="mt-2 flex items-end gap-2 rounded-md border p-4"
                  >
                    <FormField
                      control={form.control}
                      name={`involvedCases.${index}.ownerName`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Case Owner / Customer</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeCase(index)}
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
                  onClick={() => appendCase({ ownerName: '' })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Case
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
                <h3 className="text-lg font-semibold">Recommendation</h3>
              </div>
              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Recommendation</FormLabel>
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
                <FormLabel>Recommendation Attachments</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    multiple
                    {...register('recommendationAttachments' as any)}
                  />
                </FormControl>
                <FormDescription>
                  You can upload multiple files for the recommendation.
                </FormDescription>
                {recommendationAttachments &&
                  Array.from(recommendationAttachments).map(
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
