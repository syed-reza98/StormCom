/**
 * ProductTabs Component
 * 
 * Tabbed interface for product description, specifications, and reviews.
 * Client Component for tab switching.
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import type { StorefrontProduct } from '@/services/storefront-service';

interface ProductTabsProps {
  product: StorefrontProduct;
}

type TabId = 'description' | 'specifications' | 'reviews';

export function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('description');

  const tabs = [
    { id: 'description' as TabId, label: 'Description' },
    { id: 'specifications' as TabId, label: 'Specifications' },
    { id: 'reviews' as TabId, label: 'Reviews' },
  ];

  return (
    <Card className="p-6">
      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <nav className="flex gap-8" aria-label="Product information tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="prose max-w-none">
        {activeTab === 'description' && (
          <div>
            {product.description ? (
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : (
              <p className="text-muted-foreground">No description available.</p>
            )}
          </div>
        )}

        {activeTab === 'specifications' && (
          <div>
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">SKU</td>
                  <td className="py-2 text-muted-foreground">
                    {product.variants[0]?.sku || 'N/A'}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Brand</td>
                  <td className="py-2 text-muted-foreground">
                    {product.brand?.name || 'N/A'}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Category</td>
                  <td className="py-2 text-muted-foreground">
                    {product.category?.name || 'N/A'}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Availability</td>
                  <td className="py-2 text-muted-foreground">
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Inventory Status</td>
                  <td className="py-2 text-muted-foreground">
                    {product.inventoryStatus}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <p className="text-muted-foreground">
              Reviews feature coming soon! This will display customer reviews and ratings.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
