'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export default function NotificationBadge({
  count,
  max = 99,
  className,
}: NotificationBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      variant="destructive"
      className={cn(
        "absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs font-bold",
        className
      )}
    >
      {displayCount}
    </Badge>
  );
}
