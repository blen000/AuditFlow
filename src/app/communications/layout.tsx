import { authorizePage } from '@/lib/authorization';

export default async function CommunicationsLayout({ children }: { children: React.ReactNode }) {
  await authorizePage(['reports_communications_access']);
  return <>{children}</>;
}
