import { authorizePage } from '@/lib/authorization';
import { SYSTEM_SETTINGS_PERMISSIONS } from '@/lib/permissions';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(SYSTEM_SETTINGS_PERMISSIONS as any);
  return <>{children}</>;
}
