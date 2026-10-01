import SiteStats from '@/components/ui/SiteStats';
import LiveActivity from '@/components/ui/LiveActivity';
import CategoryGrid from '@/components/ui/CategoryGrid';
import FeaturedWinners from '@/components/ui/FeaturedWinners';
import { getRecentActivity } from '@/utils/recentActivity';
import { getHomeData } from '@/utils/homeData';
import { getSiteStats } from '@/utils/siteStats';
import HomeFeed from './HomeFeed';

// The home page is served from the CDN and rebuilt every 30s (its data caches refresh at the same pace).
export const revalidate = 30;

export const metadata = { alternates: { canonical: '/' } };

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'DevHunt',
      url: 'https://devhunt.org',
      logo: 'https://devhunt.org/devhuntog.png?v=2',
      sameAs: ['https://github.com/MarsX-dev/devhunt', 'https://x.com/devhunt_'],
      founder: { '@type': 'Person', name: 'John Rush', url: 'https://johnrush.me', sameAs: ['https://x.com/johnrush'] },
    },
    { '@type': 'WebSite', name: 'DevHunt', url: 'https://devhunt.org', description: 'A launchpad for dev tools, built by developers. New launches every week, voted by developers.' },
  ],
};

// Placeholder display names ("User", "test") look fake in the live strip.
const PLACEHOLDER_NAME = /^(user|test|admin|null|undefined|anonymous|guest)\d*$/i;

export default async function Home() {
  const [activity, data, stats] = await Promise.all([getRecentActivity(), getHomeData(), getSiteStats()]);
  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
    <HomeFeed
      data={data}
      uniqueVisitors={stats?.unique_visitors}
      featured={<FeaturedWinners />}
      votesToday={activity?.votes_today ?? {}} latestComments={activity?.latest_comments ?? {}} bottom={<CategoryGrid />}>
      <SiteStats live={<LiveActivity events={(activity?.events ?? []).filter(e => e.name?.length > 1 && !PLACEHOLDER_NAME.test(e.name))} />} />
    </HomeFeed>
    </>
  );
}
