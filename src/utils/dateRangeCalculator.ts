/**
 * Date range calculator for dashboard time period filtering
 * 
 * Handles calculation of current and previous date ranges for different time periods:
 * - Day: Today vs Yesterday
 * - Week: Current week (Mon-Sun) vs Previous week
 * - Month: Current calendar month vs Previous month
 * - Year: Current calendar year vs Previous year
 * - Total: All time (no previous period)
 */

import type { TimePeriod, PeriodData } from '../types/dashboard';

/**
 * Calculate date ranges for current and previous periods based on the selected time period
 * 
 * @param period - The time period to calculate ranges for
 * @param referenceDate - Optional reference date (defaults to now)
 * @returns PeriodData containing current and previous date ranges
 * 
 * @example
 * // Get current week and previous week ranges
 * const ranges = calculatePeriodRanges('week');
 * console.log(ranges.current.start); // Monday 00:00:00 of current week
 * console.log(ranges.current.end);   // Sunday 23:59:59 of current week
 */
export function calculatePeriodRanges(
  period: TimePeriod,
  referenceDate: Date = new Date()
): PeriodData {
  switch (period) {
    case 'day':
      return calculateDayRanges(referenceDate);
    case 'week':
      return calculateWeekRanges(referenceDate);
    case 'month':
      return calculateMonthRanges(referenceDate);
    case 'year':
      return calculateYearRanges(referenceDate);
    case 'total':
      return calculateTotalRanges();
    default:
      throw new Error(`Invalid period: ${period}`);
  }
}

/**
 * Calculate day period ranges
 * Current: Today (00:00:00 to 23:59:59)
 * Previous: Yesterday (00:00:00 to 23:59:59)
 */
function calculateDayRanges(referenceDate: Date): PeriodData {
  // Current day: start at 00:00:00
  const currentStart = new Date(referenceDate);
  currentStart.setHours(0, 0, 0, 0);
  
  // Current day: end at 23:59:59.999
  const currentEnd = new Date(referenceDate);
  currentEnd.setHours(23, 59, 59, 999);
  
  // Previous day: exactly 24 hours before current start
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 1);
  
  // Previous day: end at 23:59:59.999
  const previousEnd = new Date(previousStart);
  previousEnd.setHours(23, 59, 59, 999);
  
  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd }
  };
}

/**
 * Calculate week period ranges
 * Current: Current week (Monday 00:00:00 to Sunday 23:59:59)
 * Previous: Previous week (Monday 00:00:00 to Sunday 23:59:59)
 * 
 * Week starts on Monday (ISO 8601 standard)
 */
function calculateWeekRanges(referenceDate: Date): PeriodData {
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = referenceDate.getDay();
  
  // Calculate days to subtract to get to Monday
  // If Sunday (0), go back 6 days; if Monday (1), go back 0 days; etc.
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Current week start: Monday 00:00:00
  const currentStart = new Date(referenceDate);
  currentStart.setDate(currentStart.getDate() - daysToMonday);
  currentStart.setHours(0, 0, 0, 0);
  
  // Current week end: Sunday 23:59:59.999 (6 days after Monday)
  const currentEnd = new Date(currentStart);
  currentEnd.setDate(currentEnd.getDate() + 6);
  currentEnd.setHours(23, 59, 59, 999);
  
  // Previous week start: exactly 7 days before current week start
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 7);
  
  // Previous week end: Sunday 23:59:59.999
  const previousEnd = new Date(previousStart);
  previousEnd.setDate(previousEnd.getDate() + 6);
  previousEnd.setHours(23, 59, 59, 999);
  
  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd }
  };
}

/**
 * Calculate month period ranges
 * Current: Current calendar month (1st 00:00:00 to last day 23:59:59)
 * Previous: Previous calendar month (1st 00:00:00 to last day 23:59:59)
 * 
 * Handles variable month lengths (28-31 days)
 */
function calculateMonthRanges(referenceDate: Date): PeriodData {
  // Current month start: 1st day at 00:00:00
  const currentStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  currentStart.setHours(0, 0, 0, 0);
  
  // Current month end: last day at 23:59:59.999
  // Get first day of next month, then subtract 1 millisecond
  const currentEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  currentEnd.setHours(23, 59, 59, 999);
  
  // Previous month start: 1st day of previous month at 00:00:00
  const previousStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
  previousStart.setHours(0, 0, 0, 0);
  
  // Previous month end: last day of previous month at 23:59:59.999
  const previousEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0);
  previousEnd.setHours(23, 59, 59, 999);
  
  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd }
  };
}

/**
 * Calculate year period ranges
 * Current: Current calendar year (Jan 1 00:00:00 to Dec 31 23:59:59)
 * Previous: Previous calendar year (Jan 1 00:00:00 to Dec 31 23:59:59)
 * 
 * Handles leap years correctly
 */
function calculateYearRanges(referenceDate: Date): PeriodData {
  const currentYear = referenceDate.getFullYear();
  
  // Current year start: January 1 at 00:00:00
  const currentStart = new Date(currentYear, 0, 1);
  currentStart.setHours(0, 0, 0, 0);
  
  // Current year end: December 31 at 23:59:59.999
  const currentEnd = new Date(currentYear, 11, 31);
  currentEnd.setHours(23, 59, 59, 999);
  
  // Previous year start: January 1 of previous year at 00:00:00
  const previousStart = new Date(currentYear - 1, 0, 1);
  previousStart.setHours(0, 0, 0, 0);
  
  // Previous year end: December 31 of previous year at 23:59:59.999
  const previousEnd = new Date(currentYear - 1, 11, 31);
  previousEnd.setHours(23, 59, 59, 999);
  
  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd }
  };
}

/**
 * Calculate total period ranges
 * Current: All time (epoch to far future)
 * Previous: N/A (no previous period for total)
 */
function calculateTotalRanges(): PeriodData {
  // All time: from epoch to 100 years in the future (reasonable range for database queries)
  const currentStart = new Date(0); // Unix epoch (1970-01-01)
  const currentEnd = new Date();
  currentEnd.setFullYear(currentEnd.getFullYear() + 100); // 100 years from now
  currentEnd.setHours(23, 59, 59, 999);
  
  // No previous period for total
  const previousStart = new Date(0);
  const previousEnd = new Date(0);
  
  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd }
  };
}
