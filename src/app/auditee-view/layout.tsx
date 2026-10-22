import { authorizePage } from '@/lib/authorization';
import { AUDITEE_VIEW_PAGE_PERMISSIONS } from '@/lib/permissions';

export default async function AuditeeViewLayout({ children }: { children: React.ReactNode }) {
  await authorizePage([...AUDITEE_VIEW_PAGE_PERMISSIONS], 'any');
  return <>{children}</>;
}
