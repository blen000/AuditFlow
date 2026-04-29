"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuditDashboard from '@/components/audit/AuditDashboard';
import PageHeader from '@/components/layout/PageHeader';

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const userJson = localStorage.getItem('currentUser');
      const hasUser = !!userJson;
      if (!authStatus || !hasUser) {
        router.replace('/login');
        return;
      }
    } catch (e) {
      router.replace('/login');
      return;
    } finally {
      setChecked(true);
    }
  }, [router]);

  if (!checked) return null;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader title="Dashboard" />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
        <AuditDashboard />
      </main>
    </div>
  );
}
