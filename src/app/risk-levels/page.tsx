'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { AddEditRiskLevelDialog } from '@/components/audit/AddEditRiskLevelDialog';
import PageHeader from '@/components/layout/PageHeader';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';
import type { RiskLevelData } from '@/types';
import { collection, doc } from 'firebase/firestore';

export default function RiskLevelsPage() {
  const firestore = useFirestore();
  const riskLevelsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'riskLevels') : null),
    [firestore]
  );
  const { data: riskLevels } = useCollection<RiskLevelData>(riskLevelsQuery);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingRiskLevel, setEditingRiskLevel] =
    useState<RiskLevelData | null>(null);

  const handleAddNew = () => {
    setEditingRiskLevel(null);
    setDialogOpen(true);
  };

  const handleEdit = (riskLevel: RiskLevelData) => {
    setEditingRiskLevel(riskLevel);
    setDialogOpen(true);
  };

  const handleSubmit = (riskLevelData: RiskLevelData) => {
    if (!firestore) return;
    if (editingRiskLevel && editingRiskLevel.id) {
      const riskLevelRef = doc(firestore, 'riskLevels', editingRiskLevel.id);
      updateDocumentNonBlocking(riskLevelRef, riskLevelData);
    } else {
      const riskLevelsCollection = collection(firestore, 'riskLevels');
      addDocumentNonBlocking(riskLevelsCollection, riskLevelData);
    }
    setEditingRiskLevel(null);
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PageHeader
          title="Risk Levels"
          description="View and manage your organization's risk levels."
        >
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </PageHeader>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Risk Level List</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {riskLevels?.map((riskLevel) => (
                    <li
                      key={riskLevel.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <span className="font-medium">{riskLevel.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(riskLevel)}
                      >
                        Edit
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <AddEditRiskLevelDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        riskLevel={editingRiskLevel}
      />
    </>
  );
}
