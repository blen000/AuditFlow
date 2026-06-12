'use client';

import { useState } from 'react';
import { getCsrfToken } from '@/lib/csrf';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Your new password and confirmation do not match.",
      });
      return;
    }

    if (passwords.new.length < 12) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "New password must be at least 12 characters long.",
      });
      return;
    }

    // Call server API to persist the change
    (async () => {
      try {
        const csrfToken = await getCsrfToken();
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          credentials: 'include',
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
          toast({ variant: 'destructive', title: 'Update Failed', description: result.error || 'Could not update password.' });
          return;
        }

        toast({ title: 'Password Updated', description: 'Your account credentials have been successfully updated.' });
        onOpenChange(false);
        setPasswords({ current: '', new: '', confirm: '' });
      } catch (err) {
        console.error('Change password error:', err);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Server error while updating password.' });
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Update Credentials
          </DialogTitle>
          <DialogDescription>
            Ensure your account remains secure by using a strong, unique password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="current-pass" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Current Password</Label>
            <div className="relative">
              <Input 
                id="current-pass"
                type={showCurrent ? 'text' : 'password'}
                required
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-pass" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">New Secure Password</Label>
            <div className="relative">
              <Input
                id="new-pass"
                type={showNew ? 'text' : 'password'}
                required
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground ml-1">Min. 12 chars, A–Z, a–z, 0–9, and a special character (!@#$%…)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-pass" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Confirm New Password</Label>
            <div className="relative">
              <Input 
                id="confirm-pass"
                type={showConfirm ? 'text' : 'password'}
                required
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
