import { getFindingById } from '@/app/actions/findings';
import { EditFindingForm } from '@/components/audit/EditFindingForm';
import { notFound } from 'next/navigation';

export default async function EditFindingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
