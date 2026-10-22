import { authorizePage } from '@/lib/authorization';

export default async function RiskLevelsLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['settings_risk_levels_access']);
  return <>{children}</>;
}
