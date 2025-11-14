'use client';

import * as React from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  productsCount: number;
  isActive: boolean;
  children?: Category[];
}

interface CategoryTreeViewProps {
  categories: Category[];
  onAddChild?: (parentId: string) => void;
  onEdit?: (categoryId: string) => void;
  onDelete?: (categoryId: string) => void;
  onMove?: (categoryId: string, newParentId: string | null) => void;
  onReorder?: (categoryId: string, newOrder: number) => void;
  className?: string;
}

interface TreeNodeProps {
  category: Category;
  level: number;
  onAddChild?: (parentId: string) => void;
  onEdit?: (categoryId: string) => void;
  onDelete?: (categoryId: string) => void;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
}

function TreeNode({
  category,
  level,
  onAddChild,
  onEdit,
  onDelete,
  expandedIds,
  toggleExpanded,
}: TreeNodeProps) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds.has(category.id);

  return (
    <div>
      {/* Category row */}
      <div
        className="group flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded-md"
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {/* Drag handle */}
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-move" />

        {/* Expand/collapse button */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => toggleExpanded(category.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        {/* Folder icon */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 text-primary" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}

        {/* Category name */}
        <span className="flex-1 font-medium">{category.name}</span>

        {/* Products count badge */}
        {category.productsCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {category.productsCount}
          </Badge>
        )}

        {/* Status badge */}
        {!category.isActive && (
          <Badge variant="outline" className="text-xs">
            Inactive
          </Badge>
        )}

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
            >
              <span className="sr-only">Actions</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onAddChild && (
              <>
                <DropdownMenuItem onClick={() => onAddChild(category.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subcategory
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(category.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(category.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {category.children!.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              level={level + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTreeView({
  categories,
  onAddChild,
  onEdit,
  onDelete,
  className,
}: CategoryTreeViewProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const addIds = (cats: Category[]) => {
      cats.forEach((cat) => {
        allIds.add(cat.id);
        if (cat.children) {
          addIds(cat.children);
        }
      });
    };
    addIds(categories);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Build tree structure
  const buildTree = (items: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    // Create map
    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    // Build tree
    items.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parentId) {
        const parent = map.get(item.parentId);
        if (parent) {
          parent.children!.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort by sortOrder
    const sortChildren = (cats: Category[]) => {
      cats.sort((a, b) => a.sortOrder - b.sortOrder);
      cats.forEach((cat) => {
        if (cat.children) {
          sortChildren(cat.children);
        }
      });
    };
    sortChildren(roots);

    return roots;
  };

  const tree = buildTree(categories);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Category Tree</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tree.length > 0 ? (
          <div className="space-y-1">
            {tree.map((category) => (
              <TreeNode
                key={category.id}
                category={category}
                level={0}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Folder className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No categories yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
