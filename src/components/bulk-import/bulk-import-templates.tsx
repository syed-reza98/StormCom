// src/components/bulk-import/bulk-import-templates.tsx
// CSV templates component for bulk import

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Template {
  id: string;
  name: string;
  description: string;
  fields: string[];
  sampleRows: number;
  downloadUrl: string;
  icon: string;
}

const templates: Template[] = [
  {
    id: 'basic-products',
    name: 'Basic Products',
    description: 'Simple product import with essential fields',
    fields: ['name', 'sku', 'price', 'category', 'description'],
    sampleRows: 10,
    downloadUrl: '/templates/basic-products.csv',
    icon: '📦',
  },
  {
    id: 'products-with-variants',
    name: 'Products with Variants',
    description: 'Products with size, color, and other variants',
    fields: ['name', 'sku', 'price', 'category', 'variant_type', 'variant_value'],
    sampleRows: 15,
    downloadUrl: '/templates/products-with-variants.csv',
    icon: '🎨',
  },
  {
    id: 'inventory-update',
    name: 'Inventory Update',
    description: 'Update stock quantities for existing products',
    fields: ['sku', 'stock_quantity', 'low_stock_threshold'],
    sampleRows: 20,
    downloadUrl: '/templates/inventory-update.csv',
    icon: '📊',
  },
  {
    id: 'pricing-update',
    name: 'Pricing Update',
    description: 'Bulk update product prices and sale prices',
    fields: ['sku', 'price', 'sale_price', 'sale_start_date', 'sale_end_date'],
    sampleRows: 12,
    downloadUrl: '/templates/pricing-update.csv',
    icon: '💰',
  },
  {
    id: 'full-catalog',
    name: 'Complete Catalog',
    description: 'Full product import with all available fields',
    fields: [
      'name', 'sku', 'price', 'category', 'brand', 'description', 
      'weight', 'dimensions', 'tags', 'images', 'seo_title'
    ],
    sampleRows: 5,
    downloadUrl: '/templates/full-catalog.csv',
    icon: '📚',
  },
];

export function BulkImportTemplates() {
  const handleDownload = (template: Template) => {
    // In a real app, this would trigger a download
    
    // Mock download by creating a blob and triggering download
    const csvContent = generateSampleCSV(template);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.id}-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateSampleCSV = (template: Template): string => {
    const headers = template.fields.join(',');
    
    // Generate sample data based on template type
    const sampleData: string[] = [];
    
    for (let i = 1; i <= template.sampleRows; i++) {
      const row: string[] = [];
      
      template.fields.forEach(field => {
        switch (field) {
          case 'name':
            row.push(`"Sample Product ${i}"`);
            break;
          case 'sku':
            row.push(`"SKU-${i.toString().padStart(3, '0')}"`);
            break;
          case 'price':
            row.push((Math.random() * 100 + 10).toFixed(2));
            break;
          case 'category':
            row.push('"Electronics"');
            break;
          case 'description':
            row.push(`"Description for product ${i}"`);
            break;
          case 'stock_quantity':
            row.push(Math.floor(Math.random() * 100).toString());
            break;
          case 'low_stock_threshold':
            row.push('10');
            break;
          case 'sale_price':
            row.push((Math.random() * 50 + 5).toFixed(2));
            break;
          case 'brand':
            row.push('"Sample Brand"');
            break;
          case 'weight':
            row.push((Math.random() * 5 + 0.1).toFixed(2));
            break;
          case 'variant_type':
            row.push(i % 2 === 0 ? '"Color"' : '"Size"');
            break;
          case 'variant_value':
            row.push(i % 2 === 0 ? '"Red"' : '"Medium"');
            break;
          default:
            row.push(`"Sample ${field}"`);
        }
      });
      
      sampleData.push(row.join(','));
    }
    
    return [headers, ...sampleData].join('\n');
  };

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{template.icon}</div>
              <div>
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </div>
          </div>

          {/* Fields Preview */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Fields ({template.fields.length}):</div>
            <div className="flex flex-wrap gap-1">
              {template.fields.slice(0, 5).map((field) => (
                <Badge key={field} variant="outline" className="text-xs">
                  {field}
                </Badge>
              ))}
              {template.fields.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{template.fields.length - 5} more
                </Badge>
              )}
            </div>
          </div>

          {/* Sample Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {template.sampleRows} sample rows included
            </span>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDownload(template)}
            >
              📥 Download CSV
            </Button>
          </div>
        </div>
      ))}

      {/* Custom Template Request */}
      <div className="border rounded-lg p-4 text-center space-y-3 bg-muted/25">
        <div className="text-2xl">⚙️</div>
        <div>
          <h4 className="font-medium">Need a Custom Template?</h4>
          <p className="text-sm text-muted-foreground">
            Contact support for help creating a custom CSV template
          </p>
        </div>
        <Button variant="outline" size="sm">
          📧 Contact Support
        </Button>
      </div>

      {/* Help Section */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>💡 Tip:</strong> Always test with a small batch first</p>
        <p><strong>📋 Format:</strong> UTF-8 encoding, comma-separated values</p>
        <p><strong>🔄 Updates:</strong> Use SKU as unique identifier for updates</p>
      </div>
    </div>
  );
}