'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Lock, ShieldCheck, Eye, EyeOff, LogOut } from 'lucide-react';
import { logoutUser } from '@/app/actions/users';

export default function ForcePasswordChangePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    router.push('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (passwords.new !== passwords.confirm) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Your new password and confirmation do not match.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('__Secure-csrf_token='))?.split('=')[1] || '';
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          email: user?.email,
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        toast({ 
          variant: 'destructive', 
          title: 'Update Failed', 
          description: result.error || 'Could not update password.' 
        });
        setIsSubmitting(false);
        return;
      }

      toast({ 
        title: 'Success!', 
        description: 'Your password has been updated. You can now access the system.' 
      });
      
      // Update local auth context to reflect that password change is no longer required
      if (user) {
        setUser({ ...user, requirePasswordChange: false });
      }
      
      router.push('/dashboard');
    } catch (err) {
      console.error('Force change password error:', err);
      toast({ 
        variant: 'destructive', 
        title: 'Server Error', 
        description: 'An error occurred while updating your password.' 
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Mandatory Update</CardTitle>
          <CardDescription className="text-center">
            For security reasons, you must change your password before accessing the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pass">Current Temporary Password</Label>
              <div className="relative">
                <Input 
                  id="current-pass"
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-pass">New Strong Password</Label>
              <div className="relative">
                <Input 
                  id="new-pass"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="pr-10"
                  disabled={isSubmitting}
                  placeholder="Min. 12 chars, A-Z, a-z, 0-9, !@#"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pass">Confirm New Password</Label>
              <div className="relative">
                <Input 
                  id="confirm-pass"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password & Continue'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
