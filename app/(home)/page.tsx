import SiteStats from '@/components/ui/SiteStats';
import LiveActivity from '@/components/ui/LiveActivity';
import CategoryGrid from '@/components/ui/CategoryGrid';
import FeaturedWinners from '@/components/ui/FeaturedWinners';
import { getRecentActivity } from '@/utils/recentActivity';
import { getHomeData } from '@/utils/homeData';
import HomeFeed from './HomeFeed';

export const metadata = { alternates: { canonical: '/' } };

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'DevHunt',
      url: 'https://devhunt.org',
      logo: 'https://devhunt.org/devhuntog.png?v=2',
      sameAs: ['https://github.com/MarsX-dev/devhunt', 'https://x.com/johnrush'],
    },
    { '@type': 'WebSite', name: 'DevHunt', url: 'https://devhunt.org', description: 'A launchpad for dev tools, built by developers. New launches every week, voted by developers.' },
  ],
};

// Placeholder display names ("User", "test") look fake in the live strip.
const PLACEHOLDER_NAME = /^(user|test|admin|null|undefined|anonymous|guest)\d*$/i;

export default async function Home() {
  const [activity, data] = await Promise.all([getRecentActivity(), getHomeData()]);
  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
    <HomeFeed
      data={data}
      featured={<FeaturedWinners />}
      votesToday={activity?.votes_today ?? {}} latestComments={activity?.latest_comments ?? {}} bottom={<CategoryGrid />}>
      <SiteStats live={<LiveActivity events={(activity?.events ?? []).filter(e => e.name?.length > 1 && !PLACEHOLDER_NAME.test(e.name))} />} />
    </HomeFeed>
    </>
  );
}
