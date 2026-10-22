import { authorizePage } from '@/lib/authorization';

export default async function DepartmentsLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['settings_departments_access']);
  return <>{children}</>;
}
