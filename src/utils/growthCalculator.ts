/**
 * Calculate growth percentage between current and previous values
 * 
 * Formula: ((current - previous) / previous) * 100
 * 
 * Special cases:
 * - If previous === 0: returns null (to display "N/A")
 * - If current === 0 && previous === 0: returns 0
 * - Result is rounded to 1 decimal place
 * 
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Growth percentage rounded to 1 decimal place, or null if previous is 0
 * 
 * @example
 * calculateGrowth(150, 100) // returns 50.0
 * calculateGrowth(80, 100) // returns -20.0
 * calculateGrowth(100, 0) // returns null
 * calculateGrowth(0, 0) // returns 0
 */
export function calculateGrowth(current: number, previous: number): number | null {
  // Special case: both values are zero
  if (current === 0 && previous === 0) {
    return 0;
  }
  
  // Special case: previous is zero (cannot divide by zero)
  if (previous === 0) {
    return null;
  }
  
  // Calculate growth percentage
  const growth = ((current - previous) / previous) * 100;
  
  // Round to 1 decimal place
  return Math.round(growth * 10) / 10;
}
