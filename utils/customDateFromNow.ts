import moment from 'moment';

export default function customDateFromNow(date: string | number) {
  const now = moment();
  const inputDate = moment(date);

  // Calculate the difference in days
  const diffDays = now.diff(inputDate, 'days');

  if (Math.abs(diffDays) < 7) {
    return inputDate.fromNow(); // Use fromNow() for differences less than a week
  } else {
    return inputDate.format('MMMM Do YYYY'); // Display regular date for anything older than a week
  }
}
