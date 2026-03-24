'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  Calendar, 
  Lock, 
  LogOut,
  ChevronRight,
  UserCircle
} from 'lucide-react';
import { initialUsers } from '@/lib/mock-data';
import type { User as UserType } from '@/types';
import { ChangePasswordDialog } from '@/components/audit/ChangePasswordDialog';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isPassDialogOpen, setPassDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simulate getting logged in user (Admin User)
    setCurrentUser(initialUsers[0]);
  }, []);

  const handleLogout = () => {
    router.push('/login');
  };

  if (!mounted || !currentUser) return null;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="User Profile" 
        description="Manage your identity, organizational details, and security settings."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Identity Card */}
            <div className="md:col-span-1 space-y-6">
              <Card className="border-t-4 border-t-primary shadow-lg overflow-hidden text-center">
                <CardHeader className="bg-muted/30 pb-8">
                  <div className="mx-auto mb-4 relative">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <UserCircle className="h-16 w-16 text-primary opacity-80" />
                    </div>
                    <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary px-3">
                      {currentUser.role}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold">{currentUser.fullName}</CardTitle>
                  <CardDescription className="flex items-center justify-center gap-1.5 mt-1">
                    <Mail className="h-3 w-3" />
                    {currentUser.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-3">
                    <Button variant="outline" className="w-full justify-start gap-3" onClick={() => setPassDialogOpen(true)}>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Change Password
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                      Logout Securely
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/20 border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" /> System Status
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Account Status</span>
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member Since</span>
                    <span className="text-xs font-mono text-muted-foreground">{currentUser.dateJoined}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Organizational Details */}
            <div className="md:col-span-2 space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Organizational Assignment
                  </CardTitle>
                  <CardDescription>Your current placement within the bank's hierarchy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5 p-4 rounded-lg bg-muted/30 border border-muted-foreground/10">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> Assigned District
                      </label>
                      <p className="text-lg font-bold text-foreground">{currentUser.district || 'Not Assigned'}</p>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-lg bg-muted/30 border border-muted-foreground/10">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" /> Branch / Department
                      </label>
                      <p className="text-lg font-bold text-foreground">{currentUser.branch || 'Not Assigned'}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profile Overview</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Assigned Role</p>
                            <p className="text-xs text-muted-foreground">Functional permissions level</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-primary/20 text-primary font-bold">
                          {currentUser.role}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Joined Date</p>
                            <p className="text-xs text-muted-foreground">Initial onboarding timestamp</p>
                          </div>
                        </div>
                        <span className="text-sm font-mono font-medium">{currentUser.dateJoined}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t justify-end p-4">
                  <p className="text-[10px] text-muted-foreground italic">Contact Admin Support if your assignment details are incorrect.</p>
                </CardFooter>
              </Card>

              <div className="bg-accent/5 p-6 rounded-xl border border-accent/20 flex gap-4">
                <ShieldCheck className="h-6 w-6 text-accent shrink-0" />
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-accent-foreground">Account Integrity</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your account is governed by the Internal Audit Department security protocols. All profile changes are logged for auditing purposes. Ensure you logout before leaving your terminal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ChangePasswordDialog 
        open={isPassDialogOpen}
        onOpenChange={setPassDialogOpen}
      />
    </div>
  );
}
