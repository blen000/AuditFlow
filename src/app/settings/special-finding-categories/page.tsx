'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddEditSpecialCategoryDialog } from '@/components/audit/AddEditSpecialCategoryDialog';
import PageHeader from '@/components/layout/PageHeader';
import { getSpecialFindingCategories, createSpecialFindingCategory, updateSpecialFindingCategory } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';

export default function SpecialFindingCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getSpecialFindingCategories();
        setCategories(data as any);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Sync Error' });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const handleAddNew = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category: {id: string, name: string}) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSubmit = async (categoryData: {name: string}) => {
    try {
      if (editingCategory && editingCategory.id) {
        await updateSpecialFindingCategory(editingCategory.id, categoryData);
        toast({ title: 'Category updated' });
      } else {
        await createSpecialFindingCategory(categoryData);
        toast({ title: 'Category created' });
      }
      const freshData = await getSpecialFindingCategories();
      setCategories(freshData as any);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save failed' });
    }
    setEditingCategory(null);
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
          title="Special Finding Categories"
          description="Manage categories used to classify special audit reports."
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
                <CardTitle>Category List</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {categories.length === 0 && (
                    <li className="p-4 text-center text-muted-foreground">
                      No categories found. Add your first category.
                    </li>
                  )}
                  {categories.map((category) => (
                    <li
                      key={category.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
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
      <AddEditSpecialCategoryDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        category={editingCategory}
      />
    </>
  );
}
