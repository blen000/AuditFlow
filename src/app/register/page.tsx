'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Mail, ShieldCheck, UserCheck, Lock, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { getRoles, createUser } from '@/app/actions/users';
import type { Role } from '@/types';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Invalid email address.'),
  role: z.string().min(1, 'Role is required.'),
  status: z.string().min(1, 'Status is required.'),
});

export default function UserRegistrationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      role: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await getRoles();
        setRoles(data as any);
      } catch (error) {
        toast({ variant: "destructive", title: "Sync Error", description: "Failed to load roles from database." });
      } finally {
        setIsLoading(false);
      }
    }
    loadRoles();
  }, [toast]);

  const regularRoles = roles.filter(role => !role.isSpecial);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await createUser(values);
      if (result.success) {
        toast({ title: "Registration Successful", description: `${values.fullName} has been added to the database.` });
        router.push('/users');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Role Registry...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="User Registration" 
        description="Onboard new personnel and assign system privileges in the live database."
        backHref="/settings"
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-2xl">
          <Card className="border-t-4 border-t-primary shadow-xl">
            <CardHeader className="text-center pb-8 border-b bg-muted/20">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserPlus className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold uppercase tracking-tight">Personnel Onboarding</CardTitle>
              <CardDescription>Establish a new user account with specific organizational roles.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </div>

                  <div className="rounded-md border p-3 bg-muted/10">
                    <p className="text-sm text-muted-foreground">
                      The system will generate a secure temporary password and email it to the new user's address. They can change it after first login.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            Assigned Role
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {regularRoles.map((role) => (
                                <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={() => router.push('/users')} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Committing...</> : 'Register User'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
