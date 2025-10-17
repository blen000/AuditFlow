'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { AddEditDistrictDialog } from '@/components/audit/AddEditDistrictDialog';
import PageHeader from '@/components/layout/PageHeader';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';
import type { District } from '@/types';
import { collection, doc } from 'firebase/firestore';

export default function DistrictsPage() {
  const firestore = useFirestore();
  const districtsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'districts') : null),
    [firestore]
  );
  const { data: districts } = useCollection<District>(districtsQuery);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);

  const handleAddNew = () => {
    setEditingDistrict(null);
    setDialogOpen(true);
  };

  const handleEdit = (district: District) => {
    setEditingDistrict(district);
    setDialogOpen(true);
  };

  const handleSubmit = (districtData: District) => {
    if (!firestore) return;
    if (editingDistrict && editingDistrict.id) {
      const districtRef = doc(firestore, 'districts', editingDistrict.id);
      updateDocumentNonBlocking(districtRef, districtData);
    } else {
      const districtsCollection = collection(firestore, 'districts');
      addDocumentNonBlocking(districtsCollection, districtData);
    }
    setEditingDistrict(null);
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PageHeader
          title="Districts"
          description="View and manage your organization's districts."
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
                  {districts?.map((district) => (
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
