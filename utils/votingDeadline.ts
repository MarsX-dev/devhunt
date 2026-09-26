import moment from 'moment';

// Voting for a launch week closes at the end of Monday (UTC); the next week starts Tuesday.
export function votingDeadline(now: moment.Moment) {
  const utc = now.clone().utc();
  if (utc.day() === 0 || utc.day() === 1) return utc.day(1).endOf('day');
  return utc.startOf('isoWeek').add(1, 'week').endOf('day');
}

// The last 24 hours before voting closes.
export const isFinalHours = (now: moment.Moment) => votingDeadline(now).diff(now, 'hours', true) < 24;
