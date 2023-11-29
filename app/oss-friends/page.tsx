import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import Button from '@/components/ui/Button';
import LinkItem from '@/components/ui/Link/LinkItem';

type OSSFriend = {
  href: string;
  name: string;
  description: string;
};

const title = 'OSS Friends - Dev Hunt';

export const metadata = {
  title,
  openGraph: {
    title,
  },
  twitter: {
    title,
  },
};

export default async () => {
  const {
    data: { data },
  } = await axios.get('https://formbricks.com/api/oss-friends');

  return (
    <section className="mt-24 max-w-6xl mx-auto px-4 md:px-8">
      <h1 className="text-slate-50 text-3xl font-semibold text-center">Our Open-source Friends</h1>
      <div className="mt-12 space-y-6 gap-4 grid-cols-2 sm:grid lg:grid-cols-3 sm:space-y-0">
        {data.map((item: OSSFriend, key: number) => (
          <Link
            href={item.href}
            key={key}
            target="_blank"
            className="flex flex-col no-underline group relative space-y-3 w-full border border-slate-800 rounded-lg p-5 bg-[linear-gradient(179.23deg,_#1E293B_0.66%,_rgba(30,_41,_59,_0)_255.99%)] hover:bg-slate-800 duration-200"
          >
            <h2 className="text-base text-slate-100 font-semibold">{item.name}</h2>
            <p className="text-sm text-slate-300">{item.description}</p>
            <div className="flex-1 flex items-end">
              <Button variant="shiny" className="text-xs border border-slate-700 hover:bg-orange-600">
                Learn more
              </Button>
            </div>
          </Link>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <LinkItem
          target="_blank"
          href="https://formbricks.com/clhys1p9r001cpr0hu65rwh17"
          className="text-xs bg-orange-500 hover:bg-orange-600"
        >
          Wanna join OSS Friends?
        </LinkItem>
      </div>
    </section>
  );
};
