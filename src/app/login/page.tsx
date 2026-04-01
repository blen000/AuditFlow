
'use client';

import { useState } from 'react';
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
import { loginUser } from '@/app/actions/users';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const result = await loginUser(values);

      if (result.success && result.user) {
        // Set authentication flag and user info in localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        
        toast({
          title: "Access Granted",
          description: `Welcome back, ${result.user.fullName}.`,
        });
        
        // Use window.location for a harder refresh to initialize layout with user state
        window.location.href = '/';
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: result.error || "Invalid credentials.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: "An unexpected error occurred during authentication.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#4a2c10] p-4">
      {/* Logo Area */}
      <div className="mb-12 flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
            <div className="h-6 w-6 rounded-full bg-[#4a2c10]/20 flex items-center justify-center">
              <div className="h-3 w-3 bg-white rounded-full transform -translate-y-1 translate-x-1" />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-white tracking-tight leading-none">Nib Audit</span>
          <div className="h-0.5 w-full bg-yellow-500 mt-1 opacity-50" />
        </div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-[450px] rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
        <CardContent className="p-10 md:p-12">
          <div className="text-center space-y-2 mb-10">
            <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight">Welcome to</h1>
            <h2 className="text-3xl font-black text-[#1a1a1a] tracking-tight">Nib Audit</h2>
            <p className="text-sm text-gray-500 mt-4 px-4 leading-relaxed">
              Enter your credentials to access the secure internal audit platform.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#8b4513] ml-1">Secure Protocol: Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="e.g., admin@auditflow.com" 
                            className="h-14 pl-12 rounded-xl bg-gray-50 border-gray-100 focus:ring-[#8b4513] focus:border-[#8b4513]" 
                            {...field} 
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#8b4513] ml-1">Authentication: Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••" 
                            className="h-14 pl-12 pr-12 rounded-xl bg-gray-50 border-gray-100 focus:ring-[#8b4513] focus:border-[#8b4513]" 
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

          {/* Demo Credentials Helper */}
          <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-dashed text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2 mb-1 font-bold text-primary uppercase tracking-tight">
              <Info className="h-3 w-3" /> System Access Note
            </div>
            <p className="leading-relaxed">Use your registered organizational email and password. Access is restricted to authorized personnel only.</p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-yellow-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
                Your information is securely encrypted.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
