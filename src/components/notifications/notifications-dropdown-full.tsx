'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'order' | 'product' | 'customer' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  avatar?: string;
  actionUrl?: string;
}

interface NotificationsDropdownFullProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onLoadMore?: () => void;
}

export function NotificationsDropdownFull({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onLoadMore,
}: NotificationsDropdownFullProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>

          <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border hover:bg-accent transition-colors ${
                        !notification.read ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          {notification.avatar && (
                            <AvatarImage src={notification.avatar} />
                          )}
                          <AvatarFallback>
                            {notification.title[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm">
                              {notification.title}
                            </div>
                            <div className="flex gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => onMarkAsRead(notification.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => onDelete(notification.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {onLoadMore && filteredNotifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={onLoadMore}
                >
                  Load More
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
