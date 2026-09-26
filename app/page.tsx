import SiteStats from '@/components/ui/SiteStats';
import LiveActivity from '@/components/ui/LiveActivity';
import CategoryGrid from '@/components/ui/CategoryGrid';
import { getRecentActivity } from '@/utils/recentActivity';
import HomeFeed from './HomeFeed';

// Placeholder display names ("User", "test") look fake in the live strip.
const PLACEHOLDER_NAME = /^(user|test|admin|null|undefined|anonymous|guest)\d*$/i;

export default async function Home() {
  const activity = await getRecentActivity();
  return (
    <HomeFeed votesToday={activity?.votes_today ?? {}} bottom={<CategoryGrid />}>
      <SiteStats />
      <LiveActivity events={(activity?.events ?? []).filter(e => e.name?.length > 1 && !PLACEHOLDER_NAME.test(e.name))} />
    </HomeFeed>
  );
}
