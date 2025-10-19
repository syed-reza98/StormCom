import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge
 * @param inputs - Class values to merge
 * @returns Merged class string
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', isActive && 'text-blue-500') // => 'text-blue-500' (if isActive)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
