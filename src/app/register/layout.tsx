import { authorizePage } from '@/lib/authorization';

export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['register_user_access']);
  return <>{children}</>;
}
