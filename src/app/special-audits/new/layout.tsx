import { authorizePage } from '@/lib/authorization';

export default async function NewSpecialAuditLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['special_audits_new_access']);
  return <>{children}</>;
}
