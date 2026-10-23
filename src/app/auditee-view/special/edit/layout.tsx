import { authorizePage } from '@/lib/authorization';
import { SPECIAL_AUDITEE_VIEW_PERMISSION } from '@/lib/permissions';

// Editing a special audit case needs the Special Auditee View AND its Edit Finding action.
export default async function SpecialAuditEditLayout({ children }: { children: React.ReactNode }) {
  await authorizePage([SPECIAL_AUDITEE_VIEW_PERMISSION, 'auditee_special_edit_finding']);
  return <>{children}</>;
}
