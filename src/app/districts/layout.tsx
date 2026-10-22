import { authorizePage } from '@/lib/authorization';

export default async function DistrictsLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['settings_districts_access']);
  return <>{children}</>;
}
