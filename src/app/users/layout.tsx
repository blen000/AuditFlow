import { authorizePage } from '@/lib/authorization';

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['users_manage_access']);
  return <>{children}</>;
}
