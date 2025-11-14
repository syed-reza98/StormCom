'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
  Check,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface OrderTimelineEvent {
  id: string;
  type:
    | 'created'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded'
    | 'note';
  title: string;
  description?: string;
  timestamp: Date;
  user?: {
    name: string;
    email?: string;
  };
  metadata?: Record<string, any>;
}

interface OrderTimelineProps {
  events: OrderTimelineEvent[];
  className?: string;
}

const eventConfig: Record<
  OrderTimelineEvent['type'],
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }
> = {
  created: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  confirmed: {
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  processing: {
    icon: RefreshCw,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  shipped: {
    icon: Truck,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  delivered: {
    icon: CheckCircle,
    color: 'text-green-700',
    bgColor: 'bg-green-200',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  refunded: {
    icon: RefreshCw,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  note: {
    icon: Package,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

export function OrderTimeline({ events, className }: OrderTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline events */}
          <div className="space-y-6">
            {sortedEvents.map((event) => {
              const config = eventConfig[event.type];
              const Icon = config.icon;

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon circle */}
                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>

                  {/* Event content */}
                  <div className="flex-1 space-y-1 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-medium leading-none">{event.title}</p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {format(event.timestamp, 'MMM d, h:mm a')}
                      </Badge>
                    </div>

                    {/* User info */}
                    {event.user && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {event.user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{event.user.name}</span>
                      </div>
                    )}

                    {/* Metadata */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 space-y-1 rounded-md bg-muted p-2 text-xs">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {sortedEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No events yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
