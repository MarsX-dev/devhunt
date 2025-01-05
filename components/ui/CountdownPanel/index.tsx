'use client';

import moment from 'moment';
import { useEffect, useState } from 'react';

const SponsorSkeleton = () => (
  <div className="mt-3 w-80 text-left sm:block border border-slate-700 bg-slate-900 rounded-md p-4 animate-pulse">
    <div className="h-4 w-16 bg-slate-700 rounded mb-2"></div>
    <div className="h-6 w-3/4 bg-slate-700 rounded mb-2"></div>
    <div className="h-4 w-full bg-slate-700 rounded mb-3"></div>
    <div className="space-y-2">
      <div className="h-4 w-2/3 bg-slate-700 rounded"></div>
      <div className="h-4 w-3/4 bg-slate-700 rounded"></div>
      <div className="h-4 w-2/3 bg-slate-700 rounded"></div>
    </div>
    <div className="h-8 w-full bg-orange-900/50 rounded mt-4"></div>
  </div>
);

const SponsorCard = ({ sponsor }) => {
  const { type, link, title, description, features, callToAction } = sponsor;

  return (
    <div className="mt-3 w-80 text-left sm:block border border-slate-700 bg-slate-900 rounded-md p-4 ">
      <span className="text-xs mb-1 block text-slate-600">{type}</span>
      <a href={link} target="_blank" rel="nofollow" className="text-slate-300 transition-opacity hover:text-slate-200">
        <div className="text text-orange-600 mb-1 font-bold">{title}</div>
        <div className="text-sm text-slate-300 justify-start mb-2">{description}</div>
        {features.map((feature, index) => (
          <div className='opacity-70' key={index}>
            → <span className='text-sm '>{feature}</span>
          </div>
        ))}
        <span className="mt-4 mb-3 block w-52 w-full bg-orange-900 text-white mx-0 p-1 text-sm rounded text-center">
          {callToAction}
        </span>
      </a>
    </div>
  );
};

const People = () => {
  const people = [
    { href: "/@JohnRush_bc21", name: "John Rush", image: "https://pbs.twimg.com/profile_images/1466385933612240901/qNMrMDlG_200x200.jpg" },
    { href: "/@sididev", name: "Sidi", image: "https://xpdhqqwgprlqmqaqmnyx.supabase.co/storage/v1/object/public/avatars/a90fe249-313d-4546-8dd7-39028bdb8cbf/picture" },
    { href: "/@vitalik_may", name: "Vitalik May", image: "https://xpdhqqwgprlqmqaqmnyx.supabase.co/storage/v1/object/public/avatars/daa6aea5-8b32-4c4a-9f31-9e2183ba7fb2/picture" },
    { href: "/@Tpuljak", name: "Toma Puljak", image: "https://avatars.githubusercontent.com/u/26512078?v=4" },
    { href: "/@KilianValkhof", name: "Kilian Valkhof", image: "https://avatars.githubusercontent.com/u/41970?v=4" },
    { href: "/@LukeDavidBryant_ea5", name: "Luke David Bryant", image: "https://avatars.githubusercontent.com/u/155965955?v=4" },
    { href: "/@osslate", name: "Fionn Kelleher", image: "https://avatars.githubusercontent.com/u/773673?v=4" },
    { href: "/@VladIlnitskiy_0a6", name: "Vlad Ilnitskiy", image: "https://avatars.githubusercontent.com/u/17927972?v=4" },
    { href: "/@Leech", name: "Leandro Ardissone", image: "https://avatars.githubusercontent.com/u/59826?v=4" },
    { href: "/@gdraganic", name: "Goran Draganić", image: "https://avatars.githubusercontent.com/u/6513388?v=4" },
    { href: "/@simonds", name: "Mark Simonds", image: "https://avatars.githubusercontent.com/u/138306?v=4" },
    { href: "/@G_67d", name: "Will", image: "https://xpdhqqwgprlqmqaqmnyx.supabase.co/storage/v1/object/public/avatars/0cfecc23-276f-4ff9-a404-6837c47bbdfb/picture" },
    { href: "/@NikolaosSakellarios_05e", name: "Nikolaos Sakellarios", image: "https://avatars.githubusercontent.com/u/3863839?v=4" },
    { href: "/@KevinMarville_e30", name: "Kevin Marville", image: "https://avatars.githubusercontent.com/u/116537485?v=4" },
    { href: "/@TomislavJakopec_26f", name: "Tomislav Jakopec", image: "https://avatars.githubusercontent.com/u/7893782?v=4" },
    { href: "/@DavorRunje_af9", name: "Davor Runje", image: "https://avatars.githubusercontent.com/u/24715380?v=4" },
    { href: "/@shpetimselaci", name: "Shpetim Selaci", image: "https://avatars.githubusercontent.com/u/23242179?v=4" },
    { href: "/@ZacharySmith_edd", name: "Zachary Smith", image: "https://avatars.githubusercontent.com/u/1000528?v=4" },
    { href: "/@amirrustam", name: "Amir R.", image: "https://avatars.githubusercontent.com/u/334337?v=4" },
    { href: "/@FernandoBold_531", name: "Fernando Bold", initials: "..." },
  ];

  return (
    <div className="mt-3">
      <ul className="max-w-4xl mx-auto gap-3 flex flex-wrap items-center">
        {people.map((person) => (
          <li 
            key={person.href} 
            className="flex-none w-8 h-8 hover:scale-105 duration-200 sm:w-10 sm:h-10"
          >
            <a data-state="closed" href={person.href}>
              <span>
                {person.image ? (
                  <img
                    className={`w-full h-full object-cover rounded-xl ${
                      person.hasBorder ? 'border-2 border-orange-500' : ''
                    }`}
                    alt={person.name}
                    src={person.image}
                  />
                ) : (
                  <span className="flex border border-2 border-slate-600 items-center justify-center text-slate-400 h-full w-full bg-slate-800 text-[10px] font-medium rounded-xl">
                    {person.initials}
                  </span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

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

  if (now.day() === 0 || (now.day() === 1 && now.hour() < 24)) {
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

const SponsorsSection = () => {
  const [sponsors, setSponsors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const response = await fetch('https://d1gl9g4ciwvjfq.cloudfront.net/api/GetDevhuntAds');
        if (!response.ok) throw new Error('Failed to fetch sponsors');
        const data = await response.json();
        setSponsors(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  if (error) {
    return <div className="text-red-500 p-4">Error loading sponsors</div>;
  }

  return (
    <div className="block sm:flex gap-2">
      {isLoading ? (
        <>
          <SponsorSkeleton />
          <SponsorSkeleton />
        </>
      ) : (
        sponsors.map((sponsor, index) => (
          <SponsorCard key={index} sponsor={sponsor} />
        ))
      )}
    </div>
  );
};

export default () => {
  return (
    <div className="flex rounded-xl  flex-col gap-1 md:gap-2">
      <div className="flex flex-col  gap-3">
        <h1 className="text-slate-200 text-xl font-bold">Find Best Dev Tools Voted by Developers!</h1>
        <p>
          <span className="text-2xl font-bold mb-4 text-orange-500">Vote Closing In: </span>
        </p>
        <div className="text-slate-100 flex gap-1 items-center">
          <RenderCountdown />
        </div>
        <div className="max-w-lg mt-2 text-slate-400">
          100k+ developers found Dev Tools here.
          <People/>
          <div className="mt-3 block">
            See how{' '}
            <a
              className="underline transition-opacity hover:text-scale-1200"
              href="https://twitter.com/johnrushx/status/1661534492949872641"
            >
              it started
            </a>
            .
          </div>
          <div className='block p-2'></div>
          <SponsorsSection />
        </div>
      </div>
    </div>
  );
};