import { getFindingById } from '@/app/actions/findings';
import { EditFindingForm } from '@/components/audit/EditFindingForm';
import { getUserFromCookiesServer } from '@/lib/serverAuth';
import { withAdminPermissions } from '@/lib/permissions';
import { notFound, redirect } from 'next/navigation';

export default async function EditFindingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const currentUser = await getUserFromCookiesServer();
  if (!currentUser) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/findings/edit/${id}`));
  }
  const effectivePermissions = withAdminPermissions(
    currentUser.role?.name,
    currentUser.role?.permissions ?? []
  );
  if (
    currentUser.role?.name !== 'Admin' &&
    !effectivePermissions.includes('auditee_view_edit_finding') &&
    !effectivePermissions.includes('findings_new_access')
  ) {
    notFound();
  }

  const finding = await getFindingById(id);

  if (!finding) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <EditFindingForm finding={finding as any} />
    </div>
  );
}
