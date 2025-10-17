import AuditDashboard from '@/components/audit/AuditDashboard';
import PageHeader from '@/components/layout/PageHeader';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader title="Dashboard" />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
        <AuditDashboard />
      </main>
    </div>
  );
}
