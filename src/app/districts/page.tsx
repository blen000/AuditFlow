'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { districts as initialDistricts, type District } from '@/lib/districts';
import { PlusCircle } from 'lucide-react';
import { AddEditDistrictDialog } from '@/components/audit/AddEditDistrictDialog';
import PageHeader from '@/components/layout/PageHeader';

export default function DistrictsPage() {
  const [districts, setDistricts] = useState<District[]>(initialDistricts);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(
    null
  );

  const handleAddNew = () => {
    setEditingDistrict(null);
    setDialogOpen(true);
  };

  const handleEdit = (district: District) => {
    setEditingDistrict(district);
    setDialogOpen(true);
  };

  const handleSubmit = (districtData: District) => {
    if (editingDistrict) {
      // Update existing district
      setDistricts(
        districts.map((d) =>
          d.name === editingDistrict.name ? { ...d, ...districtData } : d
        )
      );
    } else {
      // Add new district
      setDistricts([...districts, districtData]);
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
                  {districts.map((district) => (
                    <li
                      key={district.name}
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
