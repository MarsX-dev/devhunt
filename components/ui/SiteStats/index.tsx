import { type ReactNode } from 'react';
import { getSiteStats, statItems } from '@/utils/siteStats';
import SiteStatsBar from './SiteStatsBar';

// Terminal-style stats at the top of the home page (server-rendered, cached for 10 minutes);
// `live` is the activity line shown at the bottom of the same box.
export default async function SiteStats({ live }: { live?: ReactNode }) {
  const stats = await getSiteStats();
  if (!stats) return <>{live}</>;
  return <SiteStatsBar items={statItems(stats)} live={live} />;
}
