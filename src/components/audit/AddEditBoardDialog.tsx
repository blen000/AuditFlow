'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Board } from '@/types';

const formSchema = z.object({
  name: z.string().min(3, 'Board name must be at least 3 characters.'),
});

type AddEditBoardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (board: Omit<Board, 'id'>) => void;
  board: Board | null;
};

export function AddEditBoardDialog({
  open,
  onOpenChange,
  onSubmit,
  board,
}: AddEditBoardDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (board) {
        form.reset({
          name: board.name,
        });
      } else {
        form.reset({ name: '' });
      }
    }
  }, [board, form, open]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{board ? 'Edit Board' : 'Add New Board'}</DialogTitle>
          <DialogDescription>
            {board
              ? `Update the details for ${board.name}.`
              : 'Add a new Board of Directors or Committee to your organization.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Board Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Board Audit Committee" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit">
                {board ? 'Save Changes' : 'Add Board'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
