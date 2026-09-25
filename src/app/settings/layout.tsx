import { authorizePage } from '@/lib/authorization';
import { SYSTEM_SETTINGS_PERMISSIONS } from '@/lib/permissions';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  // Any single Settings permission is enough to open the section; individual
  // sub-pages enforce their own specific permission in their own layout.
  await authorizePage(SYSTEM_SETTINGS_PERMISSIONS as unknown as string[], 'any');
  return <>{children}</>;
}
