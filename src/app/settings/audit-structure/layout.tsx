import { authorizePage } from '@/lib/authorization';

export default async function AuditStructureLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['settings_audit_structure_access']);
  return <>{children}</>;
}
