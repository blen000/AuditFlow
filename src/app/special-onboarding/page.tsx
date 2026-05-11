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
import { ShieldCheck, Mail, UserCheck, Star, Lock, Loader2 } from 'lucide-react';
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
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.string().min(1, 'Executive role is required.'),
  status: z.string().min(1, 'Status is required.'),
});

export default function SpecialOnboardingPage() {
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
      password: '',
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
        toast({
          variant: "destructive",
          title: "Synchronization Error",
          description: "Could not retrieve leadership roles from the database."
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadRoles();
  }, [toast]);

  // Only show roles flagged as special/executive
  const specialRoles = roles.filter(role => role.isSpecial === true);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await createUser(values);
      if (result.success) {
        toast({ title: "Special Registration Successful", description: `Executive account for ${values.fullName} created.` });
        router.push('/users');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Provisioning Error", 
        description: error.message || "Failed to provision executive account." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Executive Portal...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Special Onboarding" 
        description="Register high-level organizational leadership and executive roles in the live database."
        backHref="/settings"
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-2xl">
          <Card className="border-t-4 border-t-amber-500 shadow-xl overflow-hidden">
            <div className="bg-amber-500/10 py-3 px-6 border-b flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Executive Access Management</span>
            </div>
            <CardHeader className="text-center pb-8 border-b bg-muted/20">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold uppercase tracking-tight">Executive Onboarding</CardTitle>
              <CardDescription>Provision accounts for board members, chiefs, and executive leadership.</CardDescription>
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
                            <Input placeholder="Full Legal Name" {...field} />
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
                            Official Email Address
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="executive.name@bank.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          Secure Login Password
                        </FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="Assign a secure password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-600" />
                            Executive Role
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-amber-200 focus:ring-amber-500">
                                <SelectValue placeholder="Select executive role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {specialRoles.length > 0 ? (
                                specialRoles.map((role) => (
                                  <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-xs text-muted-foreground text-center">No special roles defined in database.</div>
                              )}
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
                    <Button type="submit" className="px-8 bg-amber-600 hover:bg-amber-700 text-white" disabled={isSubmitting || specialRoles.length === 0}>
                      {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning...</> : 'Provision Account'}
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
