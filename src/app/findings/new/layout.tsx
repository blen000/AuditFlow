import { authorizePage } from '@/lib/authorization';

export default async function NewFindingLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['findings_new_access']);
  return <>{children}</>;
}
