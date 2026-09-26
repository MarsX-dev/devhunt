import { getSiteStats, statItems } from '@/utils/siteStats';
import SiteStatsBar from './SiteStatsBar';

// Compact stats bar at the top of the home page (server-rendered, cached for 10 minutes).
export default async function SiteStats() {
  const stats = await getSiteStats();
  if (!stats) return null;
  return <SiteStatsBar items={statItems(stats)} />;
}
