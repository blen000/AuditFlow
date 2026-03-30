'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Layers, Trash2, Edit, ListTree, ChevronRight, FolderPlus } from 'lucide-react';
import { initialHierarchy } from '@/lib/mock-data';
import type { AuditHierarchyNode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddEditAuditNodeDialog } from '@/components/audit/AddEditAuditNodeDialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AuditStructurePage() {
  const { toast } = useToast();
  const [hierarchy, setHierarchy] = useState<AuditHierarchyNode[]>(initialHierarchy);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<AuditHierarchyNode | null>(null);
  const [targetParent, setTargetParent] = useState<AuditHierarchyNode | null>(null);

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

  const handleDelete = (id: string) => {
    // Also need to delete all descendants
    const getDescendants = (parentId: string): string[] => {
      const children = hierarchy.filter(n => n.parentId === parentId);
      return [...children.map(c => c.id), ...children.flatMap(c => getDescendants(c.id))];
    };

    const idsToDelete = [id, ...getDescendants(id)];
    setHierarchy(prev => prev.filter(n => !idsToDelete.includes(n.id)));
    toast({ 
      title: 'Hierarchy Level Removed', 
      description: `Removed ${idsToDelete.length} level(s) from the audit structure.` 
    });
  };

  const handleSubmit = (data: Omit<AuditHierarchyNode, 'id'>) => {
    // Check for duplicate number within the same sibling group
    const isDuplicate = hierarchy.some(n => 
      n.parentId === data.parentId && 
      n.number === data.number && 
      (!editingNode || n.id !== editingNode.id)
    );

    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: `Reference Number ${data.number} is already assigned at this level.`,
      });
      return;
    }

    if (editingNode) {
      setHierarchy(prev => prev.map(n => n.id === editingNode.id ? { ...n, ...data } : n));
      toast({ title: 'Hierarchy Updated' });
    } else {
      const newNode = { ...data, id: `NODE-${Date.now()}` };
      setHierarchy(prev => [...prev, newNode]);
      toast({ title: 'New Level Registered' });
    }
    setIsDialogOpen(false);
  };

  // Sort hierarchy numerically for display
  const sortedHierarchy = useMemo(() => {
    return [...hierarchy].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
  }, [hierarchy]);

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
