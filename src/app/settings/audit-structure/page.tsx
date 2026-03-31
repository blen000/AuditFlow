'use client';

import { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Layers, Trash2, Edit, ListTree, FolderPlus, Loader2 } from 'lucide-react';
import type { AuditHierarchyNode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddEditAuditNodeDialog } from '@/components/audit/AddEditAuditNodeDialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getHierarchy, createHierarchyNode, updateHierarchyNode, deleteHierarchyNode } from '@/app/actions/settings';

export default function AuditStructurePage() {
  const { toast } = useToast();
  const [hierarchy, setHierarchy] = useState<AuditHierarchyNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<AuditHierarchyNode | null>(null);
  const [targetParent, setTargetParent] = useState<AuditHierarchyNode | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getHierarchy();
        setHierarchy(data as any);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Sync Error', description: 'Failed to load hierarchy.' });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const handleAddTopLevel = () => {
    setEditingNode(null);
    setTargetParent(null);
    setIsDialogOpen(true);
  };

  const handleAddChild = (parent: AuditHierarchyNode) => {
    setEditingNode(null);
    setTargetParent(parent);
    setIsDialogOpen(true);
  };

  const handleEdit = (node: AuditHierarchyNode) => {
    setEditingNode(node);
    setTargetParent(hierarchy.find(n => n.id === node.parentId) || null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteHierarchyNode(id);
      if (result.success) {
        setHierarchy(prev => prev.filter(n => n.id !== id));
        toast({ title: 'Hierarchy Level Removed' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Removal Failed' });
    }
  };

  const handleSubmit = async (data: Omit<AuditHierarchyNode, 'id'>) => {
    try {
      if (editingNode) {
        const result = await updateHierarchyNode(editingNode.id, data);
        if (result.success) {
          setHierarchy(prev => prev.map(n => n.id === editingNode.id ? { ...n, ...data } : n));
          toast({ title: 'Hierarchy Updated' });
        }
      } else {
        const result = await createHierarchyNode(data);
        if (result.success) {
          const freshData = await getHierarchy();
          setHierarchy(freshData as any);
          toast({ title: 'New Level Registered' });
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: error.message || "Operation failed.",
      });
    }
    setIsDialogOpen(false);
  };

  const sortedHierarchy = useMemo(() => {
    return [...hierarchy].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
  }, [hierarchy]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Taxonomy...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Audit Hierarchy Management" 
        description="Define multi-level hierarchical titles and numbering for institutional audit missions."
        backHref="/settings"
      >
        <Button onClick={handleAddTopLevel}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Level 1 Mission
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Card className="shadow-xl border-none overflow-hidden">
            <CardHeader className="bg-muted/10 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ListTree className="h-5 w-5 text-primary" />
                    Institutional Hierarchy & Taxonomy
                  </CardTitle>
                  <CardDescription>Establish standardized mission summaries and functional sub-areas.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-32 font-bold uppercase text-[10px] tracking-widest">Ref No.</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">Title / Descriptor</TableHead>
                    <TableHead className="w-24 text-center font-bold uppercase text-[10px] tracking-widest">Level</TableHead>
                    <TableHead className="w-48 text-right font-bold uppercase text-[10px] tracking-widest">Administrative Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHierarchy.length > 0 ? (
                    sortedHierarchy.map((node) => (
                      <TableRow key={node.id} className={cn("transition-colors", node.level === 1 ? "bg-primary/5" : "hover:bg-muted/30")}>
                        <TableCell className="font-mono font-black text-primary">
                          <div className="flex items-center">
                            {Array.from({ length: node.level - 1 }).map((_, i) => (
                              <div key={i} className="w-4 border-l h-full" />
                            ))}
                            <Badge variant={node.level === 1 ? "default" : "outline"} className="font-mono">
                              {node.number}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-sm", node.level === 1 ? "font-bold text-lg" : "font-medium")}>
                            {node.title}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[10px] uppercase">{node.level}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-[10px] font-bold uppercase tracking-tighter" 
                              onClick={() => handleAddChild(node)}
                            >
                              <FolderPlus className="mr-1 h-3.5 w-3.5" />
                              Sub-level
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(node)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(node.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                        No hierarchical structure defined. Start by adding a Level 1 Mission.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      <AddEditAuditNodeDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        node={editingNode}
        parent={targetParent}
      />
    </div>
  );
}
