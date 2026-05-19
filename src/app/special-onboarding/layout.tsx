import { authorizePage } from '@/lib/authorization';

export default async function SpecialOnboardingLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['special_onboarding_access']);
  return <>{children}</>;
}
