
'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  MapPin, 
  Lock, 
  LogOut,
  UserCircle,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { ChangePasswordDialog } from '@/components/audit/ChangePasswordDialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user: currentUser, logout } = useAuth();
  const [isPassDialogOpen, setPassDialogOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Identity Profile" 
        description="Official credentials and organizational placement records."
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
                    <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary px-3 uppercase text-[10px] font-bold">
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
                    <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                      <LogOut className="h-4 w-4" />
                      Logout Securely
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/20 border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" /> Security Status
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Account</span>
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Joined</span>
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
                    Organizational Placement
                  </CardTitle>
                  <CardDescription>Verified unit assignment from the audit database.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5 p-4 rounded-lg bg-muted/30 border border-muted-foreground/10">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> Regional District
                      </label>
                      <p className="text-lg font-bold text-foreground">{currentUser.district || 'Headquarters'}</p>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-lg bg-muted/30 border border-muted-foreground/10">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" /> Branch / Dept
                      </label>
                      <p className="text-lg font-bold text-foreground">{currentUser.branch || 'Head Office'}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System Permissions</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {currentUser.permissions?.map((perm: string) => (
                        <div key={perm} className="flex items-center gap-2 p-2 rounded border bg-muted/10">
                          <ShieldCheck className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-tighter">{perm.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t justify-end p-4">
                  <p className="text-[10px] text-muted-foreground italic">Authenticated access granted based on functional role assignment.</p>
                </CardFooter>
              </Card>
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
