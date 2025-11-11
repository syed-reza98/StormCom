// src/app/api/notifications/route.ts
// GET /api/notifications - Retrieve user notifications

import { NextRequest } from 'next/server';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notificationService } from '@/services/notification-service';

/**
 * GET /api/notifications
 * 
 * Retrieve notifications for the authenticated user with optional filtering.
 * 
 * **Query Parameters**:
 * - `isRead` (optional): Filter by read status ("true" or "false")
 * - `limit` (optional): Number of notifications to return (default: 50)
 * - `offset` (optional): Number of notifications to skip (default: 0)
 * 
 * **Response**: Array of notifications ordered by created date (most recent first)
 * 
 * @param request - Next.js request object
 * @returns Notifications list with unread count
 * 
 * @example
 * ```typescript
 * // Get all notifications
 * GET /api/notifications
 * 
 * // Get unread notifications only
 * GET /api/notifications?isRead=false
 * 
 * // Get with pagination
 * GET /api/notifications?limit=20&offset=0
 * 
 * // Response
 * {
 *   "success": true,
 *   "data": {
 *     "notifications": [...],
 *     "unreadCount": 5,
 *     "total": 42
 *   }
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const isReadParam = searchParams.get('isRead');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Convert query parameters
    const isRead = isReadParam === 'true' ? true : isReadParam === 'false' ? false : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Validate pagination parameters
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return errorResponse('Invalid limit parameter. Must be between 1 and 100.', 400);
    }

    if (isNaN(offset) || offset < 0) {
      return errorResponse('Invalid offset parameter. Must be >= 0.', 400);
    }

    // Get notifications and unread count
    const [notifications, unreadCount] = await Promise.all([
      notificationService.list({
        userId: session.user.id,
        isRead,
        limit,
        offset,
      }),
      notificationService.getUnreadCount(session.user.id),
    ]);

    return successResponse({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error: any) {
    console.error('[Notifications] Error retrieving notifications:', error);
    return errorResponse(
      'Failed to retrieve notifications. Please try again later.',
      500
    );
  }
}
