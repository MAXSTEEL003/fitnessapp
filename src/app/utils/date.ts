/**
 * Timezone and Date Utility for Asia/Kolkata
 * 
 * Ensures consistent date strings (YYYY-MM-DD) in Asia/Kolkata timezone
 * preventing entries from shifting or displaying on the wrong day.
 */

export const APP_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Kolkata timezone.
 */
export function getTodayDateString(): string {
  return formatDateToKolkata(new Date());
}

/**
 * Formats any Date object, ISO string, or timestamp to YYYY-MM-DD in Asia/Kolkata timezone.
 */
export function formatDateToKolkata(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' 
    ? new Date(dateInput) 
    : dateInput;
  
  if (isNaN(date.getTime())) {
    // Fallback if invalid date
    return new Date().toISOString().split('T')[0];
  }

  // Use 'en-CA' locale which outputs YYYY-MM-DD format deterministically
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Adds or subtracts days from a YYYY-MM-DD date string safely.
 */
export function shiftDateString(dateStr: string, days: number): string {
  // Parse parts to avoid UTC boundary shifts
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatDateToKolkata(date);
}

/**
 * Formats a YYYY-MM-DD date string for user-friendly display (e.g., "Today", "Yesterday", or "Tue, Nov 18").
 */
export function formatDisplayDate(dateStr: string): string {
  const today = getTodayDateString();
  if (dateStr === today) return 'Today';
  
  const yesterday = shiftDateString(today, -1);
  if (dateStr === yesterday) return 'Yesterday';

  const tomorrow = shiftDateString(today, 1);
  if (dateStr === tomorrow) return 'Tomorrow';

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Formats a YYYY-MM-DD date string with full year for section headers (e.g., "November 18, 2026").
 */
export function formatFullDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
