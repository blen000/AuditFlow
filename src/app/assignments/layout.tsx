import { authorizePage } from '@/lib/authorization';

export default async function AssignmentsLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['reports_assignments_access']);
  return <>{children}</>;
}
