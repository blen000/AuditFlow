'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddEditStatusDialog } from '@/components/audit/AddEditStatusDialog';
import { DeleteConfirmationDialog } from '@/components/audit/DeleteConfirmationDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { StatusData } from '@/types';
import { getFollowUpStatuses, createFollowUpStatus, updateFollowUpStatus, deleteFollowUpStatus } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';

export default function FollowUpStatusesPage() {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFollowUpStatuses();
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

  const handleDeleteClick = (id: string) => {
    setStatusToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!statusToDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteFollowUpStatus(statusToDelete);
      if (result.success) {
        toast({ title: 'Status deleted' });
        const freshData = await getFollowUpStatuses();
        setStatuses(freshData as any);
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete failed' });
    } finally {
      setIsDeleting(false);
      setStatusToDelete(null);
    }
  };

  const handleSubmit = async (statusData: StatusData) => {
    try {
      if (editingStatus && editingStatus.id) {
        await updateFollowUpStatus(editingStatus.id, statusData);
        toast({ title: 'Status updated' });
      } else {
        await createFollowUpStatus(statusData);
        toast({ title: 'Status created' });
      }
      const freshData = await getFollowUpStatuses();
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
          title="Follow-up Lifecycle Status"
          description="Manage the lifecycle stages used in audit follow-up management and dashboard reporting."
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
                <CardTitle>Follow-up Status List</CardTitle>
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(status)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteClick(status.id!)}
                        >
                          Delete
                        </Button>
                      </div>
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
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Status"
        description="This action cannot be undone."
        message="Delete this status? This action cannot be undone."
        isLoading={isDeleting}
      />
    </>
  );
}

