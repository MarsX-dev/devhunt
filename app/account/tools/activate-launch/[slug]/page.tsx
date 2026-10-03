import LaunchPlan from './LaunchPlan';
import { getPublicStats, statsSummary } from '@/utils/publicStats';
import { getLaunchShowcase } from '@/utils/launchShowcase';

// Server wrapper so the pitch can quote the live /stats numbers and real launch results (cached, no
// per-visitor query).
export default async function ActivateLaunchPage({ params }: { params: { slug: string } }) {
  const [stats, showcase] = await Promise.all([getPublicStats().catch(() => null), getLaunchShowcase().catch(() => null)]);
  return <LaunchPlan params={params} stats={stats ? statsSummary(stats) : null} showcase={showcase} />;
}
