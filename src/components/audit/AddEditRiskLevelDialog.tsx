'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { RiskLevelData } from '@/lib/risk-levels';

const formSchema = z.object({
  name: z.string().min(3, 'Risk Level name must be at least 3 characters.'),
});

type AddEditRiskLevelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (riskLevel: RiskLevelData) => void;
  riskLevel: RiskLevelData | null;
};

export function AddEditRiskLevelDialog({
  open,
  onOpenChange,
  onSubmit,
  riskLevel,
}: AddEditRiskLevelDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (riskLevel) {
      form.reset(riskLevel);
    } else {
      form.reset({ name: '' });
    }
  }, [riskLevel, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{riskLevel ? 'Edit Risk Level' : 'Add New Risk Level'}</DialogTitle>
          <DialogDescription>
            {riskLevel
              ? `Update the details for ${riskLevel.name}.`
              : 'Add a new risk level to your organization.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Level Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Critical"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                Cancel
              </Button>
              <Button type="submit">
                {riskLevel ? 'Save Changes' : 'Add Risk Level'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
