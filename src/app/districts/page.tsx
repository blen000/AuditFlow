'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddEditDistrictDialog } from '@/components/audit/AddEditDistrictDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { District } from '@/types';
import { getDistricts, createDistrict, updateDistrict } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';

export default function DistrictsPage() {
  const { toast } = useToast();
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDistricts();
        setDistricts(data as any);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Sync Error' });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const handleAddNew = () => {
    setEditingDistrict(null);
    setDialogOpen(true);
  };

  const handleEdit = (district: District) => {
    setEditingDistrict(district);
    setDialogOpen(true);
  };

  const handleSubmit = async (districtData: District) => {
    try {
      if (editingDistrict && editingDistrict.id) {
        await updateDistrict(editingDistrict.id, districtData);
        toast({ title: 'District updated' });
      } else {
        await createDistrict(districtData);
        toast({ title: 'District created' });
      }
      const freshData = await getDistricts();
      setDistricts(freshData as any);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save failed' });
    }
    setEditingDistrict(null);
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
          title="Districts"
          description="View and manage your organization's districts from the live database."
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
                <CardTitle>District List</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {districts.map((district) => (
                    <li
                      key={district.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <span className="font-medium">{district.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(district)}
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
      <AddEditDistrictDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        district={editingDistrict}
      />
    </>
  );
}
