'use client';

import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SEOPreviewCardProps {
  title: string;
  description: string;
  slug: string;
  baseUrl?: string;
}

export default function SEOPreviewCard({
  title,
  description,
  slug,
  baseUrl = 'https://example.com',
}: SEOPreviewCardProps) {
  const fullUrl = `${baseUrl}${slug}`;
  const titleLength = title.length;
  const descriptionLength = description.length;

  const getTitleStatus = () => {
    if (titleLength === 0) return { color: 'text-muted-foreground', message: 'No title' };
    if (titleLength < 30) return { color: 'text-amber-600', message: 'Too short' };
    if (titleLength > 60) return { color: 'text-amber-600', message: 'Too long' };
    return { color: 'text-green-600', message: 'Optimal' };
  };

  const getDescriptionStatus = () => {
    if (descriptionLength === 0) return { color: 'text-muted-foreground', message: 'No description' };
    if (descriptionLength < 120) return { color: 'text-amber-600', message: 'Too short' };
    if (descriptionLength > 160) return { color: 'text-amber-600', message: 'Too long' };
    return { color: 'text-green-600', message: 'Optimal' };
  };

  const titleStatus = getTitleStatus();
  const descriptionStatus = getDescriptionStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          SEO Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Search Result Preview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-baseline gap-2">
            <div className="h-4 w-4 rounded-full bg-primary flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-xs text-muted-foreground truncate">{fullUrl}</p>
              <h3 className="text-lg text-blue-600 hover:underline cursor-pointer line-clamp-1">
                {title || 'Product Title'}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description || 'Product description will appear here in search results.'}
              </p>
            </div>
          </div>
        </div>

        {/* Character Counts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Title</span>
              <Badge variant="outline" className={titleStatus.color}>
                {titleLength}/60
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  titleLength === 0
                    ? 'bg-muted-foreground'
                    : titleLength < 30 || titleLength > 60
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((titleLength / 60) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{titleStatus.message}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Description</span>
              <Badge variant="outline" className={descriptionStatus.color}>
                {descriptionLength}/160
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  descriptionLength === 0
                    ? 'bg-muted-foreground'
                    : descriptionLength < 120 || descriptionLength > 160
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min((descriptionLength / 160) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{descriptionStatus.message}</p>
          </div>
        </div>

        {/* Best Practices Tips */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-medium">SEO Best Practices:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Title: 30-60 characters, include primary keyword</li>
            <li>Description: 120-160 characters, compelling call-to-action</li>
            <li>URL: Use hyphens, keep short, include keywords</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
