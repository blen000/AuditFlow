
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { AddEditRiskLevelDialog } from '@/components/audit/AddEditRiskLevelDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { RiskLevelData } from '@/types';
import { initialRiskLevels } from '@/lib/mock-data';

export default function RiskLevelsPage() {
  const [riskLevels, setRiskLevels] = useState<RiskLevelData[]>(initialRiskLevels);

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
    if (editingRiskLevel && editingRiskLevel.id) {
      setRiskLevels(prev => prev.map(r => r.id === editingRiskLevel.id ? { ...r, ...riskLevelData } : r));
    } else {
      const newRiskLevel = { ...riskLevelData, id: `RISK-${Date.now()}` };
      setRiskLevels(prev => [...prev, newRiskLevel]);
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
                  {riskLevels.map((riskLevel) => (
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
