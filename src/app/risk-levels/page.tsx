'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddEditRiskLevelDialog } from '@/components/audit/AddEditRiskLevelDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { RiskLevelData } from '@/types';
import { getRiskLevels, createRiskLevel, updateRiskLevel } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';

export default function RiskLevelsPage() {
  const { toast } = useToast();
  const [riskLevels, setRiskLevels] = useState<RiskLevelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingRiskLevel, setEditingRiskLevel] = useState<RiskLevelData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getRiskLevels();
        setRiskLevels(data as any);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Sync Error' });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const handleAddNew = () => {
    setEditingRiskLevel(null);
    setDialogOpen(true);
  };

  const handleEdit = (riskLevel: RiskLevelData) => {
    setEditingRiskLevel(riskLevel);
    setDialogOpen(true);
  };

  const handleSubmit = async (riskLevelData: RiskLevelData) => {
    try {
      if (editingRiskLevel && editingRiskLevel.id) {
        await updateRiskLevel(editingRiskLevel.id, riskLevelData);
        toast({ title: 'Risk Level updated' });
      } else {
        await createRiskLevel(riskLevelData);
        toast({ title: 'Risk Level created' });
      }
      const freshData = await getRiskLevels();
      setRiskLevels(freshData as any);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save failed' });
    }
    setEditingRiskLevel(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PageHeader
          title="Risk Levels"
          description="View and manage your organization's risk levels in the live database."
          backHref="/settings"
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
