// src/app/api/notifications/[id]/read/route.ts
// PUT /api/notifications/[id]/read - Mark notification as read

import { NextRequest } from 'next/server';
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from '@/lib/api-response';
import { getSessionFromRequest } from '@/lib/session-storage';
import { notificationService } from '@/services/notification-service';

/**
 * PUT /api/notifications/[id]/read
 * 
 * Mark a notification as read for the authenticated user.
 * 
 * **Authorization**: User must own the notification
 * 
 * @param request - Next.js request object
 * @param params - Route parameters { id: string }
 * @returns Updated notification
 * 
 * @example
 * ```typescript
 * // Mark notification as read
 * PUT /api/notifications/notif-123/read
 * 
 * // Response
 * {
 *   "success": true,
 *   "data": {
 *     "id": "notif-123",
 *     "isRead": true,
 *     "readAt": "2025-11-01T00:00:00Z",
 *     ...
 *   }
 * }
 * ```
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSessionFromRequest(request);
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // Mark notification as read
    const notification = await notificationService.markAsRead(id, session.userId);

    if (!notification) {
      return errorResponse('Notification not found or unauthorized', 404, {
        code: 'NOT_FOUND',
      });
    }

    return successResponse(notification, {
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    console.error('[Notifications] Error marking notification as read:', error);
    return errorResponse(
      'Failed to mark notification as read. Please try again later.',
      500
    );
  }
}
