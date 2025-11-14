'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Save, RotateCcw } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  productsCount: number;
}

interface CategoryDragDropReorderProps {
  categories: Category[];
  onSave: (reorderedCategories: Category[]) => Promise<void>;
}

export function CategoryDragDropReorder({
  categories,
  onSave,
}: CategoryDragDropReorderProps) {
  const [items, setItems] = useState(categories);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const hasChanges = JSON.stringify(items) !== JSON.stringify(categories);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = items.findIndex((item) => item.id === draggedItem);
    const targetIndex = items.findIndex((item) => item.id === targetId);

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Update sort orders
    const reordered = newItems.map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

    setItems(reordered);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(items);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setItems(categories);
  };

  // Group by parent
  const rootCategories = items.filter((c) => !c.parentId);
  const getChildren = (parentId: string) =>
    items.filter((c) => c.parentId === parentId);

  const renderCategory = (category: Category, level: number = 0) => {
    const children = getChildren(category.id);
    const isDragging = draggedItem === category.id;

    return (
      <div key={category.id}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, category.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, category.id)}
          onDragEnd={handleDragEnd}
          className={`
            flex items-center gap-3 p-3 border rounded-lg cursor-move
            hover:bg-accent transition-colors
            ${isDragging ? 'opacity-50' : ''}
          `}
          style={{ marginLeft: `${level * 24}px` }}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{category.name}</div>
            <div className="text-xs text-muted-foreground">
              {category.productsCount} products
            </div>
          </div>
          <Badge variant="secondary">{category.sortOrder}</Badge>
        </div>
        {children.map((child) => renderCategory(child, level + 1))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Reorder Categories</span>
          {hasChanges && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Order'}
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rootCategories.map((category) => renderCategory(category))}
        </div>
        {!hasChanges && (
          <div className="text-sm text-muted-foreground text-center mt-4">
            Drag and drop to reorder categories
          </div>
        )}
      </CardContent>
    </Card>
  );
}
