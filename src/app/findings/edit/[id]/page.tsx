import { EditFindingForm } from '@/components/audit/EditFindingForm';
import { mockFindings } from '@/lib/mock-data';

export default function EditFindingPage({ params }: { params: { id: string } }) {
  const finding = mockFindings.find((f) => f.id === params.id);

  if (!finding) {
    return <div>Finding not found</div>;
  }

  return <EditFindingForm finding={finding} />;
}
