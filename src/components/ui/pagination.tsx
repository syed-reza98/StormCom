/**
 * Pagination Component
 * 
 * Provides navigation controls for paginated content.
 * Automatically builds URLs with query parameters.
 */

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  // Build URL with query parameters
  const buildUrl = (page: number): string => {
    const params = new URLSearchParams();
    
    // Add existing search params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value);
      }
    });
    
    // Add page param
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    const query = params.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  };

  // Calculate page range to display
  const getPageRange = (): number[] => {
    const delta = 2; // Pages to show on each side of current page
    const range: number[] = [];
    const rangeWithDots: number[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, -1); // -1 represents dots
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push(-1, totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  const pageRange = getPageRange();

  return (
    <nav
      className="flex items-center justify-center space-x-2"
      aria-label="Pagination"
      data-testid="pagination"
    >
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Button
          variant="outline"
          size="sm"
          asChild
          data-testid="pagination-prev"
        >
          <Link href={buildUrl(currentPage - 1)} aria-label="Go to previous page">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled data-testid="pagination-prev">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
      )}

      {/* Page Numbers */}
      <div className="flex items-center space-x-1">
        {pageRange.map((page, index) =>
          page === -1 ? (
            <span key={`dots-${index}`} className="px-2 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              asChild={currentPage !== page}
              disabled={currentPage === page}
              className={cn('min-w-[40px]')}
              data-testid={`pagination-page-${page}`}
            >
              {currentPage !== page ? (
                <Link href={buildUrl(page)} aria-label={`Go to page ${page}`}>
                  {page}
                </Link>
              ) : (
                <span aria-current="page">{page}</span>
              )}
            </Button>
          )
        )}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Button
          variant="outline"
          size="sm"
          asChild
          data-testid="pagination-next"
        >
          <Link href={buildUrl(currentPage + 1)} aria-label="Go to next page">
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled data-testid="pagination-next">
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}
