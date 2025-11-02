// src/hooks/use-notifications.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Notification type
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  linkUrl: string | null;
  linkText: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * useNotifications Hook
 * 
 * Manages in-app notifications with real-time updates via polling.
 * 
 * **Features**:
 * - Fetch notifications list
 * - Real-time unread count
 * - Mark notifications as read
 * - Auto-refresh via polling (30s interval)
 * - Loading and error states
 * 
 * @param options - Hook options (polling interval, filter)
 * @returns Notifications state and actions
 * 
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead, loading } = useNotifications();
 * 
 * // Mark notification as read
 * await markAsRead('notif-123');
 * 
 * // Check unread count
 * console.log(`You have ${unreadCount} unread notifications`);
 * ```
 */
export function useNotifications(options: {
  pollingInterval?: number;
  isRead?: boolean;
} = {}) {
  const { pollingInterval = 30000, isRead } = options; // 30s default

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (isRead !== undefined) {
        params.append('isRead', String(isRead));
      }

      const response = await fetch(`/api/notifications?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
        setError(null);
      } else {
        setError(data.error?.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('[useNotifications] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isRead]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, isRead: true, readAt: new Date(data.data.readAt) }
              : notif
          )
        );

        // Decrement unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));

        return true;
      } else {
        console.error('[useNotifications] Mark as read failed:', data.error);
        return false;
      }
    } catch (err) {
      console.error('[useNotifications] Mark as read error:', err);
      return false;
    }
  }, []);

  /**
   * Refresh notifications manually
   */
  const refresh = useCallback(() => {
    setLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling for real-time updates
  useEffect(() => {
    if (pollingInterval <= 0) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    refresh,
  };
}
