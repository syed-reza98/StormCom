/**
 * Chart Utility Functions
 */

/**
 * Generate chart colors
 */
export function generateChartColors(count: number): string[] {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
}

/**
 * Format chart data
 */
export function formatChartData(data: Array<{ label: string; value: number }>) {
  return {
    labels: data.map(d => d.label),
    values: data.map(d => d.value),
  };
}

// Backwards-compatible aliases
export const transformRevenueData = formatChartData;
export const transformProductData = formatChartData;
