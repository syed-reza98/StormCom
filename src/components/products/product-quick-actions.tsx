'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Archive,
} from 'lucide-react';

interface ProductQuickActionsProps {
  productId?: string;
  productName?: string;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onQuickView?: () => void;
  onArchive?: () => void;
}

export function ProductQuickActions({
  onEdit,
  onDuplicate,
  onDelete,
  onQuickView,
  onArchive,
}: ProductQuickActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Product actions"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onQuickView && (
          <DropdownMenuItem onClick={onQuickView}>
            <Eye className="mr-2 h-4 w-4" />
            Quick View
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </DropdownMenuItem>
        )}
        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
        )}
        {onArchive && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          </>
        )}
        {onDelete && (
          <>
            {!onArchive && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
