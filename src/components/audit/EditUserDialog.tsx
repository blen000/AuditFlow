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
import { ScrollArea } from '@/components/ui/scroll-area';
import type { User } from '@/types';
import { UserCheck, Mail } from 'lucide-react';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Invalid email address.'),
});

type EditUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<User>) => void;
  user: User | null;
};

export function EditUserDialog({
  open,
  onOpenChange,
  onSubmit,
  user,
}: EditUserDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
    },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({
        fullName: user.fullName,
        email: user.email,
      });
    }
  }, [user, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update the identity details for this personnel record.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@bank.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
