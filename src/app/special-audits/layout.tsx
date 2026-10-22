import { authorizePage } from '@/lib/authorization';

export default async function SpecialAuditsLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['reports_special_audits_access', 'special_audits_new_access'], 'any');
  return <>{children}</>;
}
