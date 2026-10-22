import { authorizePage } from '@/lib/authorization';
import { AUDIT_REPORTS_HUB_PERMISSIONS } from '@/lib/permissions';

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  await authorizePage([...AUDIT_REPORTS_HUB_PERMISSIONS], 'any');
  return <>{children}</>;
}
