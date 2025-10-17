'use client';
import { use } from 'react';
import { EditFindingForm } from '@/components/audit/EditFindingForm';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { AuditFinding } from '@/types';
import { doc } from 'firebase/firestore';

export default function EditFindingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const firestore = useFirestore();
  const findingRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'findings', id) : null),
    [firestore, id]
  );
  const { data: finding, isLoading } = useDoc<AuditFinding>(findingRef);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!finding) {
    return <div>Finding not found</div>;
  }

  return <EditFindingForm finding={finding} />;
}
