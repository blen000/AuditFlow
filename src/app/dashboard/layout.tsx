import { authorizePage } from '@/lib/authorization';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['dashboard_access']);
  return <>{children}</>;
}
