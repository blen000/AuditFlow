import { authorizePage } from '@/lib/authorization';

export default async function ConsolidatedReportLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['reports_consolidated_access']);
  return <>{children}</>;
}
