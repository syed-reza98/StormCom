/**
 * API Response Type Definitions
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
  meta?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
