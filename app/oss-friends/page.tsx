import Image from 'next/image';
import PageHeader from '@/components/ui/PageHeader';
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
    <section className="mt-10 mb-24 max-w-6xl mx-auto px-4 md:px-8">
      <PageHeader eyebrow="Community" title="Our open-source friends">
        Open-source projects we love and support.
      </PageHeader>
      <div className="mt-10 space-y-3 gap-3 grid-cols-2 sm:grid lg:grid-cols-3 sm:space-y-0">
        {data.map((item: OSSFriend, key: number) => (
          <Link
            href={item.href}
            key={key}
            target="_blank"
            className="flex flex-col no-underline group relative space-y-3 w-full border border-slate-800 rounded-2xl p-5 duration-150 hover:border-slate-600 hover:bg-slate-800/30"
          >
            <h2 className="text-base text-slate-100 font-semibold">{item.name}</h2>
            <p className="text-sm text-slate-300">{item.description}</p>
            <div className="flex-1 flex items-end">
              <span className="text-sm text-slate-400 duration-150 group-hover:text-slate-100">Learn more →</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <LinkItem
          target="_blank"
          href="https://formbricks.com/clhys1p9r001cpr0hu65rwh17"
          className="rounded-full border border-slate-700 bg-transparent text-sm text-slate-300 hover:border-slate-500 hover:bg-transparent hover:text-slate-50"
        >
          Want to join OSS Friends?
        </LinkItem>
      </div>
    </section>
  );
};
