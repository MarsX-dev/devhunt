'use client';

import moment from 'moment';
import { useEffect, useState } from 'react';

function RenderDatePart({ number, letter }: { number: number; letter: string }) {
  return (
    <div className="rounded-md p-[1px] overflow-hidden bg-gradient-to-b from-[#514b6130] to-[#514b6100]">
      <div className="py-2 px-3 rounded-md w-11 leading-4 flex items-center justify-center bg-gradient-to-b from-[#51269c40] to-[#DBB8BF10] backdrop-blur-md">
        <span className="m-0">{number}</span>
        <span>{letter}</span>
      </div>
    </div>
  );
}

function DatePartSkeleton() {
  return (
    <div className="rounded-md p-[1px] bg-slate-700 animate-pulse">
      <div className="w-9 h-7"></div>
    </div>
  );
}

function RenderCountdown() {
  const [isLoading, setLoading] = useState(true);
  let [now, setNow] = useState(moment().utc());
  let nextMondayNight;

  // Set hours to 24 (end of day), minutes and seconds to zero
  if (now.day() === 0 || (now.day() === 1 && now.hour() < 24)) {
    // If today is Sunday or Monday but before midnight
    nextMondayNight = now.clone().endOf('d');

    if (now.day() === 0) {
      nextMondayNight = nextMondayNight.add(1, 'd');
    }
  } else {
    nextMondayNight = now.clone().startOf('isoWeek').add(1, 'week').day('Monday').endOf('d');
  }
  const diff = moment.duration(nextMondayNight.diff(now));

  const [days, setdays] = useState(Math.floor(diff.asHours() / 24));
  const [hours, setHours] = useState(diff.hours());
  const [minutes, setMinutes] = useState(diff.minutes());
  const [seconds, setSeconds] = useState(diff.seconds());

  useEffect(() => {
    setTimeout(() => {
      setNow(moment().utc());
      setSeconds(diff.seconds());
      setMinutes(diff.minutes());
      setHours(diff.hours());
      setdays(Math.floor(diff.asHours() / 24));
    }, 1000);
  }, [now]);

  useEffect(() => {
    setLoading(false);
  }, []);

  return isLoading ? (
    <>
      <DatePartSkeleton />
      :
      <DatePartSkeleton />
      :
      <DatePartSkeleton />
      :
      <DatePartSkeleton />
    </>
  ) : (
    <>
      {days > 0 ? (
        <>
          <RenderDatePart number={days} letter="d" /> :{' '}
        </>
      ) : (
        <></>
      )}
      <RenderDatePart number={hours} letter="h" /> :
      <RenderDatePart number={minutes} letter="m" /> :
      <RenderDatePart number={seconds} letter="s" />
    </>
  );
}

export default () => {
  return (
    <div className="flex border rounded-xl border-slate-800 bg-slate-800 p-5 flex-col gap-1 md:gap-2 items-center justify-end">
      <div className="px-2 flex flex-col items-center text-center gap-3">
        <p>
          <span className="text-2xl font-bold mb-4 text-orange-500">Vote Closing In: </span>
        </p>
        <div className="text-slate-100 flex gap-1 items-center">
          <RenderCountdown />
        </div>
        <div className="max-w-lg text-slate-400">
          Winners get a free shout-out in our newsletter, social media mentions, a winner's badge and more perks.
          <div className="inline sm:block">
            {' '}
            See details{' '}
            <a className="underline transition-opacity hover:text-scale-1200" href="/the-story">
              here
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
};
