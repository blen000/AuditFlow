import { authorizePage } from '@/lib/authorization';

export default async function SpecialFindingCategoriesLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['settings_special_finding_categories_access']);
  return <>{children}</>;
}
