// src/components/categories/categories-tree.tsx
// Categories Tree Component - Hierarchical tree view with drag-and-drop support

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  productsCount: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

interface CategoriesTreeProps {
  categories: Category[];
  onMove?: (categoryId: string, newParentId: string | null, newPosition: number) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (categoryId: string) => void;
  onToggleStatus?: (categoryId: string, isActive: boolean) => void;
}

interface TreeNodeProps {
  category: Category;
  level: number;
  isExpanded: boolean;
  onToggle: (categoryId: string) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (categoryId: string) => void;
  onToggleStatus?: (categoryId: string, isActive: boolean) => void;
  draggedItem: string | null;
  onDragStart: (categoryId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
}

function TreeNode({
  category,
  level,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onToggleStatus,
  draggedItem,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: TreeNodeProps) {
  const hasChildren = category.children && category.children.length > 0;
  const isDragging = draggedItem === category.id;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
          isDragging ? 'opacity-50 bg-muted' : 'hover:bg-muted/50'
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        draggable
        onDragStart={() => onDragStart(category.id)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, category.id)}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => onToggle(category.id)}
          className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
          disabled={!hasChildren}
        >
          {hasChildren ? (isExpanded ? '📂' : '📁') : '📄'}
        </button>

        {/* Drag Handle */}
        <div className="w-4 h-4 flex items-center justify-center text-muted-foreground cursor-move">
          ⋮⋮
        </div>

        {/* Category Info */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{category.name}</span>
          
          <Badge variant={category.isActive ? 'success' : 'secondary'} className="text-xs">
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>

          {category.productsCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {category.productsCount} products
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(category)}
            className="h-6 w-6 p-0"
          >
            ✏️
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleStatus?.(category.id, !category.isActive)}
            className="h-6 w-6 p-0"
          >
            {category.isActive ? '👁️' : '🚫'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(category.id)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            🗑️
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {category.children!.map(child => (
            <TreeNode
              key={child.id}
              category={child}
              level={level + 1}
              isExpanded={isExpanded}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              draggedItem={draggedItem}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoriesTree({
  categories,
  onMove,
  onEdit,
  onDelete,
  onToggleStatus,
}: CategoriesTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleNode = (categoryId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleDragStart = (categoryId: string) => {
    setDraggedItem(categoryId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (draggedItem && draggedItem !== targetId) {
      // Find the target category to determine the new parent
      const findCategory = (cats: Category[], id: string): Category | null => {
        for (const cat of cats) {
          if (cat.id === id) return cat;
          if (cat.children) {
            const found = findCategory(cat.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const targetCategory = findCategory(categories, targetId);
      if (targetCategory) {
        onMove?.(draggedItem, targetCategory.parentId || null, targetCategory.sortOrder + 1);
      }
    }
    
    setDraggedItem(null);
  };

  const selectAll = () => {
    const getAllIds = (cats: Category[]): string[] => {
      return cats.flatMap(cat => [cat.id, ...(cat.children ? getAllIds(cat.children) : [])]);
    };
    setSelectedItems(new Set(getAllIds(categories)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const expandAll = () => {
    const getAllIds = (cats: Category[]): string[] => {
      return cats.flatMap(cat => [cat.id, ...(cat.children ? getAllIds(cat.children) : [])]);
    };
    setExpandedNodes(new Set(getAllIds(categories)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📁</div>
        <h3 className="text-lg font-medium mb-2">No categories found</h3>
        <p className="text-muted-foreground mb-4">
          Create your first category to organize your products
        </p>
        <Button>Create Category</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedItems.size === categories.length}
            onCheckedChange={(checked) => checked ? selectAll() : clearSelection()}
          />
          <span className="text-sm text-muted-foreground">
            {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select all'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            📂 Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            📁 Collapse All
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium">Bulk Actions:</span>
          <Button variant="outline" size="sm">
            Activate Selected
          </Button>
          <Button variant="outline" size="sm">
            Deactivate Selected
          </Button>
          <Button variant="outline" size="sm">
            Delete Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Cancel
          </Button>
        </div>
      )}

      {/* Tree */}
      <div className="space-y-1">
        {categories.map(category => (
          <TreeNode
            key={category.id}
            category={category}
            level={0}
            isExpanded={expandedNodes.has(category.id)}
            onToggle={toggleNode}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            draggedItem={draggedItem}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* Drop Zone for Root Level */}
      <div
        className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground"
        onDragOver={handleDragOver}
        onDrop={(e) => {
          e.preventDefault();
          if (draggedItem) {
            onMove?.(draggedItem, null, 999);
          }
          setDraggedItem(null);
        }}
      >
        📁 Drop here to move to root level
      </div>
    </div>
  );
}