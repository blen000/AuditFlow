'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useEffect, useState, useTransition } from 'react';
import { suggestRiskMitigation } from '@/ai/flows/suggest-risk-mitigation';
import { useToast } from '@/hooks/use-toast';
import { Loader, Sparkles } from 'lucide-react';
import { Separator } from '../ui/separator';

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

type LogFindingDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (finding: AuditFinding) => void;
  finding?: AuditFinding | null;
};

export function LogFindingDialog({
  isOpen,
  onOpenChange,
  onSave,
  finding,
}: LogFindingDialogProps) {
  const [isAiLoading, startAiTransition] = useTransition();
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

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
      setAiSuggestions([]);
    } else {
      form.reset({
        title: '',
        details: '',
        mitigationPlan: '',
        riskLevel: undefined,
      });
      setAiSuggestions([]);
    }
  }, [finding, isOpen, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newFinding: AuditFinding = {
      ...(finding || {
        id: `FIND-${Date.now()}`,
        status: 'Open',
      }),
      ...values,
      mitigationPlan: values.mitigationPlan || '',
    };
    onSave(newFinding);
    onOpenChange(false);
  }

  const handleSuggestMitigation = () => {
    const findingDetails = form.getValues('details');
    const riskLevel = form.getValues('riskLevel');

    if (!findingDetails || !riskLevel) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description:
          'Please provide Finding Details and Risk Level for AI suggestions.',
      });
      return;
    }

    startAiTransition(async () => {
      try {
        const result = await suggestRiskMitigation({
          findingDetails,
          riskLevel,
        });
        setAiSuggestions(result.mitigationSuggestions);
      } catch (error) {
        console.error('AI Mitigation Suggestion Error:', error);
        toast({
          variant: 'destructive',
          title: 'AI Suggestion Failed',
          description: 'There was an error getting suggestions. Please try again.',
        });
      }
    });
  };

  const applySuggestion = (suggestion: string) => {
    const currentPlan = form.getValues('mitigationPlan') || '';
    form.setValue('mitigationPlan', `${currentPlan}\n- ${suggestion}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {finding ? 'Edit Audit Finding' : 'Log New Audit Finding'}
          </DialogTitle>
          <DialogDescription>
            {finding
              ? "Update the details for this audit finding."
              : "Log a new audit finding for your team to address."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            
            <Button
              type="button"
              variant="outline"
              onClick={handleSuggestMitigation}
              disabled={isAiLoading}
            >
              {isAiLoading ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Suggest Mitigations with AI
            </Button>

            {isAiLoading && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin"/>
                    <span>Generating suggestions...</span>
                </div>
            )}
            
            {aiSuggestions.length > 0 && (
              <div className="space-y-2 rounded-lg border bg-secondary/30 p-4">
                <h4 className="font-semibold">AI Suggestions:</h4>
                <ul className="list-disc space-y-1 pl-5">
                  {aiSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span className="text-sm">{suggestion}</span>
                      <Button size="sm" variant="ghost" onClick={() => applySuggestion(suggestion)}>Apply</Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <DialogFooter>
              <Button type="submit">
                {finding ? 'Save Changes' : 'Log Finding'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
