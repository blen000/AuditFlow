'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Info, Loader2 } from 'lucide-react';
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
import { useAuth } from '@/context/AuthContext';
import HangingBadge from '@/components/HangingBadge';
import {
  withAdminPermissions,
  AUDIT_REPORTS_HUB_PERMISSIONS,
  SYSTEM_SETTINGS_PERMISSIONS,
} from '@/lib/permissions';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ❗ Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await res.json();

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: result.error || 'Invalid credentials. Try using the demo credentials.',
        });
        return;
      }

      // server returns user with role and permissions
      login(result.user);

      toast({
        title: 'Welcome back!',
        description: `Authentication successful.`,
      });

      // Compute first allowed path for this user and redirect there.
      const effectivePermissions = withAdminPermissions(
        result.user.role,
        result.user.permissions || []
      );

      const getFirstAllowed = () => {
        if (effectivePermissions.includes('dashboard_access')) return '/dashboard';
        if (effectivePermissions.includes('auditee_view_access')) return '/auditee-view';
        if (AUDIT_REPORTS_HUB_PERMISSIONS.some((p) => effectivePermissions.includes(p))) return '/reports';
        if (effectivePermissions.includes('findings_new_access')) return '/findings/new';
        if (effectivePermissions.includes('special_audits_new_access')) return '/special-audits/new';
        if (effectivePermissions.includes('users_manage_access')) return '/users';
        if (effectivePermissions.includes('roles_manage_access')) return '/roles';
        if (effectivePermissions.includes('register_user_access')) return '/register';
        if (effectivePermissions.includes('special_onboarding_access')) return '/special-onboarding';
        if (SYSTEM_SETTINGS_PERMISSIONS.some((p) => effectivePermissions.includes(p))) return '/settings';
        return '/dashboard';
      };

      const redirectPath = getFirstAllowed();
      router.replace(redirectPath);
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'An unexpected error occurred during authentication.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-4"
      style={{
        backgroundColor: '#f6f3ee',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='104' viewBox='0 0 120 104'%3E%3Cdefs%3E%3Cpattern id='honeycomb' width='120' height='104' patternUnits='userSpaceOnUse'%3E%3Cpath d='M30 0 L60 17 L60 52 L30 69 L0 52 L0 17 Z' fill='none' stroke='%23e6e2db' stroke-width='1.5' stroke-opacity='0.55'/%3E%3Cpath d='M90 0 L120 17 L120 52 L90 69 L60 52 L60 17 Z' fill='none' stroke='%23e6e2db' stroke-width='1.5' stroke-opacity='0.55'/%3E%3Cpath d='M60 52 L90 69 L90 104 L60 121 L30 104 L30 69 Z' fill='none' stroke='%23e6e2db' stroke-width='1.5' stroke-opacity='0.55'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23honeycomb)'/%3E%3C/svg%3E\")",
        backgroundSize: '120px 104px',
        backgroundRepeat: 'repeat',
        backgroundPosition: 'top left',
      }}
    >
      <HangingBadge />
      {/* Login Card */}
      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
        <CardContent className="p-5 md:p-6">
          <div className="mb-4 flex items-center justify-center gap-3">
            <img src="/Logo.png" alt="Nib logo" className="h-10 w-10 rounded-full object-cover shadow-lg" />
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-[#8b4513] tracking-tight leading-none">Nib Audit</span>
              <div className="h-0.5 w-full bg-[#8b4513] mt-1 opacity-35" />
            </div>
          </div>

          <div className="text-center space-y-2 mb-6">
            <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight">Welcome </h1>
            {/*<h2 className="text-3xl font-black text-[#1a1a1a] tracking-tight">Nib Audit</h2>*/}
            <p className="text-sm text-gray-500 mt-2 px-4 leading-relaxed">
              Enter your credentials to access the secure internal audit platform.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#8b4513] ml-1">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="e.g., user@nibbank.com" 
                            className="h-14 pl-12 rounded-xl bg-gray-50 border-gray-100 focus:ring-[#8b4513] focus:border-[#8b4513]" 
                            {...field} 
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#8b4513] ml-1">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••" 
                            className="h-14 pl-12 pr-12 rounded-xl bg-gray-50 border-gray-100 focus:ring-[#8b4513] focus:border-[#8b4513]" 
                            {...field} 
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            disabled={isSubmitting}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-bold rounded-xl bg-[#8b4513] hover:bg-[#6d350f] text-white shadow-xl shadow-[#8b4513]/20 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</> : 'Log In Securely'}
              </Button>
            </form>
          </Form>

          {/* Demo credentials removed per request */}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <div className="flex items-center justify-center gap-2">
              {/*<img src="/Nib%20logo.png" alt="Nib logo" className="h-4 w-4" />*/}
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
                © 2026 NIB. All rights reserved.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
