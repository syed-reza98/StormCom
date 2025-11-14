'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Copy, ExternalLink, Package, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useToast from '@/hooks/use-toast';

interface TrackingEvent {
  status: string;
  location: string;
  timestamp: Date;
  description: string;
}

interface OrderTrackingInfoProps {
  trackingNumber: string;
  carrier: {
    name: string;
    logo?: string;
    trackingUrl: string;
  };
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  estimatedDelivery?: Date;
  shippedDate?: Date;
  deliveredDate?: Date;
  events?: TrackingEvent[];
}

export default function OrderTrackingInfo({
  trackingNumber,
  carrier,
  status,
  estimatedDelivery,
  shippedDate,
  deliveredDate,
  events = [],
}: OrderTrackingInfoProps) {
  const [, setCopied] = useState(false);
  const { toast } = useToast();

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Tracking number copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const openCarrierTracking = () => {
    window.open(
      carrier.trackingUrl.replace('{trackingNumber}', trackingNumber),
      '_blank'
    );
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending Shipment</Badge>;
      case 'in_transit':
        return <Badge variant="default">In Transit</Badge>;
      case 'out_for_delivery':
        return <Badge variant="default">Out for Delivery</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50">Delivered</Badge>;
      case 'failed':
        return <Badge variant="destructive">Delivery Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Tracking Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Carrier and Tracking Number */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {carrier.logo && (
                <img
                  src={carrier.logo}
                  alt={carrier.name}
                  className="h-6 w-auto"
                />
              )}
              <span className="font-medium">{carrier.name}</span>
            </div>
            {getStatusBadge()}
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded font-mono text-sm">
              {trackingNumber}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={copyTrackingNumber}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={openCarrierTracking}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          {shippedDate && (
            <div>
              <p className="text-sm text-muted-foreground">Shipped</p>
              <p className="text-sm font-medium">
                {format(new Date(shippedDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
          {deliveredDate ? (
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-sm font-medium">
                {format(new Date(deliveredDate), 'MMM dd, yyyy')}
              </p>
            </div>
          ) : estimatedDelivery ? (
            <div>
              <p className="text-sm text-muted-foreground">Estimated Delivery</p>
              <p className="text-sm font-medium">
                {format(new Date(estimatedDelivery), 'MMM dd, yyyy')}
              </p>
            </div>
          ) : null}
        </div>

        {/* Tracking Timeline */}
        {events.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium">Shipment History</p>
            <div className="space-y-3">
              {events.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background">
                      <Package className="h-4 w-4" />
                    </div>
                    {index < events.length - 1 && (
                      <div className="h-full w-0.5 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium">{event.status}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{event.location}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(event.timestamp), 'MMM dd, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
