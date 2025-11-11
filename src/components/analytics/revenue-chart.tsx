'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';

export interface RevenueData {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueChartProps {
  data: RevenueData[];
  isLoading?: boolean;
  className?: string;
  title?: string;
  showOrders?: boolean;
}

export function RevenueChart({ 
  data, 
  isLoading = false, 
  className = '', 
  title = 'Revenue Over Time',
  showOrders = true 
}: RevenueChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-200 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));

  return (
    <Card className={className} data-testid="revenue-chart" data-chart-data={JSON.stringify(data)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-end justify-between space-x-1">
          {data.map((item, index) => {
            const revenueHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 250 : 0;
            const date = new Date(item.date);
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-blue-500 w-full rounded-t opacity-80 hover:opacity-100 transition-opacity relative group"
                  style={{ height: `${revenueHeight}px` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatCurrency(item.revenue)}
                    {showOrders && <div>Orders: {item.orderCount}</div>}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            Revenue
          </div>
          {showOrders && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              Orders
            </div>
          )}
        </div>
        <div className="text-xs text-center mt-2 text-gray-500">
          {data.length} data points
        </div>
      </CardContent>
    </Card>
  );
}

export default RevenueChart;