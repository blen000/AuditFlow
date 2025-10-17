'use client';
import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuditFindingCard } from '@/components/audit/AuditFindingCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { AuditFinding, Branch } from '@/types';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function AuditeeViewPage() {
  const firestore = useFirestore();
  const branchesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'branches') : null),
    [firestore]
  );
  const { data: branches } = useCollection<Branch>(branchesQuery);

  const findingsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'findings') : null),
    [firestore]
  );
  const { data: findings } = useCollection<AuditFinding>(findingsQuery);

  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    // This would be a call to delete a document in a real app
    console.log(`Deleting finding ${id}`);
  };

  const handleUpdate = (id: string, updates: Partial<AuditFinding>) => {
    if (!firestore) return;
    const findingRef = doc(firestore, 'findings', id);
    updateDocumentNonBlocking(findingRef, updates);
  };

  const filteredFindings =
    selectedBranch && findings
      ? findings.filter(
          (finding) => finding.branchOrDepartment === selectedBranch
        )
      : [];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader
        title="Auditee Response View"
        description="Select your branch/department to view and respond to findings."
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:w-64">
              <Select onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch/department" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedBranch && (
            <Card>
              <CardHeader>
                <CardTitle>Findings for {selectedBranch}</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredFindings.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredFindings.map((finding) => (
                      <AuditFindingCard
                        key={finding.id}
                        finding={finding}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    No findings for this branch/department.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
