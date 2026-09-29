import LaunchPlan from './LaunchPlan';
import { getPublicStats, statsSummary } from '@/utils/publicStats';

// Server wrapper so the pitch can quote the live /stats numbers (cached, no per-visitor query).
export default async function ActivateLaunchPage({ params }: { params: { slug: string } }) {
  const stats = await getPublicStats().catch(() => null);
  return <LaunchPlan params={params} stats={stats ? statsSummary(stats) : null} />;
}
