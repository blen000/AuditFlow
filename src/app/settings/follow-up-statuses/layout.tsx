import { authorizePage } from '@/lib/authorization';

export default async function FollowUpStatusesLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['settings_follow_up_statuses_access']);
  return <>{children}</>;
}
