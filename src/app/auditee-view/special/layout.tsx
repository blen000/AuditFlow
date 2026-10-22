import { authorizePage } from '@/lib/authorization';
import { SPECIAL_AUDITEE_VIEW_PERMISSION } from '@/lib/permissions';

// Every route under /auditee-view/special is part of the Special Auditee View.
export default async function SpecialAuditeeViewLayout({ children }: { children: React.ReactNode }) {
  await authorizePage([SPECIAL_AUDITEE_VIEW_PERMISSION]);
  return <>{children}</>;
}
