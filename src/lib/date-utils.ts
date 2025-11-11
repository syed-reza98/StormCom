/**
 * Date Utility Functions
 */

/**
 * Get date range for a period
 */
export function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  return { startDate, endDate };
}

/**
 * Check if date is within range
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

export function getDateRangePresets(): Record<string, { startDate: Date; endDate: Date }> {
  const now = new Date();
  return {
    today: { startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()), endDate: now },
    week: { startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7), endDate: now },
    month: { startDate: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()), endDate: now },
    year: { startDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), endDate: now },
  };
}

export function validateDateRange(start: Date, end: Date): boolean {
  if (!(start instanceof Date) || !(end instanceof Date)) return false;
  return start.getTime() <= end.getTime();
}
