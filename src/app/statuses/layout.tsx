import { authorizePage } from '@/lib/authorization';

export default async function StatusesLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['settings_statuses_access']);
  return <>{children}</>;
}
