'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
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
import HangingBadge from '@/components/HangingBadge';

const resetPasswordFormSchema = z
  .object({
    newPassword: z.string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Must include uppercase')
      .regex(/[a-z]/, 'Must include lowercase')
      .regex(/[0-9]/, 'Must include a number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must include a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

function ResetPasswordCard() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof resetPasswordFormSchema>>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: z.infer<typeof resetPasswordFormSchema>) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ token, newPassword: values.newPassword }),
      });

      const result = await res.json();

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Unable to reset password',
          description: result.error || 'Please request a new reset link.',
        });
        return;
      }

      setSuccess(true);
      setTimeout(() => router.replace('/login'), 3000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Unable to process your request right now. Please try again shortly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
      <CardContent className="p-5 md:p-6">
        <div className="mb-4 flex items-center justify-center gap-3">
          <img src="/Logo.png" alt="Nib logo" className="h-10 w-10 rounded-full object-cover shadow-lg" />
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-[#8b4513] tracking-tight leading-none">Nib Audit</span>
            <div className="h-0.5 w-full bg-[#8b4513] mt-1 opacity-35" />
          </div>
        </div>

        {!token ? (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <ShieldAlert className="h-7 w-7 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Invalid link</h1>
            <p className="text-sm text-gray-500 px-4 leading-relaxed">
              This password reset link is missing or malformed. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8b4513] hover:underline pt-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Request a new link
            </Link>
          </div>
        ) : success ? (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Password reset</h1>
            <p className="text-sm text-gray-500 px-4 leading-relaxed">
              Your password has been updated. Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight">Reset password</h1>
              <p className="text-sm text-gray-500 mt-2 px-4 leading-relaxed">
                Choose a new password for your account.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#8b4513] ml-1">New Password</FormLabel>
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#8b4513] ml-1">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="h-14 pl-12 pr-12 rounded-xl bg-gray-50 border-gray-100 focus:ring-[#8b4513] focus:border-[#8b4513]"
                            {...field}
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            disabled={isSubmitting}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-[#8b4513] hover:bg-[#6d350f] text-white shadow-xl shadow-[#8b4513]/20 transition-all active:scale-[0.98] disabled:bg-gray-300 disabled:shadow-none disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Resetting...</>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8b4513] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to login
              </Link>
            </div>
          </>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
              © 2026 NIB. All rights reserved.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
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
      <Suspense
        fallback={
          <div className="w-full max-w-md flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#8b4513]" />
          </div>
        }
      >
        <ResetPasswordCard />
      </Suspense>
    </div>
  );
}
