import { authorizePage } from '@/lib/authorization';

export default async function BranchesLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['settings_branches_access']);
  return <>{children}</>;
}
