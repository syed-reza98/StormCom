// src/components/layout/notifications-dropdown.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';

/**
 * NotificationsDropdown Component
 * 
 * Displays a dropdown with user notifications and unread count badge.
 * 
 * **Features**:
 * - Real-time unread count badge
 * - Notification list with read/unread status
 * - Mark as read on click
 * - Link to notification details
 * - Auto-refresh via polling
 * 
 * @example
 * ```tsx
 * <NotificationsDropdown />
 * ```
 */
export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, loading } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-notifications-dropdown]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    
    return undefined;
  }, [isOpen]);

  const handleNotificationClick = async (notificationId: string, linkUrl?: string | null) => {
    // Mark as read
    await markAsRead(notificationId);

    // Navigate if link provided
    if (linkUrl) {
      window.location.href = linkUrl;
    }
  };

  return (
    <div className="relative" data-notifications-dropdown>
      {/* Bell Icon with Badge */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        data-testid="notification-bell"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span 
            className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"
            data-testid="notification-badge"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {unreadCount} unread
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.linkUrl)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  data-testid="notification-item"
                >
                  <div className="flex items-start gap-3">
                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <p className={`text-sm font-medium ${
                        !notification.isRead
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </p>

                      {/* Message */}
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Timestamp */}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <a
                href="/dashboard/notifications"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
