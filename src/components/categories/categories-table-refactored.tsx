// src/components/categories/categories-table-refactored.tsx
// Refactored Categories Table with hierarchical display and actions
// Pattern: shadcn Table + DropdownMenu + AlertDialog

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MoreHorizontalIcon, 
  EyeIcon, 
  EditIcon, 
  TrashIcon,
  FolderIcon,
  ChevronRightIcon,
} from 'lucide-react';

// Types
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  parent?: { name: string } | null;
  productsCount: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  level?: number; // For hierarchical display
}

interface CategoriesTableRefactoredProps {
  categories: Category[];
  onDelete?: (categoryId: string) => void;
  onBulkDelete?: (categoryIds: string[]) => void;
  isLoading?: boolean;
  showHierarchy?: boolean; // Show indentation for child categories
}

export function CategoriesTableRefactored({
  categories,
  onDelete,
  onBulkDelete,
  isLoading = false,
  showHierarchy = false,
}: CategoriesTableRefactoredProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(new Set(categories.map(c => c.id)));
    } else {
      setSelectedCategories(new Set());
    }
  };

  const handleSelectOne = (categoryId: string, checked: boolean) => {
    const newSelection = new Set(selectedCategories);
    if (checked) {
      newSelection.add(categoryId);
    } else {
      newSelection.delete(categoryId);
    }
    setSelectedCategories(newSelection);
  };

  const isAllSelected = categories.length > 0 && selectedCategories.size === categories.length;

  // Delete handlers
  const handleDelete = () => {
    if (deleteCategoryId && onDelete) {
      onDelete(deleteCategoryId);
      setDeleteCategoryId(null);
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(Array.from(selectedCategories));
      setSelectedCategories(new Set());
      setShowBulkDelete(false);
    }
  };

  // Get indentation for hierarchical display
  const getIndentation = (category: Category) => {
    if (!showHierarchy) return 0;
    return (category.level || 0) * 20; // 20px per level
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedCategories.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedCategories.size} categor{selectedCategories.size !== 1 ? 'ies' : 'y'} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDelete(true)}
            disabled={isLoading}
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Categories Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all categories"
                  disabled={isLoading}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  {/* Selection Checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={selectedCategories.has(category.id)}
                      onCheckedChange={(checked) => handleSelectOne(category.id, checked as boolean)}
                      aria-label={`Select category ${category.name}`}
                      disabled={isLoading}
                    />
                  </TableCell>

                  {/* Category Name with Hierarchy */}
                  <TableCell>
                    <div 
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${getIndentation(category)}px` }}
                    >
                      {showHierarchy && category.level && category.level > 0 && (
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <FolderIcon className="h-4 w-4 text-muted-foreground" />
                      <Link
                        href={`/categories/${category.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {category.name}
                      </Link>
                    </div>
                    {category.description && (
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {category.description}
                      </div>
                    )}
                  </TableCell>

                  {/* Parent Category */}
                  <TableCell>
                    {category.parent ? (
                      <Badge variant="secondary">
                        {category.parent.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Products Count */}
                  <TableCell>
                    <Badge variant="outline">
                      {category.productsCount} product{category.productsCount !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>

                  {/* Active Status */}
                  <TableCell>
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  {/* Featured Status */}
                  <TableCell>
                    {category.isFeatured && (
                      <Badge variant="default">Featured</Badge>
                    )}
                  </TableCell>

                  {/* Sort Order */}
                  <TableCell className="text-center">
                    {category.sortOrder}
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading}
                          aria-label="Category actions"
                        >
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/categories/${category.id}`}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/categories/${category.id}/edit`}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit Category
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/categories/${category.id}/products`}>
                            <FolderIcon className="h-4 w-4 mr-2" />
                            View Products
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteCategoryId(category.id)}
                          className="text-destructive"
                          disabled={category.productsCount > 0}
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Category
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category and move its products to "Uncategorized".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCategories.size} categories?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected categories and move their products to "Uncategorized".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Delete Categories
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
