'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { AddEditStatusDialog } from '@/components/audit/AddEditStatusDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { StatusData } from '@/types';
import { initialStatuses } from '@/lib/mock-data';

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<StatusData[]>(initialStatuses);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusData | null>(null);

  const handleAddNew = () => {
    setEditingStatus(null);
    setDialogOpen(true);
  };

  const handleEdit = (status: StatusData) => {
    setEditingStatus(status);
    setDialogOpen(true);
  };

  const handleSubmit = (statusData: StatusData) => {
    if (editingStatus && editingStatus.id) {
      setStatuses(prev => prev.map(s => s.id === editingStatus.id ? { ...s, ...statusData } : s));
    } else {
      const newStatus = { ...statusData, id: `STAT-${Date.now()}` };
      setStatuses(prev => [...prev, newStatus]);
    }
    setEditingStatus(null);
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PageHeader
          title="Statuses"
          description="View and manage your organization's finding statuses."
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
