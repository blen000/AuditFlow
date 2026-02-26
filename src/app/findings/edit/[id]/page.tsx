
'use client';
import { use, useState } from 'react';
import { EditFindingForm } from '@/components/audit/EditFindingForm';
import { AuditFinding } from '@/types';
import { initialFindings } from '@/lib/mock-data';

export default function EditFindingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [finding] = useState<AuditFinding | undefined>(initialFindings.find(f => f.id === id));

  if (!finding) {
    return <div>Finding not found</div>;
  }

  return <EditFindingForm finding={finding} />;
}
