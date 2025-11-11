/**
 * Analytics Utility Functions
 */

/**
 * Calculate growth rate between two values
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate average
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(converted: number, total: number): number {
  if (total === 0) return 0;
  return (converted / total) * 100;
}
