"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

type NavLinkProps = ComponentProps<typeof Link> & {
  exact?: boolean;
};

export function NavLink({ href, className, exact = false, children, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const hrefStr = typeof href === 'string' ? href : href.pathname ?? '';
  const isActive = exact ? pathname === hrefStr : pathname?.startsWith(hrefStr);

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
        isActive && 'bg-accent text-foreground',
        className
      )}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </Link>
  );
}
