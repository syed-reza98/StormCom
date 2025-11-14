'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface FunnelStage {
  name: string;
  value: number;
  fill: string;
}

interface SalesFunnelData {
  views: number;
  addToCart: number;
  checkout: number;
  purchase: number;
}

interface SalesFunnelChartProps {
  data: SalesFunnelData;
}

export function SalesFunnelChart({ data }: SalesFunnelChartProps) {
  const funnelData: FunnelStage[] = [
    { name: 'Product Views', value: data.views, fill: 'hsl(var(--primary))' },
    { name: 'Add to Cart', value: data.addToCart, fill: 'hsl(var(--secondary))' },
    { name: 'Checkout', value: data.checkout, fill: 'hsl(var(--accent))' },
    { name: 'Purchase', value: data.purchase, fill: 'hsl(var(--success))' },
  ];

  // Calculate conversion rates
  const addToCartRate = data.views > 0 ? (data.addToCart / data.views) * 100 : 0;
  const checkoutRate = data.addToCart > 0 ? (data.checkout / data.addToCart) * 100 : 0;
  const purchaseRate = data.checkout > 0 ? (data.purchase / data.checkout) * 100 : 0;
  const overallRate = data.views > 0 ? (data.purchase / data.views) * 100 : 0;

  // Calculate drop-offs
  const viewToCartDropOff = data.views - data.addToCart;
  const cartToCheckoutDropOff = data.addToCart - data.checkout;
  const checkoutToPurchaseDropOff = data.checkout - data.purchase;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sales Funnel</span>
            <Badge variant="secondary">
              Overall Conversion: {overallRate.toFixed(1)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  <LabelList
                    position="right"
                    fill="#000"
                    stroke="none"
                    dataKey="name"
                  />
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rates by Stage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Views → Add to Cart</div>
              <div className="text-sm text-muted-foreground">
                {data.views.toLocaleString()} views
              </div>
            </div>
            <Badge variant={addToCartRate > 3 ? 'default' : 'secondary'}>
              {addToCartRate.toFixed(1)}%
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Add to Cart → Checkout</div>
              <div className="text-sm text-muted-foreground">
                {data.addToCart.toLocaleString()} added
              </div>
            </div>
            <Badge variant={checkoutRate > 30 ? 'default' : 'secondary'}>
              {checkoutRate.toFixed(1)}%
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Checkout → Purchase</div>
              <div className="text-sm text-muted-foreground">
                {data.checkout.toLocaleString()} checkouts
              </div>
            </div>
            <Badge variant={purchaseRate > 60 ? 'default' : 'secondary'}>
              {purchaseRate.toFixed(1)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Drop-off Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Drop-off Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border-l-4 border-l-destructive bg-destructive/5 rounded">
            <div>
              <div className="font-medium">Views to Add to Cart</div>
              <div className="text-sm text-muted-foreground">
                Potential customers lost
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-destructive">
                {viewToCartDropOff.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {((viewToCartDropOff / data.views) * 100).toFixed(1)}% drop-off
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border-l-4 border-l-orange-500 bg-orange-500/5 rounded">
            <div>
              <div className="font-medium">Add to Cart to Checkout</div>
              <div className="text-sm text-muted-foreground">
                Abandoned carts
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-orange-500">
                {cartToCheckoutDropOff.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {((cartToCheckoutDropOff / data.addToCart) * 100).toFixed(1)}% drop-off
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border-l-4 border-l-yellow-500 bg-yellow-500/5 rounded">
            <div>
              <div className="font-medium">Checkout to Purchase</div>
              <div className="text-sm text-muted-foreground">
                Incomplete purchases
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-yellow-600">
                {checkoutToPurchaseDropOff.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {((checkoutToPurchaseDropOff / data.checkout) * 100).toFixed(1)}% drop-off
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
