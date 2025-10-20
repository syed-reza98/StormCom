'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Store {
  storeId: string;
  storeName: string;
  storeSlug: string;
}

interface StoreSwitcherProps {
  stores: Store[];
  activeStoreId?: string;
}

export function StoreSwitcher({ stores, activeStoreId }: StoreSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  const activeStore = stores.find(s => s.storeId === activeStoreId) || stores[0];

  const handleSwitch = async (storeId: string) => {
    try {
      const response = await fetch('/api/user/active-store', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });

      if (response.ok) {
        setIsOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to switch store:', error);
    }
  };

  if (stores.length <= 1) {
    return (
      <div className="px-3 py-2 text-sm font-medium">
        {activeStore?.storeName || 'Store'}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
      >
        <span>{activeStore?.storeName || 'Select Store'}</span>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-64 rounded-md border bg-popover shadow-lg z-50">
          <div className="p-2 space-y-1">
            {stores.map((store) => (
              <button
                key={store.storeId}
                onClick={() => handleSwitch(store.storeId)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  store.storeId === activeStoreId
                    ? 'bg-accent font-medium'
                    : 'hover:bg-accent/50'
                }`}
              >
                <div className="font-medium">{store.storeName}</div>
                <div className="text-xs text-muted-foreground">{store.storeSlug}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
