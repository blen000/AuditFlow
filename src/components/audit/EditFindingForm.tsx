'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
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
import Header from '../layout/Header';
import { useEffect } from 'react';

const formSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }),
  details: z.string().min(20, {
    message: 'Finding details must be at least 20 characters.',
  }),
  riskLevel: z.enum(['High', 'Medium', 'Low'], {
    required_error: 'You need to select a risk level.',
  }),
  mitigationPlan: z.string().optional(),
});

type EditFindingFormProps = {
  finding: AuditFinding;
};

export function EditFindingForm({ finding }: EditFindingFormProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      details: '',
      mitigationPlan: '',
    },
  });

  useEffect(() => {
    if (finding) {
      form.reset({
        title: finding.title,
        details: finding.details,
        riskLevel: finding.riskLevel,
        mitigationPlan: finding.mitigationPlan,
      });
    }
  }, [finding, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedFinding: AuditFinding = {
      ...finding,
      ...values,
      mitigationPlan: values.mitigationPlan || '',
    };
    // In a real app, you'd save this to a database
    console.log('Updated Finding:', updatedFinding);
    router.push('/');
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Edit Audit Finding
          </h2>
          <p className="mb-6 text-muted-foreground">
            Update the details for this audit finding.
          </p>
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
                          {(['High', 'Medium', 'Low'] as RiskLevel[]).map(
                            (level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Mitigation</h3>
              </div>

              <FormField
                control={form.control}
                name="mitigationPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mitigation Plan</FormLabel>
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
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
