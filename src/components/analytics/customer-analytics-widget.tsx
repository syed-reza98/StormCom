'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  avgLifetimeValue: number;
  retentionRate: number;
  churnRate: number;
}

interface CustomerData {
  date: string;
  new: number;
  returning: number;
}

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
}

interface CustomerAnalyticsWidgetProps {
  metrics: CustomerMetrics;
  chartData: CustomerData[];
  topCustomers: TopCustomer[];
}

export function CustomerAnalyticsWidget({
  metrics,
  chartData,
  topCustomers,
}: CustomerAnalyticsWidgetProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  const pieData = [
    { name: 'New', value: metrics.newCustomers, color: 'hsl(var(--primary))' },
    { name: 'Returning', value: metrics.returningCustomers, color: 'hsl(var(--secondary))' },
  ];

  return (
    <div className="space-y-4">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
                <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Avg. Lifetime Value</div>
                <div className="text-2xl font-bold">
                  ${metrics.avgLifetimeValue.toFixed(2)}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Retention Rate</div>
                <div className="text-2xl font-bold">{metrics.retentionRate}%</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Churn Rate</div>
                <div className="text-2xl font-bold">{metrics.churnRate}%</div>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customer Growth</span>
            <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="new"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="New Customers"
                  />
                  <Line
                    type="monotone"
                    dataKey="returning"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    name="Returning Customers"
                  />
                </LineChart>
              ) : (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="new"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                    name="New Customers"
                  />
                  <Area
                    type="monotone"
                    dataKey="returning"
                    stackId="1"
                    stroke="hsl(var(--secondary))"
                    fill="hsl(var(--secondary))"
                    fillOpacity={0.6}
                    name="Returning Customers"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* New vs Returning Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.email}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${customer.totalSpent.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {customer.orderCount} orders
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
