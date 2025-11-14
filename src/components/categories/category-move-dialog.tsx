'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const moveCategorySchema = z.object({
  newParentId: z.string().nullable(),
});

type MoveCategoryFormData = z.infer<typeof moveCategorySchema>;

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface CategoryMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  availableParents: Category[];
  onMove: (categoryId: string, newParentId: string | null) => Promise<void>;
}

export function CategoryMoveDialog({
  open,
  onOpenChange,
  category,
  availableParents,
  onMove,
}: CategoryMoveDialogProps) {
  const [isMoving, setIsMoving] = useState(false);

  const form = useForm<MoveCategoryFormData>({
    resolver: zodResolver(moveCategorySchema),
    defaultValues: {
      newParentId: category?.parentId || null,
    },
  });

  // Filter out the category itself and its descendants
  const getDescendantIds = (catId: string): string[] => {
    const children = availableParents.filter((c) => c.parentId === catId);
    return [
      catId,
      ...children.flatMap((child) => getDescendantIds(child.id)),
    ];
  };

  const validParents = category
    ? availableParents.filter(
        (c) => !getDescendantIds(category.id).includes(c.id)
      )
    : [];

  const onSubmit = async (data: MoveCategoryFormData) => {
    if (!category) return;

    setIsMoving(true);
    try {
      await onMove(category.id, data.newParentId);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Move error:', error);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Category</DialogTitle>
          <DialogDescription>
            Move "{category?.name}" to a new parent category
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Moving a category will also move all of its subcategories and
                products.
              </AlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="newParentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Parent Category</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === 'root' ? null : value)
                    }
                    value={field.value || 'root'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="root">
                        Root (No Parent)
                      </SelectItem>
                      {validParents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isMoving}>
                {isMoving ? 'Moving...' : 'Move Category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
