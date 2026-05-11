'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MapPin, Trash2, Edit, Loader2, FileUp, FileDown } from 'lucide-react';
import { AddEditBranchDialog } from '@/components/audit/AddEditBranchDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { Branch, District } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { 
  getBranches, 
  getDistricts, 
  createBranch, 
  updateBranch, 
  deleteBranch,
  bulkImportBranches 
} from '@/app/actions/settings';

export default function BranchesPage() {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [branchData, districtData] = await Promise.all([
          getBranches(),
          getDistricts()
        ]);
        setBranches(branchData.map(b => ({ ...b, district: b.district.name })) as any);
        setDistricts(districtData as any);
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
      const headers = ['name', 'district'];
      const csvContent = [
        headers.join(','),
        ...branches.map(b => `"${b.name}","${b.district}"`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'branches.csv');
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
        const result = await bulkImportBranches(data.map(d => ({ name: d.name, districtName: d.district })));
        if (result?.success) {
          toast({ title: "Import Successful", description: `Imported ${result.count} branches.` });
          const freshBranches = await getBranches();
          setBranches(freshBranches.map(b => ({ ...b, district: b.district.name })) as any);
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
    setEditingBranch(null);
    setDialogOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBranch(id);
      setBranches(prev => prev.filter(b => b.id !== id));
      toast({ title: "Branch removed" });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  const handleSubmit = async (branchData: Omit<Branch, 'id'>) => {
    try {
      if (editingBranch && editingBranch.id) {
        await updateBranch(editingBranch.id, branchData);
        toast({ title: "Branch updated" });
      } else {
        await createBranch(branchData);
        toast({ title: "Branch added" });
      }
      const freshBranches = await getBranches();
      setBranches(freshBranches.map(b => ({ ...b, district: b.district.name })) as any);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save failed' });
    }
    setEditingBranch(null);
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
          title="Branches Management"
          description="View and manage your organization's physical bank branches from the live database."
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
              Add Branch
            </Button>
          </div>
        </PageHeader>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Branch List</CardTitle>
                </div>
                <MapPin className="h-5 w-5 text-muted-foreground opacity-50" />
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {branches.length > 0 ? (
                    branches.map((branch) => (
                      <li
                        key={branch.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <span className="font-bold text-foreground">{branch.name}</span>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            {branch.district}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(branch)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => branch.id && handleDelete(branch.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    ))
                  ) : (
                    <li className="p-8 text-center text-muted-foreground">
                      No branches registered in database.
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <AddEditBranchDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        branch={editingBranch}
        districtList={districts}
      />
    </>
  );
}
