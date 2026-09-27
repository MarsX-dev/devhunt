import SiteStats from '@/components/ui/SiteStats';
import LiveActivity from '@/components/ui/LiveActivity';
import CategoryGrid from '@/components/ui/CategoryGrid';
import FeaturedWinners from '@/components/ui/FeaturedWinners';
import { getRecentActivity } from '@/utils/recentActivity';
import { getHomeData } from '@/utils/homeData';
import HomeFeed from './HomeFeed';

// Placeholder display names ("User", "test") look fake in the live strip.
const PLACEHOLDER_NAME = /^(user|test|admin|null|undefined|anonymous|guest)\d*$/i;

export default async function Home() {
  const [activity, data] = await Promise.all([getRecentActivity(), getHomeData()]);
  return (
    <HomeFeed
      data={data}
      featured={<FeaturedWinners />}
      votesToday={activity?.votes_today ?? {}} latestComments={activity?.latest_comments ?? {}} bottom={<CategoryGrid />}>
      <SiteStats />
      <LiveActivity events={(activity?.events ?? []).filter(e => e.name?.length > 1 && !PLACEHOLDER_NAME.test(e.name))} />
    </HomeFeed>
  );
}
