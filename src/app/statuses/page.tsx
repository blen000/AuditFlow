'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddEditStatusDialog } from '@/components/audit/AddEditStatusDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { StatusData } from '@/types';
import { getFindingStatuses, createFindingStatus, updateFindingStatus } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';

export default function StatusesPage() {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFindingStatuses();
        setStatuses(data as any);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Sync Error' });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const handleAddNew = () => {
    setEditingStatus(null);
    setDialogOpen(true);
  };

  const handleEdit = (status: StatusData) => {
    setEditingStatus(status);
    setDialogOpen(true);
  };

  const handleSubmit = async (statusData: StatusData) => {
    try {
      if (editingStatus && editingStatus.id) {
        await updateFindingStatus(editingStatus.id, statusData);
        toast({ title: 'Status updated' });
      } else {
        await createFindingStatus(statusData);
        toast({ title: 'Status created' });
      }
      const freshData = await getFindingStatuses();
      setStatuses(freshData as any);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save failed' });
    }
    setEditingStatus(null);
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
          title="Statuses"
          description="View and manage your organization's finding statuses from the live database."
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
                <CardTitle>Status List</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {statuses.map((status) => (
                    <li
                      key={status.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <span className="font-medium">{status.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(status)}
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
      <AddEditStatusDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        status={editingStatus}
      />
    </>
  );
}
