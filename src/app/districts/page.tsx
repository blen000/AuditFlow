'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2, FileUp, FileDown } from 'lucide-react';
import { AddEditDistrictDialog } from '@/components/audit/AddEditDistrictDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { District } from '@/types';
import { 
  getDistricts, 
  createDistrict, 
  updateDistrict,
  deleteDistrict,
  bulkImportDistricts 
} from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';

export default function DistrictsPage() {
  const { toast } = useToast();
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = () => {
    setIsProcessing('export');
    try {
      const headers = ['name'];
      const csvContent = [
        headers.join(','),
        ...districts.map(d => `"${d.name}"`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'districts.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export failed' });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing('import');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        return headers.reduce((obj: any, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {});
      });

      try {
        const result = await bulkImportDistricts(data.map(d => ({ name: d.name })));
        if (result?.success) {
          toast({ title: "Import Successful", description: `Imported ${result.count} districts.` });
          const freshData = await getDistricts();
          setDistricts(freshData as any);
        } else {
          throw new Error(result?.error || 'Import failed');
        }
      } catch (error: any) {
        toast({ variant: "destructive", title: "Import Failed", description: error.message });
      } finally {
        setIsProcessing(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleAddNew = () => {
    setEditingDistrict(null);
    setDialogOpen(true);
  };

  const handleEdit = (district: District) => {
    setEditingDistrict(district);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this district? This action cannot be undone.')) return;
    try {
      const result = await deleteDistrict(id);
      if (result.success) {
        toast({ title: 'District deleted' });
        const freshData = await getDistricts();
        setDistricts(freshData as any);
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
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
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv"
              onChange={handleFileChange}
            />
            <Button 
              variant="outline" 
              onClick={handleImportClick} 
              disabled={!!isProcessing}
            >
              {isProcessing === 'import' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 h-4 w-4 text-blue-500" />
              )}
              Import
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport} 
              disabled={!!isProcessing}
            >
              {isProcessing === 'export' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4 text-green-500" />
              )}
              Export
            </Button>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(district)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(district.id)}
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
      <AddEditDistrictDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        district={editingDistrict}
      />
    </>
  );
}
