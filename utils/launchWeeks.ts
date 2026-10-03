import moment from 'moment';

// Free launches per week; a week with this many tools (or more) is paid-only.
export const FREE_WEEK_CAPACITY = 15;
// Free launches per week for "other" tools (moderation 'not_a_fit'): their own queue, no competition.
export const OTHER_WEEK_CAPACITY = 10;

// Conversion test (2026-09-28): false hides the free launch option on the launch-date picker, so new
// tools only see the paid weeks. Tools still keep their free queue date, nothing else changes.
// Set back to true to offer the free launch again.
export const OFFER_FREE_LAUNCH = false;

// Week numbers repeat every year and the list spans years, so weeks are keyed by their start date (UTC).
export const weekKey = (date: Date | string) => moment.utc(date).format('YYYY-MM-DD');

export interface WeekCount {
  week: number;
  startDate: Date | string;
  endDate: Date | string;
  count: number;
}

// The week with a free slot whose start is closest to `currentDate`, or null if every week is full.
export function findNearestAvailableDate<T extends WeekCount>(dates: T[], currentDate = new Date(), capacity = FREE_WEEK_CAPACITY): (T & { timestamp: number }) | null {
  const currentTimestamp = currentDate.getTime();

  const availableDates = dates
    .filter(date => date.count < capacity)
    .map(date => ({
      ...date,
      timestamp: new Date(date.startDate).getTime(),
    }));

  availableDates.sort((a, b) => Math.abs(a.timestamp - currentTimestamp) - Math.abs(b.timestamp - currentTimestamp));

  return availableDates.length > 0 ? availableDates[0] : null;
}
