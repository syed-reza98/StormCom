// src/components/ui/command-palette.tsx
// Reusable Command Palette component
// Pattern: shadcn Command + Dialog for global search

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  SearchIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
  FolderIcon,
  SettingsIcon,
  BarChartIcon,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  icon?: typeof PackageIcon;
  group: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items?: CommandItem[];
}

// Default navigation items
const defaultItems: CommandItem[] = [
  // Products
  { id: 'products', title: 'Products', url: '/products', icon: PackageIcon, group: 'Navigation' },
  { id: 'products-new', title: 'New Product', url: '/products/new', icon: PackageIcon, group: 'Actions' },
  
  // Orders
  { id: 'orders', title: 'Orders', url: '/orders', icon: ShoppingCartIcon, group: 'Navigation' },
  { id: 'orders-pending', title: 'Pending Orders', url: '/orders?status=PENDING', icon: ShoppingCartIcon, group: 'Quick Links' },
  
  // Customers
  { id: 'customers', title: 'Customers', url: '/customers', icon: UsersIcon, group: 'Navigation' },
  
  // Categories
  { id: 'categories', title: 'Categories', url: '/categories', icon: FolderIcon, group: 'Navigation' },
  
  // Analytics
  { id: 'analytics', title: 'Analytics', url: '/analytics', icon: BarChartIcon, group: 'Navigation' },
  
  // Settings
  { id: 'settings', title: 'Settings', url: '/settings', icon: SettingsIcon, group: 'Navigation' },
];

export function CommandPalette({ 
  open, 
  onOpenChange, 
  items = defaultItems 
}: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Keyboard shortcut to open/close (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    router.push(url);
    setSearch('');
  };

  // Group items by group
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search or jump to..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {Object.entries(groupedItems).map(([group, groupItems], index) => (
          <div key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {groupItems.map((item) => {
                const Icon = item.icon || SearchIcon;
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.description || ''}`}
                    onSelect={() => handleSelect(item.url)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
