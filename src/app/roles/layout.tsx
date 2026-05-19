import { authorizePage } from '@/lib/authorization';

export default async function RolesLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['roles_manage_access']);
  return <>{children}</>;
}
