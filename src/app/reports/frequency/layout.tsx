import { authorizePage } from '@/lib/authorization';

export default async function FrequencyReportLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['reports_frequency_access']);
  return <>{children}</>;
}
