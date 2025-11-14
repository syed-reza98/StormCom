'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface PriceChange {
  id: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  changedAt: Date;
  changedBy: string;
}

interface ProductPriceHistoryProps {
  productId?: string;
  productName?: string;
  currentPrice: number;
  priceHistory: PriceChange[];
}

export function ProductPriceHistory({
  currentPrice,
  priceHistory,
}: ProductPriceHistoryProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Filter data based on time range
  const filteredHistory = priceHistory.filter((change) => {
    if (timeRange === 'all') return true;
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return new Date(change.changedAt) >= cutoffDate;
  });

  // Prepare chart data
  const chartData = filteredHistory.map((change) => ({
    date: new Date(change.changedAt).toLocaleDateString(),
    price: change.newPrice,
  }));

  // Add current price as the last data point
  if (chartData.length > 0) {
    chartData.push({
      date: 'Now',
      price: currentPrice,
    });
  }

  // Calculate price change percentage
  const firstPrice = filteredHistory[0]?.oldPrice || currentPrice;
  const priceChangePercent = ((currentPrice - firstPrice) / firstPrice) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price History
          </span>
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Price & Change */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">
              ${currentPrice.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Current Price</div>
          </div>
          {priceChangePercent !== 0 && (
            <Badge
              variant={priceChangePercent > 0 ? 'default' : 'destructive'}
              className="gap-1"
            >
              {priceChangePercent > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(priceChangePercent).toFixed(1)}%
            </Badge>
          )}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Price Change Timeline */}
        <div className="space-y-3">
          <div className="font-medium">Change History</div>
          {filteredHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No price changes in this time range
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((change) => (
                <div
                  key={change.id}
                  className="flex items-start justify-between border-l-2 pl-4 py-2"
                  style={{
                    borderColor:
                      change.newPrice > change.oldPrice
                        ? 'hsl(var(--destructive))'
                        : 'hsl(var(--primary))',
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        ${change.oldPrice.toFixed(2)} → ${change.newPrice.toFixed(2)}
                      </span>
                      {change.newPrice > change.oldPrice ? (
                        <TrendingUp className="h-4 w-4 text-destructive" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {change.reason}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      by {change.changedBy} •{' '}
                      {formatDistanceToNow(new Date(change.changedAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
