'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ShieldCheck, Trash2, Edit } from 'lucide-react';
import { AddEditBoardDialog } from '@/components/audit/AddEditBoardDialog';
import PageHeader from '@/components/layout/PageHeader';
import type { Board } from '@/types';
import { initialBoards } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export default function BoardsPage() {
  const { toast } = useToast();
  const [boards, setBoards] = useState<Board[]>(initialBoards);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);

  const handleAddNew = () => {
    setEditingBoard(null);
    setDialogOpen(true);
  };

  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setBoards(prev => prev.filter(b => b.id !== id));
    toast({
      title: "Board removed",
      description: "The board/committee has been successfully deleted.",
    });
  };

  const handleSubmit = (boardData: Omit<Board, 'id'>) => {
    if (editingBoard && editingBoard.id) {
      setBoards(prev => prev.map(b => b.id === editingBoard.id ? { ...b, ...boardData } : b));
      toast({
        title: "Board updated",
        description: `${boardData.name} has been updated.`,
      });
    } else {
      const newBoard = { ...boardData, id: `BOARD-${Date.now()}` };
      setBoards(prev => [...prev, newBoard]);
      toast({
        title: "Board added",
        description: `${boardData.name} is now registered.`,
      });
    }
    setEditingBoard(null);
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <PageHeader
          title="Board Management"
          description="Register and manage Board of Directors and specialized Committees."
          backHref="/settings"
        >
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Board/Committee
          </Button>
        </PageHeader>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Boards & Committees</CardTitle>
                </div>
                <ShieldCheck className="h-5 w-5 text-muted-foreground opacity-50" />
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {boards.length > 0 ? (
                    boards.map((board) => (
                      <li
                        key={board.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <span className="font-bold text-foreground">{board.name}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(board)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => board.id && handleDelete(board.id)}
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
                      No Boards registered yet.
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <AddEditBoardDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        board={editingBoard}
      />
    </>
  );
}
